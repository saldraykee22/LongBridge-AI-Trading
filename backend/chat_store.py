"""In-memory chat session store.

Sessions are scoped by an opaque UUID issued by the server. Each session tracks
the message history plus the currently selected ticker (so that ticker changes
can transparently reset the visible context). Expired sessions are cleaned up
on every access (lazy eviction).
"""

import os
import threading
import time
import uuid
from typing import Optional


class ChatStore:
    def __init__(self, ttl_seconds: Optional[int] = None) -> None:
        if ttl_seconds is None:
            try:
                ttl_seconds = int(os.getenv("CHAT_SESSION_TTL", "3600"))
            except ValueError:
                ttl_seconds = 3600
        self._ttl = ttl_seconds
        self._sessions: dict[str, dict] = {}
        self._lock = threading.Lock()

    @staticmethod
    def new_session_id() -> str:
        return str(uuid.uuid4())

    def create(self) -> str:
        sid = self.new_session_id()
        with self._lock:
            self._cleanup_locked()
            self._sessions[sid] = {
                "messages": [],
                "current_ticker": None,
                "last_active": time.time(),
            }
        return sid

    def exists(self, sid: str) -> bool:
        with self._lock:
            self._cleanup_locked()
            return sid in self._sessions

    def get_messages(self, sid: str) -> list[dict]:
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session is None:
                return []
            return list(session["messages"])

    def get_current_ticker(self, sid: str) -> Optional[str]:
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session is None:
                return None
            return session["current_ticker"]

    def touch(self, sid: str) -> bool:
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session is None:
                return False
            session["last_active"] = time.time()
            return True

    def reset_messages(self, sid: str) -> bool:
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session is None:
                return False
            session["messages"] = []
            session["last_active"] = time.time()
            return True

    def set_ticker(self, sid: str, ticker: Optional[str]) -> tuple[bool, bool]:
        """Update the session's current ticker. If the ticker changed, the
        message history is reset so the LLM context stays coherent.

        Returns (session_exists, did_reset).
        """
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session is None:
                return False, False
            did_reset = False
            normalized = ticker.replace(" ", "").upper() if ticker and ticker.replace(" ", "") else None
            if normalized != session["current_ticker"]:
                if session["current_ticker"] is not None:
                    session["messages"] = []
                    did_reset = True
                session["current_ticker"] = normalized
            session["last_active"] = time.time()
            return True, did_reset

    def add_message(self, sid: str, role: str, content: str) -> bool:
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session is None:
                return False
            session["messages"].append({"role": role, "content": content})
            session["last_active"] = time.time()
            return True

    def rollback_last_message(self, sid: str, role: str, content: str) -> bool:
        """Rollback the last message in the session if it matches the role and content.
        
        This prevents encapsulation violation and verifies the message content to avoid
        race conditions where another message might have been appended.
        """
        with self._lock:
            self._cleanup_locked()
            session = self._sessions.get(sid)
            if session and session["messages"]:
                last_msg = session["messages"][-1]
                if last_msg["role"] == role and last_msg["content"] == content:
                    session["messages"].pop()
                    session["last_active"] = time.time()
                    return True
        return False

    def stats(self) -> dict:
        with self._lock:
            return {
                "active_sessions": len(self._sessions),
                "ttl_seconds": self._ttl,
            }

    def _cleanup_locked(self) -> None:
        now = time.time()
        expired = [
            sid for sid, s in self._sessions.items()
            if now - s["last_active"] > self._ttl
        ]
        for sid in expired:
            del self._sessions[sid]


chat_store = ChatStore()
