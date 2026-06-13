"use client";

import { X } from "lucide-react";

export default function Watchlist({ watchlist, ticker, setTicker, toggleWatchlist }) {
  return (
    <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>
          Takip Listesi
        </h3>
        <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8 }}>{watchlist.length} Hisse</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {watchlist.length > 0 ? (
          watchlist.map((sym) => (
            <div
              key={sym}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                position: "relative"
              }}
            >
              <button
                onClick={() => setTicker(sym)}
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.6rem 2.2rem 0.6rem 0.8rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  backgroundColor: ticker === sym ? "var(--primary)" : "var(--card)",
                  color: ticker === sym ? "white" : "var(--foreground)",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <span>{sym}</span>
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>BIST</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(sym);
                }}
                aria-label={`${sym} takibini bırak`}
                className={`watchlist-delete-btn ${ticker === sym ? "active-item" : ""}`}
                style={{
                  position: "absolute",
                  right: "0.5rem"
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "1rem", color: "var(--secondary-foreground)", opacity: 0.8, border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
            Takip listeniz boş. Yıldız butonuna basarak ekleyebilirsiniz.
          </div>
        )}
      </div>
    </div>
  );
}
