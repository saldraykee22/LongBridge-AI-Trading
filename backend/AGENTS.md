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
- extract_json() for LLM response parsing (3 layers)
- chat_store for session management

## Key Functions
- format_ticker(ticker) — appends .IS for BIST if ticker >= 2 chars
- extract_json(text) — 3-layer JSON extraction
- get_stock_analysis(ticker, model) — multi-agent analysis with retry
- _get_litellm_kwargs(model) — routes opencode/ (Zen) and opencode-go/ (Go) to custom api_base

## Conventions
- Use Optional[X] = None for optional params
- Use Pydantic BaseModel for request/response schemas
- HTTPException for error handling
- /api/ prefix for all endpoints
- Turkish system prompts for LLM
- Model config stored in AppConfig class
- API keys from .env via load_dotenv()

## Gotchas
- `format_ticker` >= 2 threshold: 2-char US tickers get .IS suffix (known limitation)
- yfinance timeout set globally via requests.Session patch (30s)
- LLM JSON extraction uses 2 attempts with increasingly strict prompts
- Chat session TTL defaults to 3600s, configurable via CHAT_SESSION_TTL env
- CORS origins from ALLOWED_ORIGINS env var (comma-separated)
- OpenCode Zen/Go models: prefix `opencode/` or `opencode-go/` → `_get_litellm_kwargs` maps to openai provider with custom api_base
- `.env` vars: `OPENCODE_ZEN_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_BASE`, `OPENCODE_GO_API_BASE`
