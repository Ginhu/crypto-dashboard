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
