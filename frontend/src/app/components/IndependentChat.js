"use client";

import { MessageCircle, X, RefreshCw, AlertCircle } from "lucide-react";
import Markdown from "./Markdown";
import { useChat } from "../hooks/useChat";

const SAMPLE_PROMPTS = [
  "BIST'te son durum nedir? Genel değerlendirme yapar mısın?",
  "THYAO ve ASELS'i karşılaştırır mısın?",
  "Bu hafta BIST 100'de dikkat çeken sektörler hangileri?",
  "AAPL hissesi için güncel haberler neler?",
  "Kripto piyasasında BTC ve ETH için kısa vadeli görüşün nedir?",
];

function MessageBubble({ msg, markdownMode }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}`}
    >
      {msg.role === "tool" ? (
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", fontStyle: "italic", marginBottom: "0.3rem" }}>
            🔎 {msg.toolName || "Araç"} çalıştırıldı
          </div>
          <Markdown content={msg.content} />
        </div>
      ) : markdownMode && !isUser ? (
        <Markdown content={msg.content} />
      ) : (
        msg.content.split("\n").map((line, lIdx) => (
          <p key={lIdx} style={{ margin: "0 0 0.5rem 0" }}>
            {line.split("**").map((chunk, cIdx) =>
              cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
            )}
          </p>
        ))
      )}
    </div>
  );
}

export default function IndependentChat() {
  const {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    sessionStatus,
    error,
    sendMessage,
    handleStop,
    handleNewSession,
    chatEndRef,
  } = useChat({ mode: "independent" });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const isEmpty = messages.length === 0 && sessionStatus !== "init";

  return (
    <div
      className="card glass animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minHeight: "70vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageCircle size={20} style={{ color: "var(--primary)" }} />
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
              LongBridge AI — Bağımsız Sohbet
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8 }}>
              Ticker bağımsız • güncel veri araçları • Türkçe
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {sessionStatus === "expired" && (
            <span style={{ fontSize: "0.75rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <AlertCircle size={14} /> Oturum süresi doldu
            </span>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleNewSession}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
            aria-label="Yeni sohbet başlat"
          >
            <RefreshCw size={14} style={{ marginRight: "0.35rem" }} />
            Yeni Sohbet
          </button>
        </div>
      </div>

      <div
        className="chat-container"
        style={{ minHeight: "55vh", maxHeight: "65vh" }}
      >
        <div className="chat-messages">
          {isEmpty && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1rem 0",
              }}
            >
              <p style={{ margin: 0, color: "var(--secondary-foreground)", fontSize: "0.85rem" }}>
                💡 Örnek sorularla başlayabilirsiniz:
              </p>
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                  className="search-suggestion-item"
                  style={{
                    borderRadius: "var(--radius)",
                    background: "rgba(255,255,255,0.03)",
                    textAlign: "left",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} msg={msg} markdownMode={true} />
          ))}

          {loading && (
            <div className="chat-bubble chat-bubble-assistant">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", margin: "0.5rem 0 0 0" }}>
                Düşünüyor, gerekirse araçlarla güncel veri çekiyor...
              </p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {error && (
          <div
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(239, 68, 68, 0.1)",
              borderTop: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="chat-input-area">
          <input
            type="text"
            placeholder="Bir hisse, sektör veya piyasa sorusu yazın..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="chat-input"
            aria-label="Mesajınızı yazın"
            maxLength={4000}
          />
          {loading ? (
            <button
              type="button"
              onClick={handleStop}
              className="btn btn-secondary"
              aria-label="Yanıtı durdur"
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.8rem",
              }}
            >
              <X size={14} /> Durdur
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim()}
              aria-label="Mesaj gönder"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
              }}
            >
              Gönder
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
