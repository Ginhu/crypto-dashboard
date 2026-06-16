<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-accent">Backtest</h1>

    <div class="grid grid-cols-2 gap-6">
      <div class="bg-card rounded p-4 border border-border space-y-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Symbol</label>
          <input
            v-model="symbol"
            @input="symbol = symbol.toUpperCase()"
            class="bg-bg border border-border rounded px-3 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Interval</label>
          <select v-model="interval" class="bg-bg border border-border rounded px-3 py-1.5 text-sm">
            <option v-for="iv in intervals" :key="iv" :value="iv">{{ iv }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Start</label>
          <input type="date" v-model="start" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">End</label>
          <input type="date" v-model="end" class="bg-bg border border-border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-2">Strategies</label>
          <label class="flex items-center gap-2 text-sm mb-1 cursor-pointer">
            <input type="checkbox" value="rsi_oversold" v-model="selectedStrategies" />
            rsi_oversold
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" value="ma_crossover_20_50" v-model="selectedStrategies" />
            ma_crossover_20_50
          </label>
        </div>
        <button
          data-testid="submit-btn"
          @click="handleSubmit"
          class="px-4 py-1.5 bg-accent text-bg rounded text-sm font-medium w-full"
        >Run Backtest</button>
      </div>

      <div class="bg-card rounded p-4 border border-border space-y-4">
        <div v-if="store.status">
          <span
            data-testid="status-badge"
            class="px-2 py-1 rounded text-sm font-medium"
            :class="badgeClass"
          >{{ store.status }}</span>
        </div>
        <p
          v-if="store.status === 'failed'"
          data-testid="backtest-error"
          class="text-danger text-sm"
        >{{ store.error }}</p>
        <ResultsTable v-if="store.status === 'completed'" :results="store.results" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useBacktestStore } from '../stores/backtest'
import { useBacktest } from '../composables/useBacktest'
import ResultsTable from '../components/backtest/ResultsTable.vue'

const store = useBacktestStore()
const { submit, stopPolling } = useBacktest()

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']
const symbol = ref('BTCUSDT')
const interval = ref('5m')
const start = ref(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
const end = ref(new Date().toISOString().split('T')[0])
const selectedStrategies = ref([])

const badgeClass = computed(() => ({
  'bg-yellow-500 text-bg': store.status === 'pending',
  'bg-blue-500 text-bg': store.status === 'running',
  'bg-success text-bg': store.status === 'completed',
  'bg-danger text-bg': store.status === 'failed',
}))

function handleSubmit() {
  submit({
    symbol: symbol.value,
    interval: interval.value,
    start: start.value,
    end: end.value,
    strategies: selectedStrategies.value,
  })
}

onUnmounted(() => stopPolling())
</script>
