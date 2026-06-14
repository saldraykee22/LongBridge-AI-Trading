"use client";

import { useCallback } from "react";
import { RefreshCw, Star } from "lucide-react";

const SCREENER_PRESETS = {
  us: [
    { id: "day_gainers", label: "En Çok Yükselenler" },
    { id: "day_losers", label: "En Çok Düşenler" },
    { id: "most_active", label: "En Aktifler" },
    { id: "growth_stocks", label: "Büyüme Hisseleri" },
    { id: "value_stocks", label: "Değer Hisseleri" },
    { id: "dividend_stocks", label: "Yüksek Temettü" }
  ],
  crypto: [
    { id: "day_gainers", label: "En Çok Yükselenler" },
    { id: "day_losers", label: "En Çok Düşenler" },
    { id: "most_active", label: "En Çok İşlem Görenler" },
    { id: "value_stocks", label: "Piyasa Değeri Sıralaması" }
  ],
  germany: [
    { id: "day_gainers", label: "En Çok Yükselenler" },
    { id: "day_losers", label: "En Çok Düşenler" },
    { id: "most_active", label: "En Yüksek Hacim" },
    { id: "value_stocks", label: "Değer Hisseleri" },
    { id: "dividend_stocks", label: "Temettü Şampiyonları" },
    { id: "growth_stocks", label: "Büyüme Hisseleri" }
  ],
  bist: [
    { id: "day_gainers", label: "En Çok Yükselenler" },
    { id: "day_losers", label: "En Çok Düşenler" },
    { id: "most_active", label: "En Yüksek Hacim" },
    { id: "value_stocks", label: "Değer Hisseleri" },
    { id: "dividend_stocks", label: "Temettü Şampiyonları" },
    { id: "growth_stocks", label: "Büyüme Hisseleri" }
  ]
};

const PRESET_DESCRIPTIONS = {
  "bist_day_gainers": "BIST havuzundaki günün en çok yükselen şirketleri.",
  "bist_day_losers": "BIST havuzundaki günün en çok düşen şirketleri.",
  "bist_most_active": "BIST havuzundaki günlük işlem hacmi en yüksek şirketler.",
  "bist_value_stocks": "F/K ve PD/DD oranları düşük, ucuz BIST şirketleri.",
  "bist_dividend_stocks": "BIST'te düzenli temettü ödeme alışkanlığı olan şirketler.",
  "bist_growth_stocks": "Yatırım, enerji ve teknoloji alanlarında büyüme potansiyeli yüksek BIST şirketleri.",
  "us_day_gainers": "ABD borsalarında günün en çok yükselen hisseleri.",
  "us_day_losers": "ABD borsalarında günün en çok düşen hisseleri.",
  "us_most_active": "ABD borsalarında günün en çok işlem gören hisseleri.",
  "us_growth_stocks": "ABD borsalarındaki teknoloji ve yüksek büyüme hisseleri.",
  "us_value_stocks": "İskontolu büyük ölçekli ABD değer hisseleri.",
  "us_dividend_stocks": "Temettü verimi yüksek köklü ABD şirketleri.",
  "germany_day_gainers": "Almanya borsasındaki günün en çok yükselen şirketleri.",
  "germany_day_losers": "Almanya borsasındaki günün en çok düşen şirketleri.",
  "germany_most_active": "Almanya borsasındaki günlük işlem hacmi en yüksek şirketler.",
  "germany_value_stocks": "F/K ve PD/DD oranları düşük, ucuz Almanya (DAX) şirketleri.",
  "germany_dividend_stocks": "Almanya'da düzenli temettü ödeme alışkanlığı olan şirketler.",
  "germany_growth_stocks": "Almanya borsasındaki teknoloji ve yüksek büyüme hisseleri.",
  "crypto_day_gainers": "En büyük kripto paralar arasında son 24 saatte en çok yükselenler.",
  "crypto_day_losers": "En büyük kripto paralar arasında son 24 saatte en çok düşenler.",
  "crypto_most_active": "Son 24 saatlik işlem hacmi en yüksek kripto paralar.",
  "crypto_value_stocks": "Piyasa değerine göre sıralanmış en büyük kripto paralar."
};

export default function Screener({
  screenerMarket, setScreenerMarket, screenerPreset, setScreenerPreset,
  screenerData, screenerLoading, fetchScreenerData,
  setTicker, setActiveTab, watchlist, toggleWatchlist, formatVal
}) {
  const getScreenerPresets = useCallback((market) => SCREENER_PRESETS[market] || SCREENER_PRESETS.bist, []);

  const getPresetDescription = useCallback((market, preset) => {
    return PRESET_DESCRIPTIONS[`${market}_${preset}`] || "Seçilen filtreye göre piyasa tarama sonuçları.";
  }, []);

  const handleScreenerMarketChange = useCallback((newMarket) => {
    setScreenerMarket(newMarket);
    const validPresets = getScreenerPresets(newMarket);
    if (!validPresets.some(p => p.id === screenerPreset)) {
      setScreenerPreset(validPresets[0].id);
    }
  }, [setScreenerMarket, setScreenerPreset, screenerPreset, getScreenerPresets]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--foreground)" }}>Akıllı Arama ve Tematik Tarayıcı</h3>
        <p style={{ margin: "0.25rem 0 0 0", color: "var(--secondary-foreground)", fontSize: "0.9rem" }}>
          Piyasalardaki hisse ve varlıkları yatırım temalarına göre tarayın
        </p>
      </div>

      <div className="card glass nav-tabs-container">
        {[
          { id: "bist", label: "BIST (Borsa İstanbul)" },
          { id: "us", label: "Amerikan Borsaları (US)" },
          { id: "germany", label: "Almanya Borsası (Xetra)" },
          { id: "crypto", label: "Kripto Paralar" }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => handleScreenerMarketChange(m.id)}
            className={`nav-tab-btn ${screenerMarket === m.id ? "active" : ""}`}
            style={{ cursor: "pointer" }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {getScreenerPresets(screenerMarket).map((theme) => (
          <button
            key={theme.id}
            className={`btn ${screenerPreset === theme.id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setScreenerPreset(theme.id)}
            style={{ flexGrow: 1, minWidth: "150px" }}
          >
            {theme.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic", marginTop: "-0.5rem" }}>
        Açıklama: {getPresetDescription(screenerMarket, screenerPreset)}
      </div>

      {screenerLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      ) : screenerData.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {screenerData.map((stk) => (
            <div key={stk.symbol} className="card glass" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>{stk.name}</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>
                    {stk.symbol} {screenerMarket === "bist" ? "(BIST)" : screenerMarket === "us" ? "(US)" : screenerMarket === "germany" ? "(Almanya)" : "(Kripto)"}
                  </span>
                </div>
                <span className={`badge ${stk.change >= 0 ? "badge-buy" : "badge-sell"}`} style={{ fontSize: "0.75rem", fontWeight: "700" }}>
                  {stk.change >= 0 ? "+" : ""}{(stk.change ?? 0).toFixed(2)}%
                </span>
              </div>

              <div className="responsive-grid-2" style={{ gap: "0.5rem", fontSize: "0.8rem", color: "var(--secondary-foreground)", opacity: 0.8 }}>
                <div>Güncel Fiyat: <strong style={{ color: "var(--foreground)" }}>{formatVal(stk.price, "currency", stk.currency)}</strong></div>
                <div>Günlük En Yüksek: <strong style={{ color: "var(--foreground)" }}>{formatVal(stk.high, "currency", stk.currency)}</strong></div>
                <div>Günlük En Düşük: <strong style={{ color: "var(--foreground)" }}>{formatVal(stk.low, "currency", stk.currency)}</strong></div>
                <div>Hacim: <strong style={{ color: "var(--foreground)" }}>{(stk.volume ?? 0).toLocaleString("tr-TR")}</strong></div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => toggleWatchlist(stk.symbol)}
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Star size={12} fill={watchlist.includes(stk.symbol.toUpperCase()) ? "#f59e0b" : "none"} stroke={watchlist.includes(stk.symbol.toUpperCase()) ? "#f59e0b" : "currentColor"} />
                  {watchlist.includes(stk.symbol.toUpperCase()) ? "Takipte" : "Takip Listesine Ekle"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setTicker(stk.symbol);
                    setActiveTab("analysis");
                  }}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", fontWeight: "600" }}
                >
                  Analiz & Grafik
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)", border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
          Sonuç bulunamadı veya veri çekilemedi.
        </div>
      )}
    </div>
  );
}
