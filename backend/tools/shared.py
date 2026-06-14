"""Shared utilities for backend tools — extracted from main.py to avoid circular imports."""

import time
from typing import Any, Optional

# Currency symbol mapping (mirrors main.py)
CURRENCY_SYMBOLS = {"USD": "$", "EUR": "\u20ac", "TRY": "\u20ba", "GBP": "\u00a3", "JPY": "\u00a5"}

# =============================================================================
# Simplified in-memory cache (tools use this instead of main.py's peewee SQLite)
# =============================================================================
_yfinance_simple_cache: dict = {}
_cache_timestamps: dict = {}


def get_cached_yfinance(key: str, ttl_seconds: float = 600.0) -> Optional[Any]:
    entry = _yfinance_simple_cache.get(key)
    if entry is not None:
        age = time.time() - _cache_timestamps.get(key, 0)
        if age < ttl_seconds:
            return entry
    return None


def set_cached_yfinance(key: str, val: Any) -> None:
    _yfinance_simple_cache[key] = val
    _cache_timestamps[key] = time.time()


# =============================================================================
# Yahoo Finance rate-limit cooldown (mirrors main.py's threading-based version)
# =============================================================================
_last_yf_request: float = 0.0


def yf_rate_limit_wait(min_interval: float = 2.0) -> None:
    global _last_yf_request
    now = time.time()
    elapsed = now - _last_yf_request
    if elapsed < min_interval:
        time.sleep(min_interval - elapsed)
    _last_yf_request = time.time()


# =============================================================================
# format_ticker — replicates main.py logic exactly (without the dynamic BIST
# lookup to avoid circular dependency on main.get_bist_companies).
# =============================================================================
_BIST_COMPANIES = {
    "GARAN", "AKBNK", "THYAO", "EREGL", "TUPRS", "SASA", "ASELS", "KCHOL",
    "SAHOL", "TOASO", "FROTO", "PETKM", "BIMAS", "TCELL", "TTKOM", "YKBNK",
    "ISCTR", "HALKB", "VAKBN", "SISE", "KOZAA", "KOZAL", "ALARK", "TAVHL",
    "PGSUS", "MGROS", "SOKM", "OTKAR", "TTRAK", "DOAS", "VESBE", "CCOLA",
    "ULKER", "HEKTS", "GUBRF", "BRSAN", "KORDS", "SODA", "AYGAZ", "ENKAI",
    "ASTOR", "KONTR", "YEOTK", "SMRTG", "EUPWR",
}

_GERMAN_STOCKS = {
    "SAP", "SIE", "ALV", "VOW3", "BMW", "DTE", "BAS", "BAYN", "IFX", "MBG",
}

_US_STOCKS = {
    "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL", "META", "AMD", "NFLX",
    "COIN", "BABA", "AI", "GE", "GOOG", "DIS", "NKE", "SBUX", "V", "MA",
    "WMT", "PLTR", "ROKU", "JPM", "BAC", "XOM", "PFE", "MRK", "KO", "JNJ",
    "INTC", "CSCO", "PYPL", "HD", "PG",
}


def format_ticker(ticker: str) -> str:
    """Append .IS for BIST stocks, .DE for German stocks, keep US/crypto intact.
    Replicates main.py's logic exactly (minus the dynamic get_bist_companies call)."""
    ticker_upper = ticker.upper().strip()
    if "." in ticker_upper or "-" in ticker_upper or "=" in ticker_upper:
        return ticker_upper

    if ticker_upper in _BIST_COMPANIES:
        return ticker_upper + ".IS"

    if ticker_upper in _GERMAN_STOCKS:
        return ticker_upper + ".DE"

    if ticker_upper in _US_STOCKS:
        return ticker_upper

    if len(ticker_upper) <= 3:
        return ticker_upper

    if len(ticker_upper) == 5:
        return ticker_upper + ".IS"
    return ticker_upper
