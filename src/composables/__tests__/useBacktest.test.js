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
