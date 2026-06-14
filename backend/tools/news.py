"""`get_stock_news` tool — wraps the existing `get_news_for_ticker` function
and returns the latest headlines for a given symbol."""

from typing import Any, Dict


SPEC: Dict[str, Any] = {
    "name": "get_stock_news",
    "description": (
        "Bir hisse için en güncel haber başlıklarını ve kaynaklarını döndürür. "
        "BIST, ABD, Almanya ve kripto sembolleri desteklenir."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "ticker": {
                "type": "string",
                "description": "Hisse sembolü (ör: 'THYAO', 'AAPL', 'BTC-USD').",
            },
            "limit": {
                "type": "integer",
                "description": "Maksimum haber sayısı (varsayılan 5, maks 10).",
                "default": 5,
                "minimum": 1,
                "maximum": 10,
            },
        },
        "required": ["ticker"],
    },
}


def run(ticker: str, limit: int = 5) -> str:
    # Lazy import to avoid circular dependency
    from main import get_news_for_ticker

    symbol = (ticker or "").upper().strip()
    if not symbol:
        return "Hata: ticker boş olamaz."
    try:
        capped = max(1, min(int(limit), 10))
        body = get_news_for_ticker(symbol, limit=capped)
        if not body or body.strip() == "Hisseye ait güncel haber bulunamadı.":
            return f"{symbol} için güncel haber bulunamadı."
        return f"## {symbol} — Son Haberler\n{body}"
    except Exception as e:
        return f"{symbol} için haber alınırken hata: {type(e).__name__}: {str(e)[:200]}"
