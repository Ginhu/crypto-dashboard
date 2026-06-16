# Crypto Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 dark-themed dashboard that lets users fetch/save market candles, visualize them on a candlestick chart, run backtests with polling, and check API health.

**Architecture:** Pinia stores hold all async state; thin composables call the FastAPI backend and update the store; components are purely presentational. Polling for backtest jobs runs via `setInterval` and is always cleared on component unmount.

**Tech Stack:** Vue 3.4 · Vite 5 · Vue Router 4 (hash) · Pinia 2 · Tailwind CSS 3 · lightweight-charts 4 · Vitest 1 · @vue/test-utils 2 · jsdom

---

## File Map

```
package.json                                  npm workspace + scripts
vite.config.js                                Vite + Vitest (jsdom) config
tailwind.config.js                            color token extensions
postcss.config.js                             Tailwind + autoprefixer
index.html                                    HTML entry
.env                                          VITE_API_BASE_URL

src/style.css                                 Tailwind directives + body bg
src/main.js                                   createApp → Pinia → Router → mount
src/router/index.js                           hash history, 4 routes
src/App.vue                                   sidebar shell + RouterView

src/stores/market.js                          symbol/interval/dates/candles/loading/error/savedCount
src/stores/backtest.js                        jobId/status/strategies/results/error/pollTimer
src/stores/__tests__/market.test.js
src/stores/__tests__/backtest.test.js

src/composables/useMarket.js                  fetchCandles(), saveCandles()
src/composables/useBacktest.js                submit(), stopPolling()
src/composables/__tests__/useMarket.test.js
src/composables/__tests__/useBacktest.test.js

src/components/AppSidebar.vue                 nav + health dot (30s poll)
src/components/market/CandleChart.vue         lightweight-charts wrapper
src/components/backtest/ResultsTable.vue      sorted results table
src/components/__tests__/AppSidebar.test.js
src/components/__tests__/CandleChart.test.js
src/components/__tests__/ResultsTable.test.js

src/pages/MarketPage.vue                      form + chart + stats bar
src/pages/BacktestPage.vue                    two-column form + results
src/pages/HealthPage.vue                      status badge + JSON pre + refresh
src/pages/__tests__/MarketPage.test.js
src/pages/__tests__/BacktestPage.test.js
src/pages/__tests__/HealthPage.test.js
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `.env`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "crypto-dashboard",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "lightweight-charts": "^4.2.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.0",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "@vue/test-utils": "^2.4.6",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write vite.config.js**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Write tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d1a',
        sidebar: '#111127',
        card: '#1a1a30',
        accent: '#7c9ef8',
        success: '#4ade80',
        danger: '#f87171',
        border: '#1e1e3a',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Write postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crypto Dashboard</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 6: Write .env**

```
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 8: Commit**

```bash
git init
git add package.json vite.config.js tailwind.config.js postcss.config.js index.html .env
git commit -m "feat: project scaffold"
```

---

## Task 2: Base Source Files

**Files:**
- Create: `src/style.css`
- Create: `src/main.js`
- Create: `src/router/index.js`
- Create: `src/App.vue`

> No unit tests for these files — they are infrastructure glue verified by running the dev server.

- [ ] **Step 1: Write src/style.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0d0d1a;
  color: #e2e8f0;
}
```

- [ ] **Step 2: Write src/router/index.js**

> Pages are imported lazily to avoid circular-dep issues at startup.

```js
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/market' },
    { path: '/market', component: () => import('../pages/MarketPage.vue') },
    { path: '/backtest', component: () => import('../pages/BacktestPage.vue') },
    { path: '/health', component: () => import('../pages/HealthPage.vue') },
  ],
})
```

- [ ] **Step 3: Write src/main.js**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 4: Write src/App.vue**

```vue
<template>
  <div class="flex min-h-screen bg-bg">
    <AppSidebar />
    <main class="flex-1 p-6 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './components/AppSidebar.vue'
</script>
```

- [ ] **Step 5: Create stub page files so the router resolves**

Create `src/pages/MarketPage.vue`:
```vue
<template><div>Market</div></template>
```

Create `src/pages/BacktestPage.vue`:
```vue
<template><div>Backtest</div></template>
```

Create `src/pages/HealthPage.vue`:
```vue
<template><div>Health</div></template>
```

Create `src/components/AppSidebar.vue`:
```vue
<template><aside class="w-28 bg-sidebar" /></template>
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite prints a local URL (`http://localhost:5173`). Open it — dark background, no errors in console.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: base source files and router"
```

---

## Task 3: Market Store

**Files:**
- Create: `src/stores/market.js`
- Create: `src/stores/__tests__/market.test.js`

- [ ] **Step 1: Write the failing test**

`src/stores/__tests__/market.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarketStore } from '../market'

describe('market store', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('has correct initial state', () => {
    const store = useMarketStore()
    expect(store.symbol).toBe('BTCUSDT')
    expect(store.interval).toBe('5m')
    expect(store.candles).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.savedCount).toBeNull()
    expect(store.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(store.end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accepts candle updates', () => {
    const store = useMarketStore()
    const candles = [{ open_time: '2026-05-17T00:00:00Z', open: '65000', high: '65500', low: '64800', close: '65200', volume: '123' }]
    store.candles = candles
    expect(store.candles).toEqual(candles)
  })

  it('accepts error updates', () => {
    const store = useMarketStore()
    store.error = 'Network error'
    expect(store.error).toBe('Network error')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/stores/__tests__/market.test.js
```

Expected: FAIL — `Cannot find module '../market'`

- [ ] **Step 3: Write src/stores/market.js**

```js
import { defineStore } from 'pinia'

const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]

export const useMarketStore = defineStore('market', {
  state: () => ({
    symbol: 'BTCUSDT',
    interval: '5m',
    start: daysAgo(30),
    end: today(),
    candles: [],
    loading: false,
    error: null,
    savedCount: null,
  }),
})
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/stores/__tests__/market.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/stores/market.js src/stores/__tests__/market.test.js
git commit -m "feat: market store with tests"
```

---

## Task 4: Backtest Store

**Files:**
- Create: `src/stores/backtest.js`
- Create: `src/stores/__tests__/backtest.test.js`

- [ ] **Step 1: Write the failing test**

`src/stores/__tests__/backtest.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBacktestStore } from '../backtest'

describe('backtest store', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('has correct initial state', () => {
    const store = useBacktestStore()
    expect(store.jobId).toBeNull()
    expect(store.status).toBeNull()
    expect(store.strategies).toEqual([])
    expect(store.results).toEqual([])
    expect(store.error).toBeNull()
    expect(store.pollTimer).toBeNull()
  })

  it('accepts job updates', () => {
    const store = useBacktestStore()
    store.jobId = 'abc-123'
    store.status = 'pending'
    expect(store.jobId).toBe('abc-123')
    expect(store.status).toBe('pending')
  })

  it('accepts results', () => {
    const store = useBacktestStore()
    const results = [{ strategy: 'rsi_oversold', total_return_pct: 5.25, win_rate_pct: 62.5, max_drawdown_pct: -8.3, sharpe_ratio: 1.23, num_trades: 16 }]
    store.results = results
    expect(store.results).toEqual(results)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/stores/__tests__/backtest.test.js
```

Expected: FAIL — `Cannot find module '../backtest'`

- [ ] **Step 3: Write src/stores/backtest.js**

```js
import { defineStore } from 'pinia'

export const useBacktestStore = defineStore('backtest', {
  state: () => ({
    jobId: null,
    status: null,
    strategies: [],
    results: [],
    error: null,
    pollTimer: null,
  }),
})
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/stores/__tests__/backtest.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/stores/backtest.js src/stores/__tests__/backtest.test.js
git commit -m "feat: backtest store with tests"
```

---

## Task 5: useMarket Composable

**Files:**
- Create: `src/composables/useMarket.js`
- Create: `src/composables/__tests__/useMarket.test.js`

- [ ] **Step 1: Write the failing test**

`src/composables/__tests__/useMarket.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarket } from '../useMarket'
import { useMarketStore } from '../../stores/market'

const CANDLES = [{
  open_time: '2026-05-17T00:00:00Z', open: '65000', high: '65500',
  low: '64800', close: '65200', volume: '123',
}]

describe('useMarket', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('fetchCandles: sets store.candles on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ symbol: 'BTCUSDT', interval: '5m', candles: CANDLES }),
    })
    const { fetchCandles } = useMarket()
    await fetchCandles()
    expect(useMarketStore().candles).toEqual(CANDLES)
    expect(useMarketStore().error).toBeNull()
  })

  it('fetchCandles: sets store.error on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const { fetchCandles } = useMarket()
    await fetchCandles()
    expect(useMarketStore().error).toBe('HTTP 500')
    expect(useMarketStore().candles).toEqual([])
  })

  it('saveCandles: sets store.savedCount on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ symbol: 'BTCUSDT', interval: '5m', candles_saved: 2880 }),
    })
    const { saveCandles } = useMarket()
    await saveCandles()
    expect(useMarketStore().savedCount).toBe(2880)
  })

  it('saveCandles: sets store.error on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    const { saveCandles } = useMarket()
    await saveCandles()
    expect(useMarketStore().error).toBe('HTTP 503')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/composables/__tests__/useMarket.test.js
```

Expected: FAIL — `Cannot find module '../useMarket'`

- [ ] **Step 3: Write src/composables/useMarket.js**

```js
import { useMarketStore } from '../stores/market'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export function useMarket() {
  const store = useMarketStore()

  async function fetchCandles() {
    store.loading = true
    store.error = null
    try {
      const params = new URLSearchParams({ interval: store.interval, start: store.start, end: store.end })
      const res = await fetch(`${BASE}/api/v1/market/${store.symbol}/klines?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      store.candles = data.candles
    } catch (e) {
      store.error = e.message
    } finally {
      store.loading = false
    }
  }

  async function saveCandles() {
    store.error = null
    try {
      const params = new URLSearchParams({ interval: store.interval, start: store.start, end: store.end })
      const res = await fetch(`${BASE}/api/v1/market/${store.symbol}/klines?${params}`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      store.savedCount = data.candles_saved
    } catch (e) {
      store.error = e.message
    }
  }

  return { fetchCandles, saveCandles }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/composables/__tests__/useMarket.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/composables/useMarket.js src/composables/__tests__/useMarket.test.js
git commit -m "feat: useMarket composable with tests"
```

---

## Task 6: useBacktest Composable

**Files:**
- Create: `src/composables/useBacktest.js`
- Create: `src/composables/__tests__/useBacktest.test.js`

- [ ] **Step 1: Write the failing test**

`src/composables/__tests__/useBacktest.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBacktest } from '../useBacktest'
import { useBacktestStore } from '../../stores/backtest'

const PAYLOAD = {
  symbol: 'BTCUSDT', interval: '5m',
  start: '2026-05-17', end: '2026-06-16',
  strategies: ['rsi_oversold'],
}

describe('useBacktest', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('submit: sets jobId and starts polling', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ job_id: 'uuid-1', status: 'pending' }) })
      .mockResolvedValue({ ok: true, json: async () => ({ job_id: 'uuid-1', status: 'running' }) })

    const { submit } = useBacktest()
    await submit(PAYLOAD)

    const store = useBacktestStore()
    expect(store.jobId).toBe('uuid-1')
    expect(store.status).toBe('pending')
    expect(store.pollTimer).not.toBeNull()
  })

  it('polling stops on completed and stores results', async () => {
    const results = [{ strategy: 'rsi_oversold', total_return_pct: 5.25, win_rate_pct: 62.5, max_drawdown_pct: -8.3, sharpe_ratio: 1.23, num_trades: 16 }]
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ job_id: 'uuid-2', status: 'pending' }) })
      .mockResolvedValue({ ok: true, json: async () => ({ job_id: 'uuid-2', status: 'completed', results }) })

    const { submit } = useBacktest()
    await submit(PAYLOAD)
    await vi.runOnlyPendingTimersAsync()

    const store = useBacktestStore()
    expect(store.status).toBe('completed')
    expect(store.results).toEqual(results)
  })

  it('polling stops on failed and stores error', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ job_id: 'uuid-3', status: 'pending' }) })
      .mockResolvedValue({ ok: true, json: async () => ({ job_id: 'uuid-3', status: 'failed', error: 'Bad data' }) })

    const { submit } = useBacktest()
    await submit(PAYLOAD)
    await vi.runOnlyPendingTimersAsync()

    const store = useBacktestStore()
    expect(store.status).toBe('failed')
    expect(store.error).toBe('Bad data')
  })

  it('stopPolling: clears interval and nulls pollTimer', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ job_id: 'uuid-4', status: 'pending' }) })
      .mockResolvedValue({ ok: true, json: async () => ({ job_id: 'uuid-4', status: 'running' }) })

    const { submit, stopPolling } = useBacktest()
    await submit(PAYLOAD)
    expect(useBacktestStore().pollTimer).not.toBeNull()
    stopPolling()
    expect(useBacktestStore().pollTimer).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/composables/__tests__/useBacktest.test.js
```

Expected: FAIL — `Cannot find module '../useBacktest'`

- [ ] **Step 3: Write src/composables/useBacktest.js**

```js
import { useBacktestStore } from '../stores/backtest'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export function useBacktest() {
  const store = useBacktestStore()

  async function submit({ symbol, interval, start, end, strategies }) {
    store.error = null
    store.results = []
    store.status = 'pending'
    try {
      const res = await fetch(`${BASE}/api/v1/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, interval, start, end, strategies }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      store.jobId = data.job_id
      store.status = data.status
      startPolling()
    } catch (e) {
      store.error = e.message
      store.status = 'failed'
    }
  }

  function startPolling() {
    store.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/backtest/${store.jobId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        store.status = data.status
        if (data.status === 'completed') {
          store.results = data.results
          clearInterval(store.pollTimer)
          store.pollTimer = null
        }
        if (data.status === 'failed') {
          store.error = data.error
          clearInterval(store.pollTimer)
          store.pollTimer = null
        }
      } catch (e) {
        store.error = e.message
        clearInterval(store.pollTimer)
        store.pollTimer = null
      }
    }, 2000)
  }

  function stopPolling() {
    if (store.pollTimer) {
      clearInterval(store.pollTimer)
      store.pollTimer = null
    }
  }

  return { submit, stopPolling }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/composables/__tests__/useBacktest.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/composables/useBacktest.js src/composables/__tests__/useBacktest.test.js
git commit -m "feat: useBacktest composable with polling and tests"
```

---

## Task 7: AppSidebar Component

**Files:**
- Modify: `src/components/AppSidebar.vue` (replace stub)
- Create: `src/components/__tests__/AppSidebar.test.js`

- [ ] **Step 1: Write the failing test**

`src/components/__tests__/AppSidebar.test.js`:

```js
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import AppSidebar from '../AppSidebar.vue'

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/market', component: { template: '<div/>' } },
      { path: '/backtest', component: { template: '<div/>' } },
      { path: '/health', component: { template: '<div/>' } },
    ],
  })
}

describe('AppSidebar', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('shows green dot when health ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    const dot = wrapper.find('[data-testid="health-dot"]')
    expect(dot.classes()).toContain('text-success')
    expect(dot.text()).toContain('API OK')
  })

  it('shows red dot when health down', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    const dot = wrapper.find('[data-testid="health-dot"]')
    expect(dot.classes()).toContain('text-danger')
    expect(dot.text()).toContain('API down')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/components/__tests__/AppSidebar.test.js
```

Expected: FAIL — `health-dot` not found (stub has no content)

- [ ] **Step 3: Write src/components/AppSidebar.vue**

```vue
<template>
  <aside class="w-28 bg-sidebar flex flex-col items-center py-6 gap-4 border-r border-border shrink-0">
    <nav class="flex flex-col gap-2 w-full px-2">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="block text-center text-xs py-2 rounded hover:bg-card transition-colors"
        active-class="text-accent bg-card"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <div
      class="mt-auto text-xs"
      data-testid="health-dot"
      :class="healthy ? 'text-success' : 'text-danger'"
    >
      ● {{ healthy ? 'API OK' : 'API down' }}
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const links = [
  { to: '/market', label: 'Market' },
  { to: '/backtest', label: 'Backtest' },
  { to: '/health', label: 'Health' },
]

const healthy = ref(false)
let timer = null

async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/api/v1/health`)
    healthy.value = res.ok
  } catch {
    healthy.value = false
  }
}

onMounted(() => {
  checkHealth()
  timer = setInterval(checkHealth, 30000)
})

onUnmounted(() => clearInterval(timer))
</script>
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/components/__tests__/AppSidebar.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/AppSidebar.vue src/components/__tests__/AppSidebar.test.js
git commit -m "feat: AppSidebar with health polling and tests"
```

---

## Task 8: CandleChart Component

**Files:**
- Create: `src/components/market/CandleChart.vue`
- Create: `src/components/__tests__/CandleChart.test.js`

- [ ] **Step 1: Write the failing test**

`src/components/__tests__/CandleChart.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CandleChart from '../market/CandleChart.vue'

const { mockSetData, mockChart } = vi.hoisted(() => {
  const mockSetData = vi.fn()
  const mockSeries = { setData: mockSetData, applyOptions: vi.fn() }
  const mockChart = {
    addCandlestickSeries: vi.fn(() => mockSeries),
    applyOptions: vi.fn(),
    resize: vi.fn(),
    remove: vi.fn(),
  }
  return { mockSetData, mockChart }
})

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => mockChart),
}))

describe('CandleChart', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders the chart container div', () => {
    const wrapper = mount(CandleChart, { props: { candles: [] } })
    expect(wrapper.find('[data-testid="chart-container"]').exists()).toBe(true)
  })

  it('calls setData with empty array when no candles', () => {
    mount(CandleChart, { props: { candles: [] } })
    expect(mockSetData).toHaveBeenCalledWith([])
  })

  it('maps candles to numeric values and calls setData', () => {
    const candles = [{
      open_time: '2026-05-17T00:00:00Z',
      open: '65000.5', high: '65500.0', low: '64800.0', close: '65200.0', volume: '123',
    }]
    mount(CandleChart, { props: { candles } })
    expect(mockSetData).toHaveBeenCalledWith([{
      time: Math.floor(Date.parse('2026-05-17T00:00:00Z') / 1000),
      open: 65000.5,
      high: 65500.0,
      low: 64800.0,
      close: 65200.0,
    }])
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/components/__tests__/CandleChart.test.js
```

Expected: FAIL — `Cannot find module '../market/CandleChart.vue'`

- [ ] **Step 3: Create directory and write src/components/market/CandleChart.vue**

```bash
mkdir -p src/components/market
```

```vue
<template>
  <div ref="chartEl" data-testid="chart-container" class="w-full h-96" />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { createChart } from 'lightweight-charts'

const props = defineProps({
  candles: { type: Array, required: true },
})

const chartEl = ref(null)
let chart = null
let series = null
let ro = null

function mapCandles(candles) {
  return candles.map(c => ({
    time: Math.floor(Date.parse(c.open_time) / 1000),
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
  }))
}

onMounted(() => {
  chart = createChart(chartEl.value, {
    layout: { background: { color: '#1a1a30' }, textColor: '#e2e8f0' },
  })
  series = chart.addCandlestickSeries({
    upColor: '#26a69a', downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a', wickDownColor: '#ef5350',
  })
  series.setData(mapCandles(props.candles))

  ro = new ResizeObserver(() => {
    if (chartEl.value) chart.resize(chartEl.value.clientWidth, chartEl.value.clientHeight)
  })
  ro.observe(chartEl.value)
})

onUnmounted(() => {
  ro?.disconnect()
  chart?.remove()
})

watch(() => props.candles, (candles) => {
  series?.setData(mapCandles(candles))
})
</script>
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/components/__tests__/CandleChart.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/market/CandleChart.vue src/components/__tests__/CandleChart.test.js
git commit -m "feat: CandleChart component with lightweight-charts and tests"
```

---

## Task 9: ResultsTable Component

**Files:**
- Create: `src/components/backtest/ResultsTable.vue`
- Create: `src/components/__tests__/ResultsTable.test.js`

- [ ] **Step 1: Write the failing test**

`src/components/__tests__/ResultsTable.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultsTable from '../backtest/ResultsTable.vue'

const RESULTS = [
  { strategy: 'ma_crossover_20_50', total_return_pct: 2.1, win_rate_pct: 55.0, max_drawdown_pct: -5.2, sharpe_ratio: 0.9, num_trades: 10 },
  { strategy: 'rsi_oversold', total_return_pct: 5.25, win_rate_pct: 62.5, max_drawdown_pct: -8.3, sharpe_ratio: 1.23, num_trades: 16 },
]

describe('ResultsTable', () => {
  it('renders all result rows', () => {
    const wrapper = mount(ResultsTable, { props: { results: RESULTS } })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('sorts by total_return_pct descending — rsi_oversold first', () => {
    const wrapper = mount(ResultsTable, { props: { results: RESULTS } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('rsi_oversold')
    expect(rows[1].text()).toContain('ma_crossover_20_50')
  })

  it('colors positive return cell green', () => {
    const wrapper = mount(ResultsTable, { props: { results: RESULTS } })
    const returnCell = wrapper.findAll('tbody tr')[0].findAll('td')[1]
    expect(returnCell.classes()).toContain('text-success')
  })

  it('colors negative drawdown cell red', () => {
    const wrapper = mount(ResultsTable, { props: { results: RESULTS } })
    const drawdownCell = wrapper.findAll('tbody tr')[0].findAll('td')[3]
    expect(drawdownCell.classes()).toContain('text-danger')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/components/__tests__/ResultsTable.test.js
```

Expected: FAIL — `Cannot find module '../backtest/ResultsTable.vue'`

- [ ] **Step 3: Create directory and write src/components/backtest/ResultsTable.vue**

```bash
mkdir -p src/components/backtest
```

```vue
<template>
  <div data-testid="results-table" class="overflow-x-auto">
    <table class="w-full text-sm text-left">
      <thead>
        <tr class="border-b border-border text-accent">
          <th class="py-2 pr-4">Strategy</th>
          <th class="py-2 pr-4">Return</th>
          <th class="py-2 pr-4">Win Rate</th>
          <th class="py-2 pr-4">Drawdown</th>
          <th class="py-2 pr-4">Sharpe</th>
          <th class="py-2">Trades</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in sorted" :key="r.strategy" class="border-b border-border">
          <td class="py-2 pr-4">{{ r.strategy }}</td>
          <td class="py-2 pr-4" :class="r.total_return_pct >= 0 ? 'text-success' : 'text-danger'">
            {{ r.total_return_pct.toFixed(2) }}%
          </td>
          <td class="py-2 pr-4">{{ r.win_rate_pct.toFixed(1) }}%</td>
          <td class="py-2 pr-4" :class="r.max_drawdown_pct < 0 ? 'text-danger' : 'text-success'">
            {{ r.max_drawdown_pct.toFixed(2) }}%
          </td>
          <td class="py-2 pr-4">{{ r.sharpe_ratio.toFixed(2) }}</td>
          <td class="py-2">{{ r.num_trades }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  results: { type: Array, required: true },
})

const sorted = computed(() =>
  [...props.results].sort((a, b) => b.total_return_pct - a.total_return_pct)
)
</script>
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/components/__tests__/ResultsTable.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/backtest/ResultsTable.vue src/components/__tests__/ResultsTable.test.js
git commit -m "feat: ResultsTable component with sorting and color coding and tests"
```

---

## Task 10: MarketPage

**Files:**
- Modify: `src/pages/MarketPage.vue` (replace stub)
- Create: `src/pages/__tests__/MarketPage.test.js`

- [ ] **Step 1: Write the failing test**

`src/pages/__tests__/MarketPage.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MarketPage from '../MarketPage.vue'
import { useMarketStore } from '../../stores/market'

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addCandlestickSeries: vi.fn(() => ({ setData: vi.fn(), applyOptions: vi.fn() })),
    applyOptions: vi.fn(),
    resize: vi.fn(),
    remove: vi.fn(),
  })),
}))

const { mockFetchCandles, mockSaveCandles } = vi.hoisted(() => ({
  mockFetchCandles: vi.fn(),
  mockSaveCandles: vi.fn(),
}))
vi.mock('../../composables/useMarket', () => ({
  useMarket: () => ({ fetchCandles: mockFetchCandles, saveCandles: mockSaveCandles }),
}))

describe('MarketPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('Fetch button calls fetchCandles', async () => {
    const wrapper = mount(MarketPage)
    await wrapper.find('[data-testid="fetch-btn"]').trigger('click')
    expect(mockFetchCandles).toHaveBeenCalledOnce()
  })

  it('Save button calls saveCandles', async () => {
    const wrapper = mount(MarketPage)
    await wrapper.find('[data-testid="save-btn"]').trigger('click')
    expect(mockSaveCandles).toHaveBeenCalledOnce()
  })

  it('shows stats bar after candles load', async () => {
    const wrapper = mount(MarketPage)
    useMarketStore().candles = [
      { open_time: '2026-05-17T00:00:00Z', open: '64000', high: '65500', low: '63000', close: '65200', volume: '123' },
    ]
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="stats-bar"]').exists()).toBe(true)
  })

  it('shows error message when store.error is set', async () => {
    const wrapper = mount(MarketPage)
    useMarketStore().error = 'Network error'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="error-msg"]').text()).toContain('Network error')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/pages/__tests__/MarketPage.test.js
```

Expected: FAIL — buttons not found in stub

- [ ] **Step 3: Write src/pages/MarketPage.vue**

```vue
<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-accent">Market Data</h1>

    <div class="bg-card rounded p-4 border border-border flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-400 mb-1">Symbol</label>
        <input
          v-model="store.symbol"
          @input="store.symbol = store.symbol.toUpperCase()"
          class="bg-bg border border-border rounded px-3 py-1.5 text-sm w-32"
        />
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">Interval</label>
        <select v-model="store.interval" class="bg-bg border border-border rounded px-3 py-1.5 text-sm">
          <option v-for="iv in intervals" :key="iv" :value="iv">{{ iv }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">Start</label>
        <input type="date" v-model="store.start" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">End</label>
        <input type="date" v-model="store.end" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
      </div>
      <button
        data-testid="fetch-btn"
        @click="fetchCandles"
        class="px-4 py-1.5 bg-accent text-bg rounded text-sm font-medium"
      >Fetch</button>
      <button
        data-testid="save-btn"
        @click="saveCandles"
        class="px-4 py-1.5 border border-accent text-accent rounded text-sm font-medium"
      >Save</button>
    </div>

    <p v-if="store.error" data-testid="error-msg" class="text-danger text-sm">{{ store.error }}</p>
    <p v-if="store.savedCount !== null" class="text-success text-sm">Saved {{ store.savedCount }} candles</p>

    <div
      v-if="store.candles.length"
      data-testid="stats-bar"
      class="bg-card rounded p-4 border border-border flex gap-8 text-sm"
    >
      <span>Candles: {{ store.candles.length }}</span>
      <span>Last close: {{ store.candles.at(-1).close }}</span>
      <span :class="pctChange >= 0 ? 'text-success' : 'text-danger'">
        Change: {{ pctChange.toFixed(2) }}%
      </span>
    </div>

    <CandleChart v-if="store.candles.length" :candles="store.candles" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMarketStore } from '../stores/market'
import { useMarket } from '../composables/useMarket'
import CandleChart from '../components/market/CandleChart.vue'

const store = useMarketStore()
const { fetchCandles, saveCandles } = useMarket()

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']

const pctChange = computed(() => {
  if (!store.candles.length) return 0
  const first = parseFloat(store.candles[0].open)
  const last = parseFloat(store.candles.at(-1).close)
  return ((last - first) / first) * 100
})
</script>
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/pages/__tests__/MarketPage.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/MarketPage.vue src/pages/__tests__/MarketPage.test.js
git commit -m "feat: MarketPage with chart and stats bar and tests"
```

---

## Task 11: BacktestPage

**Files:**
- Modify: `src/pages/BacktestPage.vue` (replace stub)
- Create: `src/pages/__tests__/BacktestPage.test.js`

- [ ] **Step 1: Write the failing test**

`src/pages/__tests__/BacktestPage.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import BacktestPage from '../BacktestPage.vue'
import { useBacktestStore } from '../../stores/backtest'

const { mockSubmit, mockStopPolling } = vi.hoisted(() => ({
  mockSubmit: vi.fn(),
  mockStopPolling: vi.fn(),
}))
vi.mock('../../composables/useBacktest', () => ({
  useBacktest: () => ({ submit: mockSubmit, stopPolling: mockStopPolling }),
}))

describe('BacktestPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('Submit button calls submit()', async () => {
    const wrapper = mount(BacktestPage)
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    expect(mockSubmit).toHaveBeenCalledOnce()
  })

  it('status badge reflects store.status', async () => {
    const wrapper = mount(BacktestPage)
    useBacktestStore().status = 'pending'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('pending')
  })

  it('ResultsTable appears when status is completed', async () => {
    const wrapper = mount(BacktestPage)
    const store = useBacktestStore()
    store.status = 'completed'
    store.results = [{ strategy: 'rsi_oversold', total_return_pct: 5.25, win_rate_pct: 62.5, max_drawdown_pct: -8.3, sharpe_ratio: 1.23, num_trades: 16 }]
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="results-table"]').exists()).toBe(true)
  })

  it('shows error text when status is failed', async () => {
    const wrapper = mount(BacktestPage)
    const store = useBacktestStore()
    store.status = 'failed'
    store.error = 'Strategy error'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="backtest-error"]').text()).toContain('Strategy error')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/pages/__tests__/BacktestPage.test.js
```

Expected: FAIL — buttons not found in stub

- [ ] **Step 3: Write src/pages/BacktestPage.vue**

```vue
<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-accent">Backtest</h1>

    <div class="grid grid-cols-2 gap-6">
      <div class="bg-card rounded p-4 border border-border space-y-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Symbol</label>
          <input
            v-model="symbol"
            @input="symbol = symbol.toUpperCase()"
            class="bg-bg border border-border rounded px-3 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Interval</label>
          <select v-model="interval" class="bg-bg border border-border rounded px-3 py-1.5 text-sm">
            <option v-for="iv in intervals" :key="iv" :value="iv">{{ iv }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Start</label>
          <input type="date" v-model="start" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">End</label>
          <input type="date" v-model="end" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-2">Strategies</label>
          <label class="flex items-center gap-2 text-sm mb-1 cursor-pointer">
            <input type="checkbox" value="rsi_oversold" v-model="selectedStrategies" />
            rsi_oversold
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" value="ma_crossover_20_50" v-model="selectedStrategies" />
            ma_crossover_20_50
          </label>
        </div>
        <button
          data-testid="submit-btn"
          @click="handleSubmit"
          class="px-4 py-1.5 bg-accent text-bg rounded text-sm font-medium w-full"
        >Run Backtest</button>
      </div>

      <div class="bg-card rounded p-4 border border-border space-y-4">
        <div v-if="store.status">
          <span
            data-testid="status-badge"
            class="px-2 py-1 rounded text-sm font-medium"
            :class="badgeClass"
          >{{ store.status }}</span>
        </div>
        <p
          v-if="store.status === 'failed'"
          data-testid="backtest-error"
          class="text-danger text-sm"
        >{{ store.error }}</p>
        <ResultsTable v-if="store.status === 'completed'" :results="store.results" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useBacktestStore } from '../stores/backtest'
import { useBacktest } from '../composables/useBacktest'
import ResultsTable from '../components/backtest/ResultsTable.vue'

const store = useBacktestStore()
const { submit, stopPolling } = useBacktest()

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']
const symbol = ref('BTCUSDT')
const interval = ref('5m')
const start = ref(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
const end = ref(new Date().toISOString().split('T')[0])
const selectedStrategies = ref([])

const badgeClass = computed(() => ({
  'bg-yellow-500 text-bg': store.status === 'pending',
  'bg-blue-500 text-bg': store.status === 'running',
  'bg-success text-bg': store.status === 'completed',
  'bg-danger text-bg': store.status === 'failed',
}))

function handleSubmit() {
  submit({
    symbol: symbol.value,
    interval: interval.value,
    start: start.value,
    end: end.value,
    strategies: selectedStrategies.value,
  })
}

onUnmounted(() => stopPolling())
</script>
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/pages/__tests__/BacktestPage.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/BacktestPage.vue src/pages/__tests__/BacktestPage.test.js
git commit -m "feat: BacktestPage with polling status and results and tests"
```

---

## Task 12: HealthPage

**Files:**
- Modify: `src/pages/HealthPage.vue` (replace stub)
- Create: `src/pages/__tests__/HealthPage.test.js`

- [ ] **Step 1: Write the failing test**

`src/pages/__tests__/HealthPage.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HealthPage from '../HealthPage.vue'

describe('HealthPage', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches on mount and shows healthy badge', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    const wrapper = mount(HealthPage)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('healthy')
  })

  it('shows unreachable badge on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const wrapper = mount(HealthPage)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('unreachable')
  })

  it('Refresh button re-fetches', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    const wrapper = mount(HealthPage)
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="refresh-btn"]').trigger('click')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/pages/__tests__/HealthPage.test.js
```

Expected: FAIL — `status-badge` not found in stub

- [ ] **Step 3: Write src/pages/HealthPage.vue**

```vue
<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-accent">API Health</h1>

    <div class="bg-card rounded p-6 border border-border space-y-4">
      <span
        data-testid="status-badge"
        class="inline-block px-4 py-2 rounded text-base font-semibold"
        :class="status === 'healthy' ? 'bg-success text-bg' : 'bg-danger text-bg'"
      >{{ status }}</span>

      <pre
        v-if="raw"
        class="bg-bg rounded p-4 border border-border text-sm text-gray-300 overflow-auto"
      >{{ raw }}</pre>

      <div>
        <button
          data-testid="refresh-btn"
          @click="check"
          class="px-4 py-1.5 border border-accent text-accent rounded text-sm font-medium"
        >Refresh</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const status = ref('unreachable')
const raw = ref(null)

async function check() {
  try {
    const res = await fetch(`${BASE}/api/v1/health`)
    const data = await res.json()
    raw.value = JSON.stringify(data, null, 2)
    status.value = res.ok ? 'healthy' : 'unreachable'
  } catch {
    status.value = 'unreachable'
    raw.value = null
  }
}

onMounted(check)
</script>
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/pages/__tests__/HealthPage.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All 34 tests pass across 10 test files.

- [ ] **Step 6: Verify the app in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Check:
- Dark sidebar with three nav links
- `/market` — form fields, Fetch/Save buttons, chart and stats appear after fetching
- `/backtest` — two-column layout, strategy checkboxes, status badge appears after submit
- `/health` — status badge (unreachable if backend down), Refresh button works

- [ ] **Step 7: Commit**

```bash
git add src/pages/HealthPage.vue src/pages/__tests__/HealthPage.test.js
git commit -m "feat: HealthPage with status badge and tests — all 34 tests passing"
```

---

## Backend CORS Note

If the FastAPI backend does not yet allow `http://localhost:5173`, add this to the backend's `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
