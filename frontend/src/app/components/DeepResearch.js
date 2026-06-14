"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  RefreshCw, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  MessageSquare,
  AlertCircle,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Terminal,
  BookOpen,
  BarChart3
} from "lucide-react";
import SVGChart from "./SVGChart";

export default function DeepResearch({
  setTicker,
  setActiveTab,
  formatVal,
  getBadgeClass
}) {
  const [activeMarket, setActiveMarket] = useState("bist"); // "bist", "us", "crypto"
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [stepText, setStepText] = useState("");
  const [logs, setLogs] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState("");
  
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailTab, setDetailTab] = useState("thesis"); // "thesis", "agents", "chart"
  const [chartPeriod, setChartPeriod] = useState("1mo");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const progressIntervalRef = useRef(null);
  const pollingAbortRef = useRef(null);
  const scanAbortRef = useRef(null);
  const terminalEndRef = useRef(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Load chart for selected opportunity
  useEffect(() => {
    if (!selectedResult) return;
    let active = true;
    async function getChart() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/stock/${selectedResult.symbol}/chart?period=${chartPeriod}`);
        if (!res.ok) throw new Error("Grafik verisi alınamadı.");
        const data = await res.json();
        if (active) {
          setChartData(data);
        }
      } catch (err) {
        if (active) setChartData([]);
      } finally {
        if (active) setChartLoading(false);
      }
    }
    getChart();
    return () => { active = false; };
  }, [selectedResult, chartPeriod]);

  const handleStartScan = useCallback(async () => {
    setLoading(true);
    setProgressPercent(0);
    setStepText("Derin Araştırma başlatılıyor...");
    setLogs(["[BAŞLATILDI] Derin Araştırma başlatılıyor...", `[BİLGİ] Hedef Piyasa: ${activeMarket.toUpperCase()}`]);
    setError("");
    setScanResults([]);
    setSelectedResult(null);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    try {
      scanAbortRef.current = new AbortController();
      const startRes = await fetch("/api/market/deep-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market: activeMarket }),
        signal: scanAbortRef.current.signal
      });

      if (!startRes.ok) {
        throw new Error("Derin Araştırma başlatılamadı. Sunucu hatası.");
      }

      const startData = await startRes.json();
      const taskId = startData.task_id;

      if (!taskId) {
        throw new Error("Geçersiz görev kimliği (Task ID) alındı.");
      }

      // Poll status endpoint
      progressIntervalRef.current = setInterval(async () => {
        const controller = new AbortController();
        pollingAbortRef.current = controller;
        try {
          const statusRes = await fetch(`/api/market/deep-research/status/${taskId}`, { signal: controller.signal });
          if (!statusRes.ok) {
            throw new Error("Görev durumu sorgulanamadı.");
          }
          const statusData = await statusRes.json();

          setProgressPercent(statusData.progress || 0);
          setStepText(statusData.step_text || "Araştırma devam ediyor...");
          setLogs(statusData.logs || []);

          if (statusData.status === "completed") {
            clearInterval(progressIntervalRef.current);
            if (pollingAbortRef.current) pollingAbortRef.current.abort();
            const results = statusData.results || [];
            setScanResults(results);
            if (results.length > 0) {
              setSelectedResult(results[0]);
            }
            setLoading(false);
          } else if (statusData.status === "failed") {
            clearInterval(progressIntervalRef.current);
            if (pollingAbortRef.current) pollingAbortRef.current.abort();
            setError(statusData.error || "Derin Araştırma başarısız oldu.");
            setLoading(false);
          }
        } catch (pollErr) {
          clearInterval(progressIntervalRef.current);
          if (pollingAbortRef.current) pollingAbortRef.current.abort();
          setError(pollErr.message || "İlerleme durumu sorgulanırken hata oluştu.");
          setLoading(false);
        }
      }, 2000);

    } catch (err) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setLoading(false);
    }
  }, [activeMarket]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (pollingAbortRef.current) {
        pollingAbortRef.current.abort();
      }
      if (scanAbortRef.current) {
        scanAbortRef.current.abort();
      }
    };
  }, []);

  const getGlobalSignal = (score) => {
    if (score >= 85) return "GÜÇLÜ AL";
    if (score >= 70) return "AL";
    if (score >= 45) return "TUT";
    if (score >= 30) return "SAT";
    return "GÜÇLÜ SAT";
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--foreground)" }}>
          <Cpu className="text-primary" size={22} /> LongBridge AI DeepResearch (Derin Araştırma)
        </h3>
        <p style={{ margin: "0.25rem 0 0 0", color: "var(--secondary-foreground)", fontSize: "0.9rem" }}>
          Piyasanın tamamını bulk teknik ve temel göstergelerle tarar, en güçlü adayları eler ve multi-agent yapay zeka ekibiyle derin araştırma yapar.
        </p>
      </div>

      {/* Market Selector */}
      <div className="card glass nav-tabs-container">
        {[
          { id: "bist", label: "Tüm BIST Şirketleri (~490)" },
          { id: "us", label: "Amerikan Borsaları (S&P 500 / Popüler)" },
          { id: "germany", label: "Almanya Borsası (DAX 40)" },
          { id: "crypto", label: "Kripto Varlıklar (Top 200)" }
        ].map((m) => (
          <button
            key={m.id}
            disabled={loading}
            onClick={() => setActiveMarket(m.id)}
            className={`nav-tab-btn ${activeMarket === m.id ? "active" : ""}`}
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading && activeMarket !== m.id ? 0.6 : 1
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Action Button & Welcome Screen */}
      {!loading && scanResults.length === 0 && (
        <div className="card glass" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", textAlign: "center" }}>
          <div style={{ padding: "1rem", borderRadius: "50%", background: "rgba(37, 99, 235, 0.05)", color: "var(--primary)" }}>
            <Terminal size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Piyasa Derin Araştırmasını Başlatın</h4>
            <p style={{ margin: "0.25rem 0 0 0", color: "var(--secondary-foreground)", fontSize: "0.85rem", maxWidth: "500px", lineHeight: "1.5" }}>
              Seçilen borsa havuzundaki tüm hisseler bulk veri indirmesi ile saniyeler içinde elenir. Teknik gücü ve hacim patlaması en yüksek olan 5 hisse Yapay Zeka Ajanları tarafından derin temel, teknik ve KAP analiziyle raporlanır.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleStartScan}
            style={{ padding: "0.75rem 2rem", fontSize: "0.9rem", fontWeight: "700" }}
          >
            Derin Taramayı Başlat
          </button>
        </div>
      )}

      {/* Loading Terminal & Log State */}
      {loading && (
        <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Terminal size={16} className="text-success animate-pulse" /> Araştırma Logları & Ajan İletişimi
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>{progressPercent}% Tamamlandı</span>
          </div>

          {/* Terminal Console View */}
          <div style={{ 
            background: "#030712", 
            border: "1px solid var(--border)", 
            borderRadius: "var(--radius)", 
            padding: "1.25rem", 
            fontFamily: "Courier New, Courier, monospace", 
            height: "260px", 
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            boxShadow: "inset 0 4px 10px rgba(0,0,0,0.8)"
          }}>
            {logs.map((log, index) => {
              const logStyles = {
                error: { color: "var(--danger)" },
                warning: { color: "#f59e0b" },
                ai: { color: "var(--primary)" },
                success: { color: "var(--success)" },
                default: { color: "#4ade80" },
              };

              const getLogStyle = (log) => {
                if (log.startsWith("[HATA]")) return logStyles.error;
                if (log.startsWith("[UYARI]")) return logStyles.warning;
                if (log.startsWith("[AI]")) return logStyles.ai;
                if (log.startsWith("[TAMAMLANDI]")) return logStyles.success;
                return logStyles.default;
              };

              return (
                <div key={index} style={{ ...getLogStyle(log), fontSize: "0.75rem", lineHeight: "1.4", textAlign: "left" }}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>
              <span>{stepText}</span>
            </div>
            {/* Custom styled progress bar */}
            <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
              <div style={{ 
                height: "100%", 
                background: "var(--primary)", 
                borderRadius: "3px",
                width: `${progressPercent}%`,
                transition: "width 0.4s ease-out" 
              }} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ border: "1px solid var(--danger)", backgroundColor: "rgba(239, 68, 68, 0.05)", display: "flex", gap: "1rem", alignItems: "center" }}>
          <AlertCircle style={{ color: "var(--danger)" }} />
          <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "0.2rem", textAlign: "left" }}>
            <span style={{ color: "var(--danger)", fontWeight: "700", fontSize: "0.85rem" }}>Hata Oluştu</span>
            <span style={{ color: "var(--secondary-foreground)", fontSize: "0.75rem" }}>{error}</span>
          </div>
          <button className="btn btn-secondary" onClick={handleStartScan} style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
            Yeniden Dene
          </button>
        </div>
      )}

      {/* Scan Results Explorer Dashboard */}
      {!loading && scanResults.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", fontWeight: "500" }}>
              Filtreleme kriterlerine uyan en iyi 5 fırsat listelenmektedir.
            </span>
            <button className="btn btn-secondary" onClick={handleStartScan} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.85rem", fontSize: "0.75rem" }}>
              <RefreshCw size={12} /> Yeniden Tara
            </button>
          </div>

          {/* 2-Column Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="responsive-grid-2">
            
            {/* Column 1: Candidates List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {scanResults.map((item) => {
                const isSelected = selectedResult && selectedResult.symbol === item.symbol;
                const changeColor = item.change >= 0 ? "var(--success)" : "var(--danger)";
                const changeIcon = item.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;
                
                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedResult(item)}
                    className={`card glass ${isSelected ? "active" : ""}`}
                    style={{
                      padding: "1rem",
                      cursor: "pointer",
                      border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      textAlign: "left",
                      backgroundColor: isSelected ? "rgba(41, 98, 255, 0.04)" : "rgba(11, 15, 25, 0.65)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "var(--foreground)" }}>{item.symbol}</h4>
                        <span style={{ fontSize: "0.7rem", color: "var(--secondary-foreground)", display: "block", marginTop: "0.1rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>
                          {item.name}
                        </span>
                      </div>
                      
                      {/* Category Badge */}
                      <span style={{ 
                        fontSize: "0.65rem", 
                        fontWeight: "700", 
                        padding: "0.2rem 0.5rem", 
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)"
                      }}>
                        {item.category}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--foreground)" }}>
                          {formatVal(item.price, "currency", item.currency)}
                        </span>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.1rem" }}>
                          <span style={{ fontSize: "0.75rem", color: changeColor, display: "flex", alignItems: "center", gap: "0.1rem", fontWeight: "600" }}>
                            {changeIcon} {item.change >= 0 ? "+" : ""}{(item.change ?? 0).toFixed(2)}%
                          </span>
                          {item.weekly_change !== undefined && (
                            <span style={{ fontSize: "0.65rem", color: item.weekly_change >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.8 }}>
                              (H: {item.weekly_change >= 0 ? "+" : ""}{(item.weekly_change ?? 0).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Score */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--secondary-foreground)", textTransform: "uppercase", fontWeight: "600" }}>AI Sinyal</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--primary)" }}>{getGlobalSignal(item.ai_score)}</span>
                        </div>
                        <div style={{ position: "relative", width: "38px", height: "38px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <svg width="38" height="38" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="19" cy="19" r="16" fill="transparent" style={{ stroke: 'var(--border)', strokeWidth: 3 }} />
                            <circle 
                              cx="19" 
                              cy="19" 
                              r="16" 
                              fill="transparent" 
                              style={{ stroke: 'var(--primary)', strokeWidth: 3 }} 
                              strokeDasharray="100.5" 
                              strokeDashoffset={100.5 - (100.5 * item.ai_score) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span style={{ position: "absolute", fontSize: "0.7rem", fontWeight: "800" }}>{item.ai_score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Column 2: Candidate Details */}
            {selectedResult && (
              <div className="card glass" style={{ border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem" }}>
                
                {/* Details Tab Menu */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", gap: "1rem", overflowX: "auto" }}>
                  {[
                    { id: "thesis", label: "Yatırım Tezi", icon: <BookOpen size={14} /> },
                    { id: "agents", label: "Ajan Görüşleri", icon: <Cpu size={14} /> },
                    { id: "chart", label: "Teknik Grafik", icon: <BarChart3 size={14} /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: detailTab === tab.id ? "var(--primary)" : "var(--secondary-foreground)",
                        fontWeight: detailTab === tab.id ? "700" : "500",
                        fontSize: "0.8rem",
                        padding: "0.4rem 0.5rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        borderBottom: detailTab === tab.id ? "2px solid var(--primary)" : "none",
                        marginBottom: "-0.6rem",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Thesis */}
                {detailTab === "thesis" && (
                  <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
                    
                    {/* Strategy Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                      
                      <div className="card glass" style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--secondary-foreground)", fontWeight: "600", textTransform: "uppercase" }}>Giriş Seviyesi</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--foreground)" }}>{selectedResult?.strategy?.entry_points || "Cari Fiyat"}</span>
                      </div>

                      <div className="card glass" style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--success)", fontWeight: "600", textTransform: "uppercase" }}>Kar Al Hedefi</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--success)" }}>{selectedResult?.strategy?.take_profit || "Belirtilmedi"}</span>
                      </div>

                      <div className="card glass" style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--danger)", fontWeight: "600", textTransform: "uppercase" }}>Stop-Loss</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--danger)" }}>{selectedResult?.strategy?.stop_loss || "Belirtilmedi"}</span>
                      </div>
                    </div>

                    {/* Vade Bazlı Plan */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Target size={14} className="text-primary" /> Stratejik İşlem Planı
                      </span>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--foreground)", lineHeight: "1.5" }}>
                        {selectedResult?.strategy?.plan || "İşlem planı bulunmuyor."}
                      </p>
                    </div>

                    {/* Vade Raporu */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--secondary-foreground)", fontWeight: "700" }}>Kısa Vade:</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--foreground)", lineHeight: "1.4" }}>{selectedResult?.strategy?.short_term}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--secondary-foreground)", fontWeight: "700" }}>Orta Vade:</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--foreground)", lineHeight: "1.4" }}>{selectedResult?.strategy?.medium_term}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--secondary-foreground)", fontWeight: "700" }}>Uzun Vade:</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--foreground)", lineHeight: "1.4" }}>{selectedResult?.strategy?.long_term}</span>
                      </div>
                    </div>

                    {/* AI Gerekçesi */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", fontWeight: "700" }}>Analiz Gerekçesi:</span>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--secondary-foreground)", lineHeight: "1.5" }}>
                        {selectedResult?.strategy?.justification}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Agents */}
                {detailTab === "agents" && (
                  <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
                    {(selectedResult?.agents || []).map((agent, index) => {
                      const sigColor = agent.signal.includes("AL") ? "var(--success)" : agent.signal.includes("SAT") ? "var(--danger)" : "var(--secondary-foreground)";
                      
                      return (
                        <div key={index} className="card glass" style={{ padding: "0.75rem", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <Cpu size={12} className="text-primary" /> {agent.name}
                            </span>
                            <span style={{ fontSize: "0.7rem", fontWeight: "700", color: sigColor }}>{agent.signal}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--secondary-foreground)", lineHeight: "1.4" }}>
                            {agent.reason}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab 3: Chart */}
                {detailTab === "chart" && (
                  <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {chartLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "280px", gap: "1rem" }}>
                        <RefreshCw className="animate-spin text-primary" size={24} />
                        <span style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>Grafik verileri yükleniyor...</span>
                      </div>
                    ) : (
                      <SVGChart
                        chartData={chartData}
                        period={chartPeriod}
                        setPeriod={setChartPeriod}
                        formatVal={formatVal}
                        currency={selectedResult.currency}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
