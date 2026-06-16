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
