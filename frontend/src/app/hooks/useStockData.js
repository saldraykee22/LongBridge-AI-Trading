import { useState, useCallback, useRef } from "react";

export function useStockData() {
  const [ticker, setTicker] = useState("THYAO");
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("1mo");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);
  const stockRequestControllerRef = useRef(null);
  const chartRequestControllerRef = useRef(null);

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

  const fetchStockDetails = useCallback(async (symbol, setMessages) => {
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

      fetchAnalysis(symbol, false).catch(() => {});

      if (setMessages) {
        setMessages([
          {
            role: "assistant",
            content: `Merhaba! Ben LongBridge AI Analistiniz. **${symbol.toUpperCase()}** hissesini incelemeye hazırım. Teknik, temel verileri ve haberleri kullanarak hisse senedini analiz ettim. Hisse hakkında merak ettiğiniz her şeyi bana sorabilirsiniz.`
          }
        ]);
      }

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

  return {
    ticker,
    setTicker,
    stockData,
    setStockData,
    chartData,
    setChartData,
    period,
    setPeriod,
    analysis,
    loading,
    analysisLoading,
    error,
    setError,
    fetchStockDetails,
    fetchChart,
    fetchAnalysis
  };
}
