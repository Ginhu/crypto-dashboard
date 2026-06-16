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
