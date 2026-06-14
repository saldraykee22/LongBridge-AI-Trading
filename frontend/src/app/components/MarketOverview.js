"use client";

import { RefreshCw } from "lucide-react";

export default function MarketOverview({ marketOverview, marketLoading, formatVal, setTicker, setActiveTab }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Piyasa Genel Görünümü</h3>

      {marketLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "150px" }}>
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      ) : marketOverview ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", fontWeight: "700", letterSpacing: "1px" }}>ENDEKSLER & PARİTELER</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
              {(marketOverview.indices || []).map((idx) => (
                <div key={idx.symbol} className="card glass" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>{idx.name}</span>
                    <span className={`badge ${idx.change >= 0 ? "badge-buy" : "badge-sell"}`} style={{ fontSize: "0.75rem", fontWeight: "700" }}>
                      {idx.change >= 0 ? "+" : ""}{idx.change ?? 0}%
                    </span>
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: "800", marginTop: "0.5rem" }}>
                    {formatVal(idx.price, "currency", idx.currency || (idx.symbol.includes("TRY") ? "TRY" : "USD"))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", fontWeight: "700", letterSpacing: "1px" }}>KRİPTO PARALAR (USD)</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
              {(marketOverview.cryptos || []).map((crypto) => (
                <div key={crypto.symbol} className="card glass" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>{crypto.name}</span>
                    <span className={`badge ${crypto.change >= 0 ? "badge-buy" : "badge-sell"}`} style={{ fontSize: "0.75rem", fontWeight: "700" }}>
                      {crypto.change >= 0 ? "+" : ""}{crypto.change ?? 0}%
                    </span>
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: "800", marginTop: "0.5rem" }}>
                    {formatVal(crypto.price, "currency", "USD")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", fontWeight: "700", letterSpacing: "1px" }}>HAREKETLİ BIST HİSSELERİ</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              {(marketOverview.moving || []).map((stk) => (
                <div
                  key={stk.symbol}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--secondary)"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "700", color: "var(--primary)" }}>{stk.symbol}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8, marginLeft: "0.5rem" }}>{stk.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: "700" }}>{formatVal(stk.price, "currency", stk.currency || "TRY")}</span>
                    <span className={`badge ${stk.change >= 0 ? "badge-buy" : "badge-sell"}`} style={{ minWidth: "65px", textAlign: "center" }}>
                      {stk.change >= 0 ? "+" : ""}{stk.change ?? 0}%
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setTicker(stk.symbol);
                        setActiveTab("analysis");
                      }}
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    >
                      Detay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--danger)" }}>Piyasa verileri alınamadı.</div>
      )}
    </div>
  );
}
