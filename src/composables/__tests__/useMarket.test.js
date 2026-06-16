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
