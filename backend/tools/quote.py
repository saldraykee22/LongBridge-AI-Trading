"""`get_stock_quote` tool — returns latest price, day change, volume and
basic intraday metrics. Backed by yfinance + the existing `YFinanceCache`."""

from typing import Any, Dict

import yfinance as yf

from tools.shared import format_ticker, get_cached_yfinance, set_cached_yfinance, yf_rate_limit_wait


SPEC: Dict[str, Any] = {
    "name": "get_stock_quote",
    "description": (
        "Bir hissenin güncel fiyatını, günlük değişimini, hacmini ve 52 haftalık "
        "aralığını döndürür. BIST hisseleri için ticker'ı uzantısız (ör: 'THYAO'), "
        "Almanya için olduğu gibi (ör: 'SAP') veya ABD için sembol (ör: 'AAPL') olarak geç."
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


def run(ticker: str) -> str:
    symbol = (ticker or "").upper().strip()
    if not symbol:
        return "Hata: ticker boş olamaz."

    cache_key = f"quote_{symbol}"
    cached = get_cached_yfinance(cache_key, 300.0)  # 5 min
    if cached:
        return cached

    try:
        yf_rate_limit_wait()
        stock = yf.Ticker(format_ticker(symbol))
        info = stock.info or {}
        fast_info: Dict[str, Any] = {}
        try:
            fast_info = stock.fast_info or {}
        except Exception:
            pass

        price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or fast_info.get("last_price")
        )
        prev_close = info.get("previousClose") or fast_info.get("previous_close")
        day_high = info.get("dayHigh") or fast_info.get("day_high")
        day_low = info.get("dayLow") or fast_info.get("day_low")
        year_high = info.get("fiftyTwoWeekHigh")
        year_low = info.get("fiftyTwoWeekLow")
        volume = info.get("volume") or fast_info.get("last_volume")
        currency = info.get("currency", "USD")
        name = info.get("longName") or info.get("shortName") or symbol
        exchange = info.get("exchange", "Bilinmiyor")

        if price is None:
            return f"{symbol} için güncel fiyat bilgisi alınamadı."

        change_pct = None
        if prev_close:
            try:
                change_pct = ((float(price) - float(prev_close)) / float(prev_close)) * 100
            except Exception:
                change_pct = None

        lines = [
            f"## {name} ({symbol})",
            f"- Borsa: {exchange}",
            f"- Güncel Fiyat: {price} {currency}",
        ]
        if prev_close is not None:
            lines.append(f"- Önceki Kapanış: {prev_close} {currency}")
        if change_pct is not None:
            sign = "+" if change_pct >= 0 else ""
            lines.append(f"- Günlük Değişim: {sign}{change_pct:.2f}%")
        if day_high is not None:
            lines.append(f"- Gün İçi Yüksek: {day_high} {currency}")
        if day_low is not None:
            lines.append(f"- Gün İçi Düşük: {day_low} {currency}")
        if year_high is not None and year_low is not None:
            lines.append(f"- 52H Yüksek: {year_high} {currency} | 52H Düşük: {year_low} {currency}")
        if volume is not None:
            lines.append(f"- Hacim: {volume:,}")

        result = "\n".join(lines)
        set_cached_yfinance(cache_key, result)
        return result
    except Exception as e:
        return f"{symbol} için fiyat verisi alınırken hata: {type(e).__name__}: {str(e)[:200]}"
