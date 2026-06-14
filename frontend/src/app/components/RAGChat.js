"use client";

import { useState } from "react";
import { Send, X, RefreshCw, MessageCircle, AlertCircle } from "lucide-react";
import Markdown from "./Markdown";
import { useChat } from "../hooks/useChat";

const SAMPLE_QUESTIONS = [
  "F/K oranı nasıl?",
  "Bu hisse için kısa vadeli görüşün nedir?",
  "Son haberler neler?",
  "Bu sektörün rakipleri kim?",
];

export default function RAGChat({ ticker }) {
  const {
    messages,
    input,
    setInput,
    loading,
    sessionStatus,
    error,
    sendMessage,
    handleStop,
    handleNewSession,
    chatEndRef,
  } = useChat({ mode: "ticker", ticker });

  const [showSamples, setShowSamples] = useState(true);

  const handleSampleClick = (q) => {
    sendMessage(q);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const isEmpty = messages.length === 0 && sessionStatus === "ready";

  return (
    <div
      className="card glass animate-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0.5rem",
          flexWrap: "wrap",
          gap: "0.4rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageCircle size={18} style={{ color: "var(--primary)" }} />
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>
              LongBridge AI Sohbet
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--secondary-foreground)", opacity: 0.8 }}>
              {ticker ? `Bağlam: ${ticker.toUpperCase()}` : "Hisse bağlamı yükleniyor..."}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {sessionStatus === "expired" && (
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
              }}
            >
              <AlertCircle size={12} /> Oturum doldu
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNewSession}
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem" }}
            aria-label="Yeni sohbet başlat"
            title="Yeni sohbet"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {isEmpty && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.5rem 0" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "var(--secondary-foreground)",
                }}
              >
                💡 Örnek sorular:
              </p>
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSampleClick(q)}
                  disabled={loading}
                  className="search-suggestion-item"
                  style={{
                    borderRadius: "var(--radius)",
                    background: "rgba(255,255,255,0.03)",
                    fontSize: "0.82rem",
                    padding: "0.45rem 0.7rem",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}`}
              >
                {isUser ? (
                  msg.content.split("\n").map((line, lIdx) => (
                    <p key={lIdx} style={{ margin: "0 0 0.5rem 0" }}>
                      {line}
                    </p>
                  ))
                ) : (
                  <Markdown content={msg.content} />
                )}
              </div>
            );
          })}

          {loading && (
            <div className="chat-bubble chat-bubble-assistant">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <div
            style={{
              padding: "0.4rem 0.8rem",
              background: "rgba(239, 68, 68, 0.1)",
              borderTop: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: "0.72rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="chat-input-area">
          <input
            type="text"
            placeholder={ticker ? `${ticker.toUpperCase()} hakkında sor...` : "Hisse seçin..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !ticker}
            className="chat-input"
            aria-label="Soru mesajınızı yazın"
            maxLength={4000}
          />
          {loading ? (
            <button
              type="button"
              onClick={handleStop}
              className="btn btn-secondary"
              aria-label="Yanıtı durdur"
              style={{
                padding: "0.5rem 0.8rem",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.78rem",
              }}
            >
              <X size={13} /> Durdur
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || !ticker}
              aria-label="Mesaj gönder"
              style={{ padding: "0.5rem 0.9rem", borderRadius: "9999px", fontSize: "0.78rem" }}
            >
              <Send size={13} /> Gönder
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
