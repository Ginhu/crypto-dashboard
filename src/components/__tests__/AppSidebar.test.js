import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import AppSidebar from '../AppSidebar.vue'

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/market', component: { template: '<div/>' } },
      { path: '/backtest', component: { template: '<div/>' } },
      { path: '/health', component: { template: '<div/>' } },
    ],
  })
}

describe('AppSidebar', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('shows green dot when health ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    const dot = wrapper.find('[data-testid="health-dot"]')
    expect(dot.classes()).toContain('text-success')
    expect(dot.text()).toContain('API OK')
  })

  it('shows red dot when health down', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    const dot = wrapper.find('[data-testid="health-dot"]')
    expect(dot.classes()).toContain('text-danger')
    expect(dot.text()).toContain('API down')
  })
})
