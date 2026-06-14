"""`get_stock_fundamentals` tool — surfaces key fundamental ratios
(P/E, P/B, market cap, sector, dividend yield, etc.) for a symbol."""

from typing import Any, Dict

import yfinance as yf


SPEC: Dict[str, Any] = {
    "name": "get_stock_fundamentals",
    "description": (
        "Bir hissenin temel finansal oranlarını döndürür: F/K (P/E), PD/DD (P/B), "
        "piyasa değeri, sektör, endüstri, temettü verimi, 52 haftalık aralık."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "ticker": {
                "type": "string",
                "description": "Hisse sembolü (ör: 'THYAO', 'AAPL', 'SAP').",
            }
        },
        "required": ["ticker"],
    },
}


_FIELDS = [
    ("longName", "İsim"),
    ("sector", "Sektör"),
    ("industry", "Endüstri"),
    ("marketCap", "Piyasa Değeri"),
    ("trailingPE", "F/K (P/E)"),
    ("forwardPE", "İleri F/K"),
    ("priceToBook", "PD/DD"),
    ("priceToSalesTrailing12Months", "PD/Satışlar"),
    ("dividendYield", "Temettü Verimi"),
    ("beta", "Beta"),
    ("fiftyTwoWeekHigh", "52H Yüksek"),
    ("fiftyTwoWeekLow", "52H Düşük"),
    ("currency", "Para Birimi"),
]


def run(ticker: str) -> str:
    # Lazy import to avoid circular dependency
    from main import format_ticker, get_cached_yfinance, set_cached_yfinance, yf_rate_limit_wait

    symbol = (ticker or "").upper().strip()
    if not symbol:
        return "Hata: ticker boş olamaz."

    cache_key = f"fundamentals_{symbol}"
    cached = get_cached_yfinance(cache_key, 1800.0)  # 30 min
    if cached:
        return cached

    try:
        yf_rate_limit_wait()
        stock = yf.Ticker(format_ticker(symbol))
        info = stock.info or {}
        if not info:
            return f"{symbol} için temel veri bulunamadı."

        lines = [f"## {info.get('longName') or symbol} — Temel Veriler"]
        for key, label in _FIELDS:
            value = info.get(key)
            if value is None or value == "":
                continue
            if key in ("marketCap",) and isinstance(value, (int, float)):
                v = float(value)
                if v >= 1e12:
                    value = f"{v/1e12:.2f} Trilyon"
                elif v >= 1e9:
                    value = f"{v/1e9:.2f} Milyar"
                elif v >= 1e6:
                    value = f"{v/1e6:.2f} Milyon"
            if key == "dividendYield" and isinstance(value, (int, float)):
                value = f"{value * 100:.2f}%"
            lines.append(f"- {label}: {value}")

        result = "\n".join(lines)
        set_cached_yfinance(cache_key, result)
        return result
    except Exception as e:
        return f"{symbol} için temel veri alınırken hata: {type(e).__name__}: {str(e)[:200]}"
