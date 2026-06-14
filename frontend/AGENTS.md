<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend - BIST AI Stock Analysis

## Tech Stack
- Next.js 16.2.7, React 19.2.4, Tailwind CSS v4, lucide-react

## Architecture
- Single-page app (SPA) at `src/app/page.js` — all state lives here
- `src/app/Navbar.js` — model selector, reads/writes `/api/config`
- `src/app/layout.js` — root layout wraps page with Navbar
- `src/app/globals.css` — all styles via CSS variables + Tailwind utilities

## Key Conventions
- Turkish language for all UI text
- CSS variables for theming: `--primary, --card, --border, --foreground, --background, --radius, --success, --danger`
- CSS vars in SVG attributes MUST use `style={{ attr: 'var(--name)' }}` NOT presentation attributes
- All state in page.js, no routing (no next/router needed)
- API calls use `/api/` prefix (next.config.mjs rewrites to backend)
- Icons from lucide-react only

## Component Structure
- `page.js` exports default `Home()` function
- State hooks: ticker, searchQuery, stockData, chartData, period, analysis, loading states, error
- Chat state: messages, chatInput, chatLoading, sessionId, sessionIdRef, chatEndRef
- Watchlist: hardcoded array of tickers ["THYAO", "ASELS", "EREGL", "TUPRS", "GARAN"]
- All callbacks use `useCallback` for stable references
- `useEffect` with `queueMicrotask` pattern for React 19 strict mode compatibility

## State Management Patterns
- **Stale request guard**: `requestIdRef` pattern for fetchAnalysis
- **Session persistence**: sessionId in localStorage key `longbridgeChatSessionId`
- **Same-ticker refresh**: `fetchStockDetails(ticker)` called directly from search handler
- **Period change**: `setChartData([])` before fetchChart in useEffect

## Chat System
- Session-based (backend SQLite-backed store via `chat_store.ChatStore`)
- Session ID created on mount via `POST /api/chat/session`
- Messages sent via `POST /api/chat/v2` with `{ session_id, message, ticker }`
- Session cleared from localStorage on 404 (expired), new session auto-created
- Ticker changes reset chat messages (welcome message re-shown)

## SVG Chart
- Interactive area chart with gradient fill
- Tooltip on hover: crosshair line + price/time at cursor
- Computed from chartData via useMemo pathD string
- Chart dimensions computed from container width
- Period tabs: 1mo, 3mo, 6mo, 1y, 2y, 5y
- Score ring: SVG circle with stroke-dasharray/dashoffset for percentage

## Testing
- `cd frontend && npm run lint` — ESLint
- `cd frontend && npm run build` — TypeScript + production build

## Model Selector (Navbar.js)
- `AVAILABLE_MODELS` array defines all dropdown options: `{ id, name }`
- Model ID format: `provider/model-name` (e.g. `deepseek/deepseek-v4-flash`)
- OpenCode Zen: `opencode/<model-id>` → backend routes to `https://opencode.ai/zen/v1`
- OpenCode Go: `opencode-go/<model-id>` → backend routes to `https://opencode.ai/zen/go/v1`
- Backend `/api/config` GET/POST for active model
- Toast notification on successful model change (3s auto-dismiss)
- Default model: `opencode-go/deepseek-v4-flash` (Go) — set in both useState and previousModelRef

## Gotchas
- DeepResearch chart: backend returns plain array, use `setChartData(data)` NOT `setChartData(data.history || [])`
- localStorage access must be wrapped in try-catch for privacy mode compatibility
- Crypto prices in MarketOverview use `formatVal(price, "currency", "USD")` for consistent formatting
- `previousModelRef.current = activeModel` must be set at the very beginning of handleModelChange (before async ops) to avoid stale closure
