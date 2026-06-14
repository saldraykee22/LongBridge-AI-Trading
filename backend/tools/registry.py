"""Tool registry and dispatcher for the independent (ticker-free) chat.

Each tool exposes:
- a `name`
- an OpenAI-compatible JSON schema (`parameters`) consumed by litellm
- a synchronous `run(**kwargs) -> str` implementation

Tools are deliberately limited to **internal** data sources already shipped
in this repo (yfinance + Mynet/KAP scraping). No external web search.

The dispatcher (`dispatch`) is called by the chat endpoint after the LLM
returns a `tool_calls` payload. The result is returned to the LLM as a
`tool` role message for the next turn.

OpenAI / Deepseek tool spec format:
    {
        "type": "function",
        "function": {
            "name": "...",
            "description": "...",
            "parameters": {... JSON schema ...}
        }
    }
The outer `type: "function"` wrapper is required by Deepseek's API
(returns 400 "missing field `type`" otherwise).
"""
from typing import Any, Callable, Dict, List

from loguru import logger

from .quote import run as quote_run, SPEC as QUOTE_SPEC
from .news import run as news_run, SPEC as NEWS_SPEC
from .fundamentals import run as fundamentals_run, SPEC as FUNDAMENTALS_SPEC
from .history import run as history_run, SPEC as HISTORY_SPEC


def _wrap(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Wrap an internal tool spec in the OpenAI/Deepseek function envelope."""
    wrapped = {
        "type": "function",
        "function": {
            "name": spec["name"],
            "description": spec.get("description", ""),
            "parameters": spec.get("parameters", {"type": "object", "properties": {}}),
        },
    }
    # DeepSeek API requires "type" field at the top level of each tool.
    # Validate to catch litellm serialization issues early.
    if "type" not in wrapped or wrapped["type"] != "function":
        logger.error(f"Tool spec '{spec['name']}' missing 'type: function' after wrap!")
    return wrapped


TOOL_SPECS: List[Dict[str, Any]] = [
    _wrap(QUOTE_SPEC),
    _wrap(NEWS_SPEC),
    _wrap(FUNDAMENTALS_SPEC),
    _wrap(HISTORY_SPEC),
]


_REGISTRY: Dict[str, Callable[..., str]] = {
    QUOTE_SPEC["name"]: quote_run,
    NEWS_SPEC["name"]: news_run,
    FUNDAMENTALS_SPEC["name"]: fundamentals_run,
    HISTORY_SPEC["name"]: history_run,
}


MAX_TOOL_TURNS = 3


def get_specs() -> List[Dict[str, Any]]:
    return TOOL_SPECS


def get_tool_names() -> List[str]:
    return [s["function"]["name"] for s in TOOL_SPECS]


def dispatch(tool_name: str, arguments: Dict[str, Any]) -> str:
    """Execute a tool by name with the given arguments. Returns a string
    payload (always safe to inject back into the LLM context — caller MUST
    wrap it in <GÜVENİLMEYEN_DIŞ_VERİ> tags)."""
    fn = _REGISTRY.get(tool_name)
    if fn is None:
        logger.warning(f"Tool dispatch: unknown tool '{tool_name}'")
        return f"Hata: bilinmeyen araç '{tool_name}'."
    try:
        result = fn(**arguments)
        if not isinstance(result, str):
            result = str(result)
        # Cap result length to avoid blowing up the context window
        return result[:6000]
    except Exception as e:
        logger.exception(f"Tool '{tool_name}' execution failed: {e}")
        return f"Araç çalıştırılırken hata oluştu: {type(e).__name__}: {str(e)[:200]}"

