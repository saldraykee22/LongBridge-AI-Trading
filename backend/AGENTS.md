# Backend - BIST AI Stock Analysis

## Tech Stack
- Python 3.11, FastAPI, uvicorn, yfinance, litellm, beautifulsoup4

## API Endpoints
List ALL endpoints with their methods, paths, and brief descriptions:
- GET /api/stock/{ticker}
- GET /api/stock/{ticker}/chart
- GET /api/stock/{ticker}/analysis
- POST /api/chat (legacy)
- POST /api/chat/session
- GET /api/chat/session/{session_id}
- POST /api/chat/session/{session_id}/reset
- POST /api/chat/v2
- GET /api/chat/stats
- GET /api/config
- POST /api/config
- POST /api/market/scan
- GET /api/market/scan/status/{task_id}
- POST /api/market/deep-research
- GET /api/market/deep-research/status/{task_id}
- GET /api/market/overview
- GET /api/market/screener
- GET /api/market/ai-ranking
- GET /api/market/recommendations


## Data Flow
- yfinance fetches stock data, chart, news
- litellm.completion for AI analysis and chat
- extract_json() for LLM response parsing (2 layers: direct json.loads + balanced-braces regex; 3rd layer is a strict-retry prompt handled by the caller `get_stock_analysis`)
- chat_store (SQLite-backed) for session management
- Peewee + SQLite (`backend/longbridge.db`) for all cache + session storage — `YFinanceCache`, `AnalysisCache`, `TranslationCache`, `ChatSession`

## Key Functions
- format_ticker(ticker) — appends .IS for BIST if ticker is 5 chars or in BIST company list; len <= 3 tickers never get .IS (US stocks safe)
- extract_json(text) — 2-layer JSON extraction (direct parse + balanced braces)
- get_stock_analysis(ticker, model) — multi-agent analysis with retry
- _get_litellm_kwargs(model) — routes opencode/ (Zen) and opencode-go/ (Go) to custom api_base
- _persist_model_to_env(model) — writes model change to .env file for persistence across restarts
- _cleanup_old_tasks(tasks_dict, tasks_lock, max_age) — removes tasks older than max_age (default 1h)
- yf_rate_limit_wait() — 2s cooldown between Yahoo Finance requests
- get_cached_yfinance(key, ttl) — thread-safe Peewee-backed cache read; lazy eviction of records older than 24h triggered with 5% probability per call (`random.random() < 0.05`)
- set_cached_yfinance(key, val) — Peewee upsert via `INSERT ... ON CONFLICT(key) PRESERVE data, updated_at`

## Conventions
- Use Optional[X] = None for optional params
- Use Pydantic BaseModel for request/response schemas
- HTTPException for error handling
- /api/ prefix for all endpoints
- Turkish system prompts for LLM
- Model config stored in AppConfig class
- API keys from .env via load_dotenv()

## Gotchas
- `format_ticker` now uses `len <= 3` guard — 2-3 char US tickers (AI, GE, V, MA) never get .IS suffix
- yfinance timeout set globally via requests.Session patch (30s)
- Yahoo Finance rate limiter: `yf_rate_limit_wait()` enforces 2s cooldown between requests
- LLM JSON extraction uses 2 attempts with increasingly strict prompts
- Chat session TTL defaults to 3600s, configurable via CHAT_SESSION_TTL env
- CORS origins from ALLOWED_ORIGINS env var (comma-separated), methods restricted to GET/POST/OPTIONS
- OpenCode Zen/Go models: prefix `opencode/` or `opencode-go/` → `_get_litellm_kwargs` maps to openai provider with custom api_base
- `.env` vars: `OPENCODE_ZEN_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_BASE`, `OPENCODE_GO_API_BASE`
- Model changes persisted to `.env` via `_persist_model_to_env()` — survives backend restart
- Task dicts (scan_tasks, deep_research_tasks) have `created_at` timestamps and are cleaned up after 1h via `_cleanup_old_tasks()`
- Error responses cached with fixed 60s TTL (not dynamic TTL) to avoid repeated failed requests
- Cache hit in `get_stock_data`: `if cached: return cached` — translation check is separate block (no infinite loop)
- Market overview: double-check locking pattern — cache-hit check under `_market_overview_lock`, fetch outside the lock, atomic write under lock on completion
- DeepResearch scoring: uses `period="1mo"` (not 5d), includes RSI(14), SMA20 trend, weekly change, volume power
