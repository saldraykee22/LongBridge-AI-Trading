"use client";

import { useState, useMemo } from "react";
import { Activity } from "lucide-react";

const CHART_WIDTH = 750;
const CHART_HEIGHT = 280;
const CHART_PADDING = 35;

export default function SVGChart({ chartData, period, setPeriod, formatVal, currency }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return { min: 0, max: 0, change: 0, changePercent: 0, color: "var(--foreground)" };
    const closes = chartData.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    const color = change >= 0 ? "var(--success)" : "var(--danger)";
    return { min, max, change, changePercent, color };
  }, [chartData]);

  const { points, pathD, areaD, minClose, maxClose } = useMemo(() => {
    if (!chartData || chartData.length === 0) return { points: [], pathD: "", areaD: "", minClose: 0, maxClose: 0 };

    const closes = chartData.map(d => d.close);
    const min = Math.min(...closes) * 0.985;
    const max = Math.max(...closes) * 1.015;
    const range = max - min || 1;

    const pts = chartData.map((d, index) => {
      const x = CHART_PADDING + (index / (chartData.length - 1)) * (CHART_WIDTH - CHART_PADDING * 2);
      const y = CHART_HEIGHT - CHART_PADDING - ((d.close - min) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
      return { x, y, ...d };
    });

    const pD = pts.reduce((acc, p, index) => {
      return acc + (index === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    const aD = pD + ` L ${pts[pts.length - 1].x} ${CHART_HEIGHT - CHART_PADDING} L ${pts[0].x} ${CHART_HEIGHT - CHART_PADDING} Z`;

    return { points: pts, pathD: pD, areaD: aD, minClose: min, maxClose: max };
  }, [chartData]);

  const handleMouseMove = (e) => {
    if (points.length === 0) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * CHART_WIDTH;

    let closest = points[0];
    let minDiff = Math.abs(points[0].x - svgX);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }
    setHoveredPoint(closest);
  };

  return (
    <div className="card glass animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity size={18} className="text-primary" />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Fiyat Analiz Grafiği</h3>
        </div>

        {chartData && chartData.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--secondary-foreground)", fontWeight: "500" }}>
            <div>En Düşük: <span style={{ color: "var(--foreground)", fontWeight: "600" }}>{formatVal(stats.min, "currency", currency)}</span></div>
            <div>En Yüksek: <span style={{ color: "var(--foreground)", fontWeight: "600" }}>{formatVal(stats.max, "currency", currency)}</span></div>
            <div>Değişim: <span style={{ color: stats.color, fontWeight: "600" }}>{stats.changePercent >= 0 ? "+" : ""}{stats.changePercent.toFixed(2)}%</span></div>
          </div>
        )}

        <div className="chart-tabs">
          {["5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"].map((p) => (
            <button
              key={p}
              className={`chart-tab ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase().replace("MO", " Ay").replace("D", " Gün").replace("Y", " Yıl")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", minHeight: `${CHART_HEIGHT}px`, width: "100%", overflowX: "auto" }}>
        {chartData && chartData.length > 0 ? (
          <svg
            role="img"
            aria-label="Fiyat grafiği"
            width="100%"
            height={CHART_HEIGHT}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            style={{ display: "block", overflow: "visible", cursor: "crosshair" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: '0.25' }} />
                <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: '0.00' }} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2);
              const val = maxClose - ratio * (maxClose - minClose);
              return (
                <g key={index}>
                  <line
                    x1={CHART_PADDING}
                    y1={y}
                    x2={CHART_WIDTH - CHART_PADDING}
                    y2={y}
                    style={{ stroke: 'var(--border)', strokeWidth: 1 }}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={CHART_PADDING - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="0.7rem"
                    style={{ fill: 'var(--secondary-foreground)' }}
                    fontWeight="500"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {areaD && (
              <path d={areaD} fill="url(#chartGradient)" />
            )}

            {pathD && (
              <path
                d={pathD}
                fill="none"
                style={{ stroke: 'var(--primary)', strokeWidth: 2.5 }}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {hoveredPoint && (
              <g>
                {/* Dikey kılavuz çizgi */}
                <line
                  x1={hoveredPoint.x}
                  y1={CHART_PADDING}
                  x2={hoveredPoint.x}
                  y2={CHART_HEIGHT - CHART_PADDING}
                  style={{ stroke: 'var(--primary)', strokeWidth: 1.2 }}
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                {/* Yatay kılavuz çizgi */}
                <line
                  x1={CHART_PADDING}
                  y1={hoveredPoint.y}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={hoveredPoint.y}
                  style={{ stroke: 'var(--primary)', strokeWidth: 1.2 }}
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                {/* Merkez nokta halkası */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r={5}
                  style={{ fill: 'var(--primary)', stroke: 'var(--foreground)', strokeWidth: 1.5 }}
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r={10}
                  style={{ fill: 'var(--primary)' }}
                  opacity="0.15"
                />
              </g>
            )}
          </svg>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: `${CHART_HEIGHT}px`, color: "var(--secondary-foreground)", fontSize: "0.9rem" }}>
            Grafik verisi yükleniyor...
          </div>
        )}

        {hoveredPoint && (
          <div style={{
            position: "absolute",
            left: `${(hoveredPoint.x / CHART_WIDTH) * 100}%`,
            top: `${(hoveredPoint.y / CHART_HEIGHT) * 100 - 18}%`,
            transform: "translate(-50%, -100%)",
            background: "rgba(11, 15, 25, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid var(--border)",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius)",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            fontSize: "0.75rem",
            color: "var(--foreground)",
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)" }}></span>
              <span style={{ fontWeight: "700" }}>{formatVal(hoveredPoint.close, "currency", currency)}</span>
            </div>
            <div style={{ color: "var(--secondary-foreground)", fontSize: "0.65rem", paddingLeft: "0.6rem" }}>{hoveredPoint.time}</div>
          </div>
        )}
      </div>
    </div>
  );
}
