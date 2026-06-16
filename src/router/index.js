import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/market' },
    { path: '/market', component: () => import('../pages/MarketPage.vue') },
    { path: '/backtest', component: () => import('../pages/BacktestPage.vue') },
    { path: '/health', component: () => import('../pages/HealthPage.vue') },
  ],
})
