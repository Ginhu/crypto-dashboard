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
