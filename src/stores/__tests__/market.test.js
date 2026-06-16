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
