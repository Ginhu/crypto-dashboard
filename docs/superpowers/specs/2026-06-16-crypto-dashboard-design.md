---
name: Crypto Dashboard Design
description: Vue 3 frontend dashboard consuming a FastAPI crypto backend — architecture, components, data flow, and testing strategy
type: project
---

# Crypto Dashboard — Design Spec

**Date:** 2026-06-16  
**Stack:** Vue 3.4 + Vite 5 · Vue Router 4 (hash) · Pinia 2 · Tailwind CSS 3 · lightweight-charts 4 · Vitest 1 + @vue/test-utils 2

---

## 1. Architecture & Data Flow

```
Browser
  └── Vue Router (hash history)
        ├── /         → redirect /market
        ├── /market   → MarketPage
        ├── /backtest → BacktestPage
        └── /health   → HealthPage

MarketPage
  ├── useMarket() composable  →  market Pinia store
  │     fetchCandles()  →  GET  /api/v1/market/{symbol}/klines
  │     saveCandles()   →  POST /api/v1/market/{symbol}/klines
  └── CandleChart.vue  ← reads store.candles

BacktestPage
  ├── useBacktest() composable  →  backtest Pinia store
  │     submit()       →  POST /api/v1/backtest
  │     poll loop      →  GET  /api/v1/backtest/{job_id} every 2 000 ms
  │     stopPolling()  →  clearInterval, called on unmount
  └── ResultsTable.vue ← reads store.results

AppSidebar
  └── health dot  →  GET /api/v1/health every 30 s (no store, local ref)
```

**Layer responsibilities:**
- **Stores** — all async state (`loading`, `error`, `candles`, `results`, `jobId`, `status`, `savedCount`)
- **Composables** — thin orchestrators: call API, update store, catch errors
- **Components** — purely presentational, read from store or receive props

All API calls derive base URL from:
```js
import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
```

---

## 2. Backend API Contract

Base URL: `http://localhost:8000/api/v1`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness check |
| GET | `/market/{symbol}/klines` | Fetch candle data |
| POST | `/market/{symbol}/klines` | Persist candle data |
| POST | `/backtest` | Submit backtest job (returns 202) |
| GET | `/backtest/{job_id}` | Poll job status |

CORS must allow `http://localhost:5173` on the backend.

Query params for klines: `interval` (default `5m`), `start` (YYYY-MM-DD), `end` (YYYY-MM-DD).

Backtest body: `{ symbol, interval, start, end, strategies[] }`.  
Strategies: `rsi_oversold`, `ma_crossover_20_50`.

---

## 3. Design System

**Color tokens** (extend `tailwind.config.js`):

| Token | Hex |
|-------|-----|
| bg | `#0d0d1a` |
| sidebar | `#111127` |
| card | `#1a1a30` |
| accent | `#7c9ef8` |
| success | `#4ade80` |
| danger | `#f87171` |
| border | `#1e1e3a` |

Dark theme throughout. Sidebar fixed `w-28`.

---

## 4. File Structure

```
src/
├── main.js
├── style.css
├── App.vue                          # sidebar + RouterView shell
├── router/index.js
├── stores/
│   ├── market.js                    # symbol, interval, start, end, candles, loading, error, savedCount
│   └── backtest.js                  # jobId, status, strategies, results, error, pollTimer
├── composables/
│   ├── useMarket.js                 # fetchCandles(), saveCandles()
│   └── useBacktest.js               # submit(), stopPolling()
├── components/
│   ├── AppSidebar.vue               # nav links + health dot (polls /health every 30s)
│   ├── market/CandleChart.vue       # lightweight-charts wrapper
│   └── backtest/ResultsTable.vue    # sorted results table
└── pages/
    ├── MarketPage.vue
    ├── BacktestPage.vue
    └── HealthPage.vue
```

---

## 5. Component Specifications

### AppSidebar.vue
- Fixed dark sidebar (`bg-sidebar`), nav links to `/market`, `/backtest`, `/health`
- Health dot at bottom polls `GET /health` every 30s via local `setInterval`
- Shows `● API OK` (`text-success`) or `● API down` (`text-danger`)

### MarketPage.vue
- **Form:** symbol input (v-model + `toUpperCase()`), interval `<select>` (1m 3m 5m 15m 30m 1h 4h 1d, default `5m`), start/end date inputs (defaults: today and 30 days ago)
- **Fetch button** → `fetchCandles()` → renders CandleChart
- **Save button** → `saveCandles()` → shows `Saved {n} candles`
- **Stats bar** (after fetch): candle count · last close price · open→close % change (green if positive, red if negative)
- Error message shown when `store.error` is set

### CandleChart.vue
- lightweight-charts v4 `createChart` + `addCandlestickSeries`
- Map before `setData`:
  ```js
  { time: Math.floor(Date.parse(c.open_time) / 1000), open: parseFloat(c.open),
    high: parseFloat(c.high), low: parseFloat(c.low), close: parseFloat(c.close) }
  ```
- upColor `#26a69a`, downColor `#ef5350`
- `ResizeObserver` on container div; chart destroyed on `onUnmounted`

### BacktestPage.vue
- Two-column layout: left form, right results panel
- **Form:** symbol, interval, start/end dates, checkboxes for `rsi_oversold` and `ma_crossover_20_50`
- **Submit button** → `submit()`
- **Right panel:** status badge reflecting `store.status` (pending/running/completed/failed) + ResultsTable when completed, error text when failed

### ResultsTable.vue
- Columns: Strategy | Return | Win Rate | Drawdown | Sharpe | Trades
- Pre-sorted descending by `total_return_pct`
- Return cell: green (`text-success`) if positive, red (`text-danger`) if negative
- Drawdown cell: green if 0, red if negative

### HealthPage.vue
- Fetches `GET /health` on mount
- Large status badge: `healthy` (`bg-success`) or `unreachable` (`bg-danger`)
- Raw JSON response in `<pre>`
- Refresh button re-fetches

---

## 6. Key Implementation Details

### useBacktest.js — polling loop
```js
// After POST /backtest returns job_id:
store.pollTimer = setInterval(async () => {
  const data = await pollJob(store.jobId)
  store.status = data.status
  if (data.status === 'completed') { store.results = data.results; clearInterval(store.pollTimer) }
  if (data.status === 'failed')    { store.error = data.error;   clearInterval(store.pollTimer) }
}, 2000)

// In component onUnmounted:
stopPolling()  // calls clearInterval(store.pollTimer)
```

### Router
```js
// Hash history, redirect / → /market
{ path: '/', redirect: '/market' },
{ path: '/market', component: MarketPage },
{ path: '/backtest', component: BacktestPage },
{ path: '/health', component: HealthPage },
```

---

## 7. Testing Strategy (Medium Depth)

**Vitest 1 + @vue/test-utils 2 + jsdom**

### Stores
- Initial state shape
- Successful mutation (candles populated, results populated)
- Error state set on API failure

### Composables (mock global `fetch`)
- `fetchCandles()`: happy path sets store candles; API error sets `store.error`
- `saveCandles()`: happy path sets `store.savedCount`
- `submit()`: happy path starts polling, sets `store.jobId`
- Polling: stops on `completed` (results stored), stops on `failed` (error stored)
- `stopPolling()`: clears interval

### Components
- `CandleChart`: renders container div, `setData` called with numeric-mapped candles
- `ResultsTable`: all rows rendered, sorted by return descending, positive return green, negative drawdown red
- `AppSidebar`: green dot on health ok, red dot on health down

### Pages (stub composables)
- `MarketPage`: Fetch button calls `fetchCandles`, Save button calls `saveCandles`, stats bar visible after candles load, error message on `store.error`
- `BacktestPage`: Submit calls `submit()`, status badge reflects `store.status`, ResultsTable appears when `completed`
- `HealthPage`: fetches on mount, Refresh button re-fetches

**Not tested:** ResizeObserver internals, canvas rendering, timer precision.

---

## 8. Build Order (TDD — each layer tests-first)

1. `package.json` · `vite.config.js` · `tailwind.config.js` · `postcss.config.js` · `index.html` · `.env`
2. `src/style.css` · `src/main.js` · `src/router/index.js` · `src/App.vue`
3. `stores/market.js` → `stores/backtest.js`
4. `composables/useMarket.js` → `composables/useBacktest.js`
5. `components/AppSidebar.vue` → `components/market/CandleChart.vue` → `components/backtest/ResultsTable.vue`
6. `pages/MarketPage.vue` → `pages/BacktestPage.vue` → `pages/HealthPage.vue`
