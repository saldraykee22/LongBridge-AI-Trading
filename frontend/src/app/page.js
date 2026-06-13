"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  Activity, 
  BookOpen,
  FileText,
  Newspaper,
  Star,
  LayoutDashboard,
  Compass,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { formatVal, getBadgeClass } from "./utils";
import Watchlist from "./components/Watchlist";
import MarketOverview from "./components/MarketOverview";
import RAGChat from "./components/RAGChat";
import StockDetail from "./components/StockDetail";
import Screener from "./components/Screener";
import DeepResearch from "./components/DeepResearch";

export default function Home() {
  const [ticker, setTicker] = useState("THYAO");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("1mo");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const sessionIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const requestIdRef = useRef(0);
  const stockRequestControllerRef = useRef(null);
  const chartRequestControllerRef = useRef(null);
  const marketRequestControllerRef = useRef(null);

  // Watchlist state
  const [watchlist, setWatchlist] = useState(["THYAO", "ASELS", "EREGL", "TUPRS", "GARAN"]);

  // Navigation and dashboard state
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "analysis", "strategy", "screener"
  const [marketOverview, setMarketOverview] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [screenerMarket, setScreenerMarket] = useState("bist"); // "bist", "us", "crypto"
  const [screenerPreset, setScreenerPreset] = useState("value_stocks");
  const [screenerData, setScreenerData] = useState([]);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [aiRankings, setAiRankings] = useState([]);
  const [aiCommentary, setAiCommentary] = useState("");
  const [aiRankingsLoading, setAiRankingsLoading] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [activeRecsTab, setActiveRecsTab] = useState("bist"); // "bist", "nasdaq", "crypto"

  // Search autocomplete container ref
  const searchContainerRef = useRef(null);

  // Scroll reference for chat

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Watchlist handlers
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bistWatchlist");
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  const toggleWatchlist = useCallback((symbol) => {
    const sym = symbol.toUpperCase().trim();
    setWatchlist((prev) => {
      let updated;
      if (prev.includes(sym)) {
        updated = prev.filter((s) => s !== sym);
      } else {
        updated = [...prev, sym];
      }
      localStorage.setItem("bistWatchlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchAnalysis = useCallback(async (symbol, force = false) => {
    const currentId = ++requestIdRef.current;
    setAnalysisLoading(true);
    try {
      const url = `/api/stock/${symbol}/analysis` + (force ? "?force_refresh=true" : "");
      const analysisRes = await fetch(url);
      if (currentId !== requestIdRef.current) return;
      if (analysisRes.ok) {
        const data = await analysisRes.json();
        if (currentId === requestIdRef.current) {
          setAnalysis(data);
        }
      } else if (currentId === requestIdRef.current) {
        setAnalysis(null);
      }
    } catch (err) {
      if (currentId === requestIdRef.current) {
        setAnalysis(null);
      }
    } finally {
      if (currentId === requestIdRef.current) {
        setAnalysisLoading(false);
      }
    }
  }, []);

  const fetchStockDetails = useCallback(async (symbol) => {
    if (stockRequestControllerRef.current) {
      stockRequestControllerRef.current.abort();
    }
    const controller = new AbortController();
    stockRequestControllerRef.current = controller;
    setLoading(true);
    setAnalysisLoading(true);
    setError("");
    try {
      const detailsRes = await fetch(`/api/stock/${symbol}`, { signal: controller.signal });
      if (!detailsRes.ok) throw new Error("Hisse senedi verisi bulunamadı.");
      const details = await detailsRes.json();
      if (controller.signal.aborted) return;
      setStockData(details);

      fetchAnalysis(symbol, false);

      setMessages([
        {
          role: "assistant",
          content: `Merhaba! Ben LongBridge AI Analistiniz. **${symbol.toUpperCase()}** hissesini incelemeye hazırım. Teknik, temel verileri ve haberleri kullanarak hisse senedini analiz ettim. Hisse hakkında merak ettiğiniz her şeyi bana sorabilirsiniz.`
        }
      ]);

    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Bir hata oluştu.");
      setStockData(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchAnalysis]);

  const fetchChart = useCallback(async (symbol, timePeriod) => {
    if (chartRequestControllerRef.current) {
      chartRequestControllerRef.current.abort();
    }
    const controller = new AbortController();
    chartRequestControllerRef.current = controller;
    try {
      const chartRes = await fetch(`/api/stock/${symbol}/chart?period=${timePeriod}`, { signal: controller.signal });
      if (chartRes.ok) {
        const data = await chartRes.json();
        if (!controller.signal.aborted) {
          setChartData(data);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Grafik verisi yüklenemedi:", err);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchStockDetails(ticker);
    });
  }, [ticker, fetchStockDetails]);

  useEffect(() => {
    queueMicrotask(() => {
      setChartData([]);
      fetchChart(ticker, period);
    });
  }, [ticker, period, fetchChart]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Autocomplete debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Arama önerileri yüklenemedi:", err);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside search container to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initSession = useCallback(async () => {
    let sid = localStorage.getItem("longbridgeChatSessionId");
    if (sid) {
      try {
        const res = await fetch(`/api/chat/session/${sid}`);
        if (res.ok) {
          setSessionId(sid);
          sessionIdRef.current = sid;
          return;
        }
      } catch (_) {}
      localStorage.removeItem("longbridgeChatSessionId");
    }
    try {
      const res = await fetch("/api/chat/session", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        sessionIdRef.current = data.session_id;
        localStorage.setItem("longbridgeChatSessionId", data.session_id);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      initSession();
    });
  }, [initSession]);

  // Fetch market overview
  const fetchMarketOverview = useCallback(async () => {
    if (marketRequestControllerRef.current) {
      marketRequestControllerRef.current.abort();
    }
    const controller = new AbortController();
    marketRequestControllerRef.current = controller;
    setMarketLoading(true);
    try {
      const res = await fetch("/api/market/overview", { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (!controller.signal.aborted) {
          setMarketOverview(data);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Market overview loading failed:", err);
    } finally {
      if (!controller.signal.aborted) {
        setMarketLoading(false);
      }
    }
  }, []);

  // Fetch screener data
  const fetchScreenerData = useCallback(async (market, preset) => {
    setScreenerLoading(true);
    try {
      const res = await fetch(`/api/market/screener?market=${market}&preset=${preset}`);
      if (res.ok) {
        const data = await res.json();
        setScreenerData(data);
      }
    } catch (err) {
      console.error("Screener loading failed:", err);
    } finally {
      setScreenerLoading(false);
    }
  }, []);

  // Fetch AI rankings
  const fetchAiRankings = useCallback(async () => {
    setAiRankingsLoading(true);
    try {
      const res = await fetch("/api/market/ai-ranking");
      if (res.ok) {
        const data = await res.json();
        setAiRankings(data.rankings || []);
        setAiCommentary(data.commentary || "");
      }
    } catch (err) {
      console.error("AI Rankings loading failed:", err);
    } finally {
      setAiRankingsLoading(false);
    }
  }, []);

  // Fetch AI Investment Recommendations
  const fetchRecommendations = useCallback(async () => {
    setRecsLoading(true);
    try {
      const res = await fetch("/api/market/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Recommendations loading failed:", err);
    } finally {
      setRecsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      if (activeTab === "dashboard") {
        fetchMarketOverview();
        fetchAiRankings();
        fetchRecommendations();
      } else if (activeTab === "screener") {
        fetchScreenerData(screenerMarket, screenerPreset);
      } else if (activeTab === "strategy") {
        fetchAiRankings();
      }
    });
  }, [activeTab, screenerMarket, screenerPreset, fetchMarketOverview, fetchScreenerData, fetchAiRankings, fetchRecommendations]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newTicker = searchQuery.toUpperCase().trim();
      if (newTicker === ticker) {
        fetchStockDetails(ticker);
      } else {
        setTicker(newTicker);
      }
      setSearchQuery("");
      setSuggestions([]);
    }
  };

  const createNewLocalSession = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/chat/session", { method: "POST" });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSessionId(sessionData.session_id);
        sessionIdRef.current = sessionData.session_id;
        localStorage.setItem("longbridgeChatSessionId", sessionData.session_id);
        return sessionData.session_id;
      }
    } catch (_) {}
    return null;
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: "user", content: chatInput };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      let sid = sessionIdRef.current;
      if (!sid) {
        sid = await createNewLocalSession();
        if (!sid) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Oturum oluşturulamadı. Lütfen sayfayı yenileyin." }]);
          return;
        }
      }

      const res = await fetch("/api/chat/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          message: userMsg.content,
          ticker: ticker
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else if (res.status === 404) {
        localStorage.removeItem("longbridgeChatSessionId");
        const newSid = await createNewLocalSession();
        if (newSid) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Oturum süresi doldu, yeni bir sohbet başlatıldı. Sorunuzu tekrar sorabilir misiniz?" }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "Bağlantı hatası. Lütfen sayfayı yenileyin." }]);
        }
      } else {
        const errText = await res.text();
        setMessages((prev) => [...prev, { role: "assistant", content: `Hata: ${errText.slice(0, 150)}` }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sunucu hatası: ${err.message || "Lütfen backend uygulamasının çalıştığından emin olun."}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "800", color: "var(--foreground)" }}>LongBridge AI</h1>
          <p style={{ margin: "0.25rem 0 0 0", color: "var(--secondary-foreground)", opacity: 0.7, fontSize: "0.9rem" }}>Çoklu Ajan Finansal Analiz ve RAG Terminali</p>
        </div>
        <form onSubmit={handleSearchSubmit} ref={searchContainerRef} className="flex gap-2 w-full sm:w-auto relative">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={18} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
            <input
              type="text"
              placeholder="Hisse Kodu / Adı (Örn: THYAO)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Hisse senedi kodu veya adı girin"
              className="w-full sm:w-64"
              style={{
                padding: "0.6rem 1rem 0.6rem 2.5rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
                outline: "none",
                fontSize: "0.95rem"
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                zIndex: 100,
                maxHeight: "220px",
                overflowY: "auto",
                marginTop: "0.25rem"
              }}>
                {suggestions.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => {
                      setTicker(item.symbol);
                      setSearchQuery("");
                      setSuggestions([]);
                      setActiveTab("analysis");
                    }}
                    className="search-suggestion-item"
                  >
                    <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--primary)" }}>{item.symbol}</span>
                    <span style={{ fontSize: "0.75rem", color: "#666", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
           <button type="submit" className="btn btn-primary" aria-label="Hisse ara" style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexShrink: 0 }}>
            Hisse Ara
          </button>
        </form>
      </div>

      {/* Main Navigation Menu */}
      <div className="card glass nav-tabs-container">
        {[
          { id: "dashboard", label: "Ana Kontrol Paneli", icon: <LayoutDashboard size={16} /> },
          { id: "analysis", label: "Detaylı Analiz", icon: <Activity size={16} /> },
          { id: "strategy", label: "Strateji Raporları", icon: <Compass size={16} /> },
          { id: "screener", label: "Akıllı Arama", icon: <Sparkles size={16} /> },
          { id: "discover", label: "Derin Araştırma (DeepResearch)", icon: <TrendingUp size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ border: "1px solid var(--danger)", backgroundColor: "rgba(239, 68, 68, 0.05)", display: "flex", gap: "1rem", alignItems: "center" }}>
          <AlertCircle style={{ color: "var(--danger)" }} />
          <span style={{ color: "var(--danger)", fontWeight: "500" }}>{error}</span>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* AI Market Commentary */}
          <div className="card glass animate-fade-in" style={{ borderLeft: "5px solid var(--primary)", background: "rgba(37, 99, 235, 0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Sparkles className="text-primary" size={20} />
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>Yapay Zeka Piyasa Analiz Özeti</h3>
            </div>
            {aiRankingsLoading ? (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0" }}>
                <RefreshCw className="animate-spin text-primary" size={16} />
                <span style={{ fontSize: "0.9rem", color: "#666" }}>Değerlendirmeler analiz ediliyor...</span>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.6", color: "var(--foreground)" }}>
                {aiCommentary}
              </p>
            )}
          </div>

          <MarketOverview marketOverview={marketOverview} marketLoading={marketLoading} formatVal={formatVal} setTicker={setTicker} setActiveTab={setActiveTab} />

          {/* Yapay Zeka Yatırım Önerileri */}
            <div className="card glass" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  💡 Yapay Zeka Önerileri
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
                Farklı piyasalarda yapay zekanın belirlediği en cazip yatırım fırsatları.
              </p>
              
              {/* Recommendations Tabs */}
              <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.03)", padding: "0.25rem", borderRadius: "calc(var(--radius) - 4px)" }}>
                {[
                  { id: "bist", label: "BIST" },
                  { id: "nasdaq", label: "NASDAQ" },
                  { id: "crypto", label: "Kripto" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveRecsTab(t.id)}
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.5rem",
                      borderRadius: "calc(var(--radius) - 6px)",
                      border: "none",
                      backgroundColor: activeRecsTab === t.id ? "var(--primary)" : "transparent",
                      color: activeRecsTab === t.id ? "white" : "var(--foreground)",
                      fontWeight: "600",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "250px" }}>
                {recsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <RefreshCw className="animate-spin text-primary" size={20} />
                  </div>
                ) : recommendations && recommendations[activeRecsTab] && recommendations[activeRecsTab].length > 0 ? (
                  (recommendations[activeRecsTab] || []).map((item) => (
                    <div
                      key={item.symbol}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        padding: "0.75rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        background: "var(--card)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "0.95rem" }}>{item.symbol}</span>
                          <span style={{ fontSize: "0.75rem", color: "#888", maxWidth: "120px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span className={`badge ${getBadgeClass(item.signal)}`} style={{ fontSize: "0.65rem" }}>{item.signal}</span>
                          <span style={{ fontWeight: "800", fontSize: "0.85rem", color: "var(--primary)" }}>{item.score} Puan</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
                        <span style={{ fontWeight: "600", color: "var(--foreground)" }}>
                          {formatVal(item.price, "currency", item.currency)}
                        </span>
                        <span className={`badge ${item.change >= 0 ? "badge-buy" : "badge-sell"}`} style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                          {item.change >= 0 ? "+" : ""}{(item.change ?? 0).toFixed(2)}%
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", lineHeight: "1.4" }}>
                        {item.reason}
                      </p>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setTicker(item.symbol);
                            setActiveTab("analysis");
                          }}
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem", fontWeight: "600" }}
                        >
                          Hemen Analiz Et
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "#888", fontSize: "0.85rem", border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
                    Öneri verisi yüklenemedi.
                  </div>
                )}
              </div>
            </div>
          </div>
      )}

      {activeTab === "strategy" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Strateji Karşılaştırma Raporları</h3>
            <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.9rem" }}>
              Kısa, orta ve uzun vadeli bakış açıları ile fırsat ve risk analizi
            </p>
          </div>

          {aiRankingsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
              <RefreshCw className="animate-spin text-primary" size={24} />
            </div>
          ) : aiRankings.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {aiRankings.map((stk) => (
                <div key={stk.ticker} className="card glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--primary)" }}>{stk.ticker}</h4>
                      <span className={`badge ${getBadgeClass(stk.signal)}`}>{stk.signal}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "600" }}>Genel Yatırım Skoru:</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: "800", color: stk.score >= 70 ? "var(--success)" : stk.score >= 50 ? "#f59e0b" : "var(--danger)" }}>
                        {stk.score} / 100
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                    <div style={{ background: "rgba(0,0,0,0.01)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "#888", marginBottom: "0.5rem" }}>
                        <BookOpen size={14} /> KISA VADE (GÜNLÜK)
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.5", color: "var(--foreground)" }}>{stk.short_term}</p>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.01)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "#888", marginBottom: "0.5rem" }}>
                        <FileText size={14} /> ORTA VADE (ÇEYREKLİK)
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.5", color: "var(--foreground)" }}>{stk.medium_term}</p>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.01)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "#888", marginBottom: "0.5rem" }}>
                        <Newspaper size={14} /> UZUN VADE (YILLIK)
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.5", color: "var(--foreground)" }}>{stk.long_term}</p>
                    </div>
                  </div>
                  
                  {stk.plan && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", background: "rgba(0,0,0,0.01)", padding: "1rem", borderRadius: "var(--radius)", border: "1px dashed var(--border)" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--primary)" }}>İşlem Planı</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--foreground)", marginTop: "0.15rem", lineHeight: "1.4" }}>{stk.plan}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#10b981" }}>Seviyeler & Analiz Gerekçesi</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--foreground)", marginTop: "0.15rem", lineHeight: "1.4" }}>
                          <strong>Giriş:</strong> {stk.entry_points} | <strong>TP:</strong> {stk.take_profit} | <strong>SL:</strong> {stk.stop_loss}
                          {stk.justification && (
                            <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.35rem", paddingTop: "0.35rem", fontSize: "0.75rem", color: "#666", fontStyle: "italic" }}>
                              &ldquo;{stk.justification}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setTicker(stk.ticker);
                        setActiveTab("analysis");
                      }}
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      Hisse Analizine Git & AI ile Konuş
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card glass" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ color: "#888", margin: 0 }}>Karşılaştırılacak strateji raporu bulunamadı. Lütfen &quot;Detaylı Analiz&quot; sekmesine giderek hisse analizi yapın.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "screener" && (
        <Screener
          screenerMarket={screenerMarket}
          setScreenerMarket={setScreenerMarket}
          screenerPreset={screenerPreset}
          setScreenerPreset={setScreenerPreset}
          screenerData={screenerData}
          screenerLoading={screenerLoading}
          fetchScreenerData={fetchScreenerData}
          setTicker={setTicker}
          setActiveTab={setActiveTab}
          watchlist={watchlist}
          toggleWatchlist={toggleWatchlist}
          formatVal={formatVal}
        />
      )}

      {activeTab === "discover" && (
        <DeepResearch
          setTicker={setTicker}
          setActiveTab={setActiveTab}
          formatVal={formatVal}
          getBadgeClass={getBadgeClass}
        />
      )}

      {activeTab === "analysis" && (
        <>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
              <RefreshCw className="animate-spin" size={32} style={{ animation: "spin 2s linear infinite", color: "var(--primary)" }} />
            </div>
          ) : stockData ? (
            <div className="dashboard-grid">
              <StockDetail
                stockData={stockData}
                analysis={analysis}
                analysisLoading={analysisLoading}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                fetchAnalysis={fetchAnalysis}
                ticker={ticker}
                chartData={chartData}
                period={period}
                setPeriod={setPeriod}
                formatVal={formatVal}
                getBadgeClass={getBadgeClass}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <Watchlist watchlist={watchlist} ticker={ticker} setTicker={setTicker} toggleWatchlist={toggleWatchlist} />
                <RAGChat messages={messages} chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading} sendMessage={handleSendMessage} chatEndRef={chatEndRef} />
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
              <span>Hisse senedi verisi yüklenemedi. Arama yapmayı deneyin.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
