<template>
  <div data-testid="results-table" class="overflow-x-auto">
    <table class="w-full text-sm text-left">
      <thead>
        <tr class="border-b border-border text-accent">
          <th class="py-2 pr-4">Strategy</th>
          <th class="py-2 pr-4">Return</th>
          <th class="py-2 pr-4">Win Rate</th>
          <th class="py-2 pr-4">Drawdown</th>
          <th class="py-2 pr-4">Sharpe</th>
          <th class="py-2">Trades</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in sorted" :key="r.strategy" class="border-b border-border">
          <td class="py-2 pr-4">{{ r.strategy }}</td>
          <td class="py-2 pr-4" :class="r.total_return_pct >= 0 ? 'text-success' : 'text-danger'">
            {{ r.total_return_pct.toFixed(2) }}%
          </td>
          <td class="py-2 pr-4">{{ r.win_rate_pct.toFixed(1) }}%</td>
          <td class="py-2 pr-4" :class="r.max_drawdown_pct < 0 ? 'text-danger' : 'text-success'">
            {{ r.max_drawdown_pct.toFixed(2) }}%
          </td>
          <td class="py-2 pr-4">{{ r.sharpe_ratio.toFixed(2) }}</td>
          <td class="py-2">{{ r.num_trades }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  results: { type: Array, required: true },
})

const sorted = computed(() =>
  [...props.results].sort((a, b) => b.total_return_pct - a.total_return_pct)
)
</script>
