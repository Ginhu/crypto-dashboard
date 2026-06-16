import { defineStore } from 'pinia'

export const useBacktestStore = defineStore('backtest', {
  state: () => ({
    jobId: null,
    status: null,
    strategies: [],
    results: [],
    error: null,
    pollTimer: null,
  }),
})
