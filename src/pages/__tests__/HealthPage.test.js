import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HealthPage from '../HealthPage.vue'

describe('HealthPage', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches on mount and shows healthy badge', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    const wrapper = mount(HealthPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('healthy')
  })

  it('shows unreachable badge on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const wrapper = mount(HealthPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('unreachable')
  })

  it('Refresh button re-fetches', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    const wrapper = mount(HealthPage)
    await flushPromises()
    await wrapper.find('[data-testid="refresh-btn"]').trigger('click')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
