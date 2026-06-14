"use client";

import { Star, Activity, Layers, BookOpen, FileText, Newspaper, Compass, Sparkles, AlertCircle, TrendingUp, RefreshCw } from "lucide-react";
import SVGChart from "./SVGChart";

export default function StockDetail({
  stockData, analysis, analysisLoading, watchlist, toggleWatchlist,
  fetchAnalysis, ticker, chartData, period, setPeriod, formatVal, getBadgeClass
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
        {/* Overview & Key Stats */}
        <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 3vw, 1.5rem)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", gap: "0.5rem" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "clamp(1rem, 3.5vw, 1.5rem)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stockData.name} ({stockData.ticker})</h2>
                <button
                  onClick={() => toggleWatchlist(stockData.ticker)}
                  aria-label="Takip listesine ekle/çıkar"
                  className="watchlist-star-btn"
                  style={{
                    color: watchlist.includes(stockData.ticker.toUpperCase()) ? "#f59e0b" : "#ccc"
                  }}
                >
                  <Star
                    size={22}
                    fill={watchlist.includes(stockData.ticker.toUpperCase()) ? "#f59e0b" : "none"}
                    stroke={watchlist.includes(stockData.ticker.toUpperCase()) ? "#f59e0b" : "currentColor"}
                    strokeWidth={2}
                  />
                </button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", display: "inline-block", marginTop: "0.25rem" }}>{stockData.sector} / {stockData.industry}</span>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "clamp(1.1rem, 4vw, 1.85rem)", fontWeight: "800", color: "var(--primary)" }}>{formatVal(stockData.current_price, "currency", stockData.currency)}</div>
              <span style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.85rem)", color: "var(--secondary-foreground)", whiteSpace: "nowrap" }}>Son Güncelleme Fiyatı</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(100px, 25vw, 130px), 1fr))", gap: "clamp(0.5rem, 2vw, 1rem)" }}>
            <div className="stats-item">
              <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>F/K ORANI</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "0.25rem" }}>{formatVal(stockData.pe_ratio)}</div>
            </div>
            <div className="stats-item">
              <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>PD/DD ORANI</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "0.25rem" }}>{formatVal(stockData.pb_ratio)}</div>
            </div>
            <div className="stats-item">
              <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>TEMETTÜ VERİMİ</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "0.25rem" }}>{formatVal(stockData.dividend_yield, "percent")}</div>
            </div>
            <div className="stats-item">
              <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>PİYASA DEĞERİ</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "0.25rem" }}>{formatVal(stockData.market_cap, "cap", stockData.currency)}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(0.6rem, 1.5vw, 0.8rem)", color: "var(--secondary-foreground)", opacity: 0.8, fontWeight: "600" }}>
              <span>52H <span className="hidden sm:inline">EN DÜŞÜK</span></span>
              <span className="hidden sm:inline">52 HAFTALIK ARALIK</span>
              <span>52H <span className="hidden sm:inline">EN YÜKSEK</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.4rem, 2vw, 1rem)" }}>
              <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.9rem)", fontWeight: "600", whiteSpace: "nowrap" }}>{formatVal(stockData["52_week_low"], "currency", stockData.currency)}</span>
              <div style={{ flex: 1, height: "6px", backgroundColor: "var(--border)", borderRadius: "99px", position: "relative", minWidth: "60px" }}>
                {(() => {
                  const low = stockData["52_week_low"];
                  const high = stockData["52_week_high"];
                  const curr = stockData.current_price;
                  if (low !== null && low !== undefined && high !== null && high !== undefined && curr !== null && curr !== undefined) {
                    const percent = ((curr - low) / (high - low)) * 100;
                    return (
                      <div style={{
                        position: "absolute",
                        left: `${Math.min(100, Math.max(0, percent))}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        border: "2px solid white"
                      }} />
                    );
                  }
                  return null;
                })()}
              </div>
              <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.9rem)", fontWeight: "600", whiteSpace: "nowrap" }}>{formatVal(stockData["52_week_high"], "currency", stockData.currency)}</span>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <SVGChart chartData={chartData} period={period} setPeriod={setPeriod} formatVal={formatVal} currency={stockData.currency} />

        {/* AI Agent Analysis Panel */}
        <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={18} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Çoklu Ajan Karar Raporu</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => fetchAnalysis(ticker, true)}
                disabled={analysisLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  height: "30px"
                }}
              >
                <RefreshCw size={13} style={{ animation: analysisLoading ? "spin 2s linear infinite" : "none" }} />
                Yeniden Analiz Et
              </button>
              {analysis && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--secondary)", padding: "0.25rem 0.75rem", borderRadius: "99px", border: "1px solid var(--border)", height: "30px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", fontWeight: "600" }}>Kolektif Puan:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: "800", color: analysis.score >= 70 ? "var(--success)" : analysis.score >= 50 ? "#f59e0b" : "var(--danger)" }}>
                    {analysis.score} / 100
                  </span>
                </div>
              )}
            </div>
          </div>

          {analysisLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem", paddingBottom: "1rem" }}>
              <div className="typing-dots" style={{ justifyContent: "flex-start" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--secondary-foreground)" }}>AI Ajanları verileri sentezliyor, lütfen bekleyin...</span>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          ) : analysis ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* AI News Sentiment Overview */}
              {analysis.news_sentiment && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Newspaper size={16} className="text-primary" />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>Yapay Zeka Haber Algısı (Sentiment)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ flex: 1, height: "24px", borderRadius: "99px", background: "linear-gradient(to right, #ef4444, #f59e0b, #10b981)", position: "relative" }}>
                      <div style={{
                        position: "absolute",
                        left: `${((analysis.news_sentiment.overall_score + 1) / 2) * 100}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        border: "2px solid",
                        borderColor: analysis.news_sentiment.overall_score >= 0.2 ? "#10b981" : analysis.news_sentiment.overall_score <= -0.2 ? "#ef4444" : "#f59e0b",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        transition: "left 0.5s ease"
                      }} />
                    </div>
                    <span style={{
                      fontSize: "1.1rem",
                      fontWeight: "800",
                      color: analysis.news_sentiment.overall_score >= 0.6 ? "#10b981" : analysis.news_sentiment.overall_score >= 0.2 ? "#22c55e" : analysis.news_sentiment.overall_score <= -0.6 ? "#ef4444" : analysis.news_sentiment.overall_score <= -0.2 ? "#f97316" : "#f59e0b",
                      whiteSpace: "nowrap"
                    }}>
                      %{Math.round(((analysis.news_sentiment.overall_score + 1) / 2) * 100)} {analysis.news_sentiment.overall_sentiment}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <BookOpen size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "0.2rem" }} />
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary-foreground)" }}>KISA VADE (GÜNLÜK)</div>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", lineHeight: "1.4", color: "var(--foreground)" }}>{analysis.strategy?.short_term || ''}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <FileText size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "0.2rem" }} />
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary-foreground)" }}>ORTA VADE (ÇEYREKLİK)</div>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", lineHeight: "1.4", color: "var(--foreground)" }}>{analysis.strategy?.medium_term || ''}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Newspaper size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "0.2rem" }} />
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary-foreground)" }}>UZUN VADE (YILLIK)</div>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", lineHeight: "1.4", color: "var(--foreground)" }}>{analysis.strategy?.long_term || ''}</p>
                  </div>
                </div>
              </div>

              {analysis.strategy?.plan && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary-foreground)" }}>YAPAY ZEKA AKSİYON PLANI & SEVİYELER</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "var(--primary)", marginBottom: "0.35rem" }}>
                        <Compass size={14} /> Strateji Planı
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.4", color: "var(--foreground)" }}>{analysis.strategy?.plan}</p>
                    </div>
                    <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "#10b981", marginBottom: "0.35rem" }}>
                        <Activity size={14} /> Giriş Noktaları
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.4", fontWeight: "600", color: "var(--foreground)" }}>{analysis.strategy?.entry_points}</p>
                    </div>
                    <div style={{ background: "rgba(59, 130, 246, 0.08)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "#3b82f6", marginBottom: "0.35rem" }}>
                        <Sparkles size={14} /> Kâr Alma Hedefleri
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.4", fontWeight: "600", color: "var(--foreground)" }}>{analysis.strategy?.take_profit}</p>
                    </div>
                    <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", color: "#ef4444", marginBottom: "0.35rem" }}>
                        <AlertCircle size={14} /> Zarar Durdurma (Stop Loss)
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.4", fontWeight: "600", color: "var(--foreground)" }}>{analysis.strategy?.stop_loss}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary-foreground)" }}>AJAN GÖRÜŞLERİ</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(analysis.agents || []).map((agent, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        padding: "1rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        background: "var(--secondary)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{agent.name}</span>
                        <span className={`badge ${getBadgeClass(agent.signal)}`}>{agent.signal}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--secondary-foreground)", lineHeight: "1.4" }}>{agent.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-Article News Sentiment Analysis */}
              {analysis.news_sentiment?.articles && analysis.news_sentiment.articles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary-foreground)" }}>HABER DETAY ANALİZİ</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {analysis.news_sentiment.articles.map((article, idx) => (
                      <div key={idx} style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        background: "var(--secondary)",
                        alignItems: "flex-start"
                      }}>
                        <div style={{
                          flexShrink: 0,
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          fontWeight: "800",
                          backgroundColor: article.score >= 0.2 ? "rgba(16, 185, 129, 0.15)" : article.score <= -0.2 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: article.score >= 0.2 ? "#10b981" : article.score <= -0.2 ? "#ef4444" : "#f59e0b"
                        }}>
                          {article.score >= 0.2 ? "↑" : article.score <= -0.2 ? "↓" : "→"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--foreground)", marginBottom: "0.2rem", lineHeight: "1.3" }}>{article.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", lineHeight: "1.4" }}>
                            <span style={{
                              fontWeight: "700",
                              color: article.score >= 0.2 ? "#10b981" : article.score <= -0.2 ? "#ef4444" : "#f59e0b",
                              marginRight: "0.35rem"
                            }}>
                              [{article.score >= 0 ? `+${article.score.toFixed(2)}` : `${article.score.toFixed(2)}`}]
                            </span>
                            {article.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.strategy?.justification && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", padding: "1.25rem", borderRadius: "var(--radius)", border: "1px dashed var(--primary)", background: "rgba(255, 255, 255, 0.015)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)" }}>
                    <TrendingUp size={16} /> ANALİZ GEREKÇESİ (ÖZET)
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: "1.5", color: "var(--foreground)" }}>
                    {analysis.strategy?.justification}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", color: "var(--danger)", gap: "0.5rem" }}>
              <AlertCircle size={18} />
              <span>Bu hisse için yapay zeka analiz raporu oluşturulamadı.</span>
            </div>
          )}
        </div>

        {/* Business Description */}
        <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={18} className="text-primary" />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Şirket Hakkında</h3>
          </div>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "var(--secondary-foreground)", lineHeight: "1.6" }}>
            {stockData.description}
          </p>
        </div>
      </div>
  );
}
