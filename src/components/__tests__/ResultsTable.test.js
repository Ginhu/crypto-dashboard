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
