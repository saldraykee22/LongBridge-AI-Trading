"use client";

import { Send } from "lucide-react";

export default function RAGChat({ messages, chatInput, setChatInput, chatLoading, sendMessage, chatEndRef }) {
  return (
    <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>LongBridge AI Sohbet</h3>
        <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8 }}>Hisse verileri bağlamında sorularınızı yanıtlar</span>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
            >
              {msg.content.split("\n").map((line, lIdx) => (
                <p key={lIdx} style={{ margin: "0 0 0.5rem 0" }}>
                  {line.split("**").map((chunk, cIdx) =>
                    cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                  )}
                </p>
              ))}
            </div>
          ))}
          {chatLoading && (
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

        <form onSubmit={sendMessage} className="chat-input-area">
          <input
            type="text"
            placeholder="Hisse hakkında sor (örn: F/K oranı nasıl?)"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
            className="chat-input"
            aria-label="Soru mesajınızı yazın"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={chatLoading || !chatInput.trim()}
            aria-label="Mesaj gönder"
            style={{ padding: "0.5rem", borderRadius: "50%", width: "34px", height: "34px" }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
