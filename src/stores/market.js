import { defineStore } from 'pinia'

const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]

export const useMarketStore = defineStore('market', {
  state: () => ({
    symbol: 'BTCUSDT',
    interval: '5m',
    start: daysAgo(30),
    end: today(),
    candles: [],
    loading: false,
    error: null,
    savedCount: null,
  }),
})
