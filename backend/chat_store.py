"""SQLite-backed chat session store.

Sessions are scoped by an opaque UUID issued by the server. Each session tracks
the message history plus the currently selected ticker (so that ticker changes
can transparently reset the visible context). Expired sessions are cleaned up
on every access (lazy eviction).
"""

import os
import time
import uuid
from typing import Optional
from models import ChatSession, db
from loguru import logger

class ChatStore:
    def __init__(self, ttl_seconds: Optional[int] = None) -> None:
        if ttl_seconds is None:
            try:
                ttl_seconds = int(os.getenv("CHAT_SESSION_TTL", "3600"))
            except ValueError:
                ttl_seconds = 3600
        self._ttl = ttl_seconds

    @staticmethod
    def new_session_id() -> str:
        return str(uuid.uuid4())

    def create(self) -> str:
        sid = self.new_session_id()
        self._cleanup()
        with db.atomic():
            ChatSession.create(
                session_id=sid,
                messages=[],
                current_ticker=None,
                last_active=time.time()
            )
        return sid

    def exists(self, sid: str) -> bool:
        self._cleanup()
        return ChatSession.select().where(ChatSession.session_id == sid).exists()

    def get_messages(self, sid: str) -> list[dict]:
        self._cleanup()
        try:
            session = ChatSession.get(ChatSession.session_id == sid)
            return list(session.messages) if session.messages else []
        except ChatSession.DoesNotExist:
            return []

    def get_current_ticker(self, sid: str) -> Optional[str]:
        self._cleanup()
        try:
            session = ChatSession.get(ChatSession.session_id == sid)
            return session.current_ticker
        except ChatSession.DoesNotExist:
            return None

    def touch(self, sid: str) -> bool:
        self._cleanup()
        try:
            session = ChatSession.get(ChatSession.session_id == sid)
            session.last_active = time.time()
            session.save()
            return True
        except ChatSession.DoesNotExist:
            return False

    def reset_messages(self, sid: str) -> bool:
        self._cleanup()
        try:
            session = ChatSession.get(ChatSession.session_id == sid)
            session.messages = []
            session.last_active = time.time()
            session.save()
            return True
        except ChatSession.DoesNotExist:
            return False

    def set_ticker(self, sid: str, ticker: Optional[str]) -> tuple[bool, bool]:
        """Update the session's current ticker. If the ticker changed, the
        message history is reset so the LLM context stays coherent.

        Returns (session_exists, did_reset).
        """
        self._cleanup()
        try:
            session = ChatSession.get(ChatSession.session_id == sid)
            did_reset = False
            normalized = ticker.replace(" ", "").upper() if ticker and ticker.replace(" ", "") else None
            if normalized != session.current_ticker:
                if session.current_ticker is not None:
                    session.messages = []
                    did_reset = True
                session.current_ticker = normalized
            session.last_active = time.time()
            session.save()
            return True, did_reset
        except ChatSession.DoesNotExist:
            return False, False

    def add_message(self, sid: str, role: str, content: str) -> bool:
        self._cleanup()
        try:
            with db.atomic():
                session = ChatSession.get(ChatSession.session_id == sid)
                msgs = list(session.messages) if session.messages else []
                msgs.append({"role": role, "content": content})
                session.messages = msgs
                session.last_active = time.time()
                session.save()
            return True
        except ChatSession.DoesNotExist:
            return False

    def rollback_last_message(self, sid: str, role: str, content: str) -> bool:
        """Rollback the last message in the session if it matches the role and content."""
        self._cleanup()
        try:
            with db.atomic():
                session = ChatSession.get(ChatSession.session_id == sid)
                msgs = list(session.messages) if session.messages else []
                if msgs:
                    last_msg = msgs[-1]
                    if last_msg["role"] == role and last_msg["content"] == content:
                        msgs.pop()
                        session.messages = msgs
                        session.last_active = time.time()
                        session.save()
                        return True
            return False
        except ChatSession.DoesNotExist:
            return False

    def stats(self) -> dict:
        return {
            "active_sessions": ChatSession.select().count(),
            "ttl_seconds": self._ttl,
        }

    def _cleanup(self) -> None:
        now = time.time()
        expiry_threshold = now - self._ttl
        # Using execute() correctly for Peewee delete queries
        deleted = ChatSession.delete().where(ChatSession.last_active <= expiry_threshold).execute()
        if deleted > 0:
            logger.info(f"Cleaned up {deleted} expired chat sessions.")

chat_store = ChatStore()
