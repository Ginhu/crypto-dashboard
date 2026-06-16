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
