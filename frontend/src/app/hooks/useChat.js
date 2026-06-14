"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const TICKER_SESSION_KEY = "longbridgeChatSessionId";
const INDEPENDENT_SESSION_KEY = "longbridgeChatSessionIdIndependent";

function loadSessionId(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function saveSessionId(key, sid) {
  try {
    if (sid) localStorage.setItem(key, sid);
    else localStorage.removeItem(key);
  } catch (_) {}
}

/**
 * Encapsulates all chat state + side effects. Supports two modes:
 * - "ticker": posts to /api/chat/v2 with the current ticker; resets history
 *   when the ticker changes server-side. Tied to the StockDetail tab.
 * - "independent": posts to /api/chat/independent, no ticker context,
 *   backend may invoke tools.
 *
 * Returns: messages, input, setInput, loading, sessionId, sendMessage,
 * handleStop, handleNewSession, sessionStatus, error, chatEndRef
 */
export function useChat({ mode, ticker = null } = {}) {
  if (mode !== "ticker" && mode !== "independent") {
    throw new Error(`useChat: mode must be 'ticker' or 'independent' (got ${mode})`);
  }

  const sessionKey = mode === "ticker" ? TICKER_SESSION_KEY : INDEPENDENT_SESSION_KEY;
  const endpoint = mode === "ticker" ? "/api/chat/v2" : "/api/chat/independent";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("init");
  const [error, setError] = useState("");
  const sessionIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const createSession = useCallback(async () => {
    const r = await fetch("/api/chat/session", { method: "POST" });
    if (!r.ok) throw new Error("Oturum oluşturulamadı");
    const d = await r.json();
    setSessionId(d.session_id);
    sessionIdRef.current = d.session_id;
    saveSessionId(sessionKey, d.session_id);
    return d.session_id;
  }, [sessionKey]);

  const initSession = useCallback(async () => {
    setSessionStatus("init");
    const cached = loadSessionId(sessionKey);
    if (cached) {
      try {
        const res = await fetch(`/api/chat/session/${cached}`);
        if (res.ok) {
          const data = await res.json();
          setSessionId(cached);
          sessionIdRef.current = cached;
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
          setSessionStatus("ready");
          return;
        }
        if (res.status === 404) {
          saveSessionId(sessionKey, null);
        }
      } catch (_) {
        // Network error — don't clear session, it may be temporary
      }
    }
    try {
      await createSession();
      setSessionStatus("ready");
    } catch (_) {
      setError("Oturum oluşturulamadı. Backend çalışıyor mu?");
      setSessionStatus("expired");
    }
  }, [sessionKey, createSession]);

  useEffect(() => {
    queueMicrotask(() => {
      initSession();
    });
  }, [initSession]);

  const handleNewSession = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(false);
    setMessages([]);
    setError("");
    saveSessionId(sessionKey, null);
    setSessionId(null);
    sessionIdRef.current = null;
    await initSession();
  }, [initSession, sessionKey]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const messageText = (text ?? input).trim();
      if (!messageText || loading) return;
      setMessages((prev) => [...prev, { role: "user", content: messageText }]);
      setInput("");
      setError("");

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);

      try {
        let sid = sessionIdRef.current;
        if (!sid) sid = await createSession();

        const body =
          mode === "ticker"
            ? { session_id: sid, message: messageText, ticker }
            : { session_id: sid, message: messageText };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (mode === "ticker" && data.ticker_changed) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Bağlam **${data.new_ticker || ticker}** hissesine geçildi.` },
              { role: "assistant", content: data.reply },
            ]);
          } else {
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
          }
        } else if (res.status === 404) {
          saveSessionId(sessionKey, null);
          setSessionStatus("expired");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Oturum süresi dolmuş. **Yeni Sohbet** butonuyla yeni bir oturum başlatabilirsiniz.",
            },
          ]);
        } else {
          const errText = await res.text();
          setError(`Sunucu hatası: ${errText.slice(0, 200)}`);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Üzgünüm, şu an yanıt veremiyorum. (${errText.slice(0, 120)})` },
          ]);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "⏹ Yanıt durduruldu." },
          ]);
          return;
        }
        setError(err.message || "Bilinmeyen hata");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Bağlantı hatası: ${err.message || "Bilinmiyor"}` },
        ]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, loading, mode, ticker, endpoint, createSession, sessionKey]
  );

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    sessionId,
    sessionStatus,
    error,
    sendMessage,
    handleStop,
    handleNewSession,
    chatEndRef,
  };
}
