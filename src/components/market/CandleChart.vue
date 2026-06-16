<template>
  <div ref="chartEl" data-testid="chart-container" class="w-full h-96" />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { createChart } from 'lightweight-charts'

const props = defineProps({
  candles: { type: Array, required: true },
})

const chartEl = ref(null)
let chart = null
let series = null
let ro = null

function mapCandles(candles) {
  return candles.map(c => ({
    time: Math.floor(Date.parse(c.open_time) / 1000),
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
  }))
}

onMounted(() => {
  chart = createChart(chartEl.value, {
    layout: { background: { color: '#1a1a30' }, textColor: '#e2e8f0' },
  })
  series = chart.addCandlestickSeries({
    upColor: '#26a69a', downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a', wickDownColor: '#ef5350',
  })
  series.setData(mapCandles(props.candles))

  ro = new ResizeObserver(() => {
    if (chartEl.value) chart.resize(chartEl.value.clientWidth, chartEl.value.clientHeight)
  })
  ro.observe(chartEl.value)
})

onUnmounted(() => {
  ro?.disconnect()
  chart?.remove()
})

watch(() => props.candles, (candles) => {
  series?.setData(mapCandles(candles))
})
</script>
