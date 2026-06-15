"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { apiUrl } from "../utils/api";

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
  const inputRef = useRef(input);

  useEffect(() => { inputRef.current = input; }, [input]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const createSession = useCallback(async () => {
    const r = await fetch(apiUrl("/api/chat/session"), { 
      method: "POST", 
      signal: AbortSignal.timeout(8000) 
    });
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
        const res = await fetch(apiUrl(`/api/chat/session/${cached}`));
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
    const timer = setTimeout(() => {
      initSession();
    }, 0);
    return () => clearTimeout(timer);
  }, [initSession]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      const messageText = (text ?? inputRef.current).trim();
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

        const res = await fetch(apiUrl(endpoint), {
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
              { role: "assistant", content: `Bağlam **${ticker}** hissesine geçildi.` },
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
          let errDetail = "";
          try {
            const errJson = await res.json();
            errDetail = errJson.detail || errJson.message || "";
          } catch (_) {
            errDetail = await res.text().catch(() => "");
          }

          let userMsg = "";
          if (res.status === 502) {
            // Backend mesajı session'a kaydetmiş olabilir, session'ı sorgulayıp kurtarmayı dene
            userMsg = "Yapay zeka modeli şu an yanıt üretemiyor. Lütfen biraz bekleyip tekrar deneyin.";
            try {
              const sessionRes = await fetch(apiUrl(`/api/chat/session/${sid}`));
              if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                if (sessionData.messages && sessionData.messages.length > 0) {
                  const existingUserMsgs = new Set();
                  setMessages((prev) => {
                    prev.forEach((m) => { if (m.role === "user") existingUserMsgs.add(m.content); });
                    const newMsgs = sessionData.messages.filter(
                      (m) => m.role !== "user" || !existingUserMsgs.has(m.content)
                    );
                    if (newMsgs.length > 0) {
                      return [...prev, ...newMsgs];
                    }
                    return prev;
                  });
                  setError("");
                  setLoading(false);
                  abortControllerRef.current = null;
                  return;
                }
              }
            } catch (_) { /* session sorgulama başarısız, normal hata akışı */ }
          } else if (res.status === 500) {
            userMsg = "Sunucuda beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
          } else if (res.status === 429) {
            userMsg = "Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.";
          } else if (res.status === 400) {
            userMsg = errDetail || "Geçersiz istek. Lütfen mesajınızı kontrol edin.";
          } else {
            userMsg = `Sunucu hatası (${res.status}): ${errDetail.slice(0, 120)}`;
          }

          setError(userMsg);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Üzgünüm, şu an yanıt veremiyorum. ${userMsg}` },
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
    [loading, mode, ticker, endpoint, createSession, sessionKey]
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
