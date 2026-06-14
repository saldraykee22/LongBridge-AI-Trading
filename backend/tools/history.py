"""`get_stock_history` tool — returns a compact OHLC summary for a symbol
over a given period. Designed to be small (max ~30 candles) to fit the LLM
context window without flooding it."""

from typing import Any, Dict

import yfinance as yf


SPEC: Dict[str, Any] = {
    "name": "get_stock_history",
    "description": (
        "Bir hissenin son X gün/hafta/aylık fiyat geçmişini özet olarak döndürür. "
        "Başlangıç/bitiş fiyatı, en yüksek/düşük, ortalama hacim ve günlük değişim yüzdeleri verilir."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "ticker": {
                "type": "string",
                "description": "Hisse sembolü (ör: 'THYAO', 'AAPL').",
            },
            "period": {
                "type": "string",
                "description": "Zaman aralığı. yfinance formatı: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max.",
                "default": "1mo",
            },
        },
        "required": ["ticker"],
    },
}


_VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}


def run(ticker: str, period: str = "1mo") -> str:
    # Lazy import to avoid circular dependency
    from main import format_ticker, get_cached_yfinance, set_cached_yfinance, yf_rate_limit_wait

    symbol = (ticker or "").upper().strip()
    if not symbol:
        return "Hata: ticker boş olamaz."

    p = (period or "1mo").lower().strip()
    if p not in _VALID_PERIODS:
        p = "1mo"

    cache_key = f"history_{symbol}_{p}"
    cached = get_cached_yfinance(cache_key, 600.0)  # 10 min
    if cached:
        return cached

    try:
        yf_rate_limit_wait()
        stock = yf.Ticker(format_ticker(symbol))
        hist = stock.history(period=p)
        if hist is None or hist.empty:
            return f"{symbol} için {p} periyodunda fiyat geçmişi bulunamadı."

        start_close = float(hist["Close"].iloc[0])
        end_close = float(hist["Close"].iloc[-1])
        change_pct = ((end_close - start_close) / start_close) * 100
        high = float(hist["High"].max())
        low = float(hist["Low"].min())
        avg_volume = float(hist["Volume"].mean()) if "Volume" in hist.columns else 0
        currency = (stock.info or {}).get("currency", "")
        cs = f" {currency}" if currency else ""

        sign = "+" if change_pct >= 0 else ""
        result = (
            f"## {symbol} — {p} Özeti\n"
            f"- Başlangıç: {start_close:.2f}{cs}\n"
            f"- Kapanış: {end_close:.2f}{cs}\n"
            f"- Değişim: {sign}{change_pct:.2f}%\n"
            f"- En Yüksek: {high:.2f}{cs}\n"
            f"- En Düşük: {low:.2f}{cs}\n"
            f"- Ortalama Hacim: {avg_volume:,.0f}\n"
            f"- Veri Noktası Sayısı: {len(hist)}"
        )
        set_cached_yfinance(cache_key, result)
        return result
    except Exception as e:
        return f"{symbol} için geçmiş veri alınırken hata: {type(e).__name__}: {str(e)[:200]}"
