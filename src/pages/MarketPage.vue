<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-accent">Market Data</h1>

    <div class="bg-card rounded p-4 border border-border flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-400 mb-1">Symbol</label>
        <input
          v-model="store.symbol"
          @input="store.symbol = store.symbol.toUpperCase()"
          class="bg-bg border border-border rounded px-3 py-1.5 text-sm w-32"
        />
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">Interval</label>
        <select v-model="store.interval" class="bg-bg border border-border rounded px-3 py-1.5 text-sm">
          <option v-for="iv in intervals" :key="iv" :value="iv">{{ iv }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">Start</label>
        <input type="date" v-model="store.start" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">End</label>
        <input type="date" v-model="store.end" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
      </div>
      <button
        data-testid="fetch-btn"
        @click="fetchCandles"
        class="px-4 py-1.5 bg-accent text-bg rounded text-sm font-medium"
      >Fetch</button>
      <button
        data-testid="save-btn"
        @click="saveCandles"
        class="px-4 py-1.5 border border-accent text-accent rounded text-sm font-medium"
      >Save</button>
    </div>

    <p v-if="store.error" data-testid="error-msg" class="text-danger text-sm">{{ store.error }}</p>
    <p v-if="store.savedCount !== null" class="text-success text-sm">Saved {{ store.savedCount }} candles</p>

    <div
      v-if="store.candles.length"
      data-testid="stats-bar"
      class="bg-card rounded p-4 border border-border flex gap-8 text-sm"
    >
      <span>Candles: {{ store.candles.length }}</span>
      <span>Last close: {{ store.candles.at(-1).close }}</span>
      <span :class="pctChange >= 0 ? 'text-success' : 'text-danger'">
        Change: {{ pctChange.toFixed(2) }}%
      </span>
    </div>

    <CandleChart v-if="store.candles.length" :candles="store.candles" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMarketStore } from '../stores/market'
import { useMarket } from '../composables/useMarket'
import CandleChart from '../components/market/CandleChart.vue'

const store = useMarketStore()
const { fetchCandles, saveCandles } = useMarket()

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']

const pctChange = computed(() => {
  if (!store.candles.length) return 0
  const first = parseFloat(store.candles[0].open)
  const last = parseFloat(store.candles.at(-1).close)
  return ((last - first) / first) * 100
})
</script>
