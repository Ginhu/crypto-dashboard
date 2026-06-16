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
