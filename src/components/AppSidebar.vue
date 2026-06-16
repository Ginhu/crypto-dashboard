<template>
  <aside class="w-28 bg-sidebar flex flex-col items-center py-6 gap-4 border-r border-border shrink-0">
    <nav class="flex flex-col gap-2 w-full px-2">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="block text-center text-xs py-2 rounded hover:bg-card transition-colors"
        active-class="text-accent bg-card"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <div
      class="mt-auto text-xs"
      data-testid="health-dot"
      :class="healthy ? 'text-success' : 'text-danger'"
    >
      ● {{ healthy ? 'API OK' : 'API down' }}
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const links = [
  { to: '/market', label: 'Market' },
  { to: '/backtest', label: 'Backtest' },
  { to: '/health', label: 'Health' },
]

const healthy = ref(false)
let timer = null

async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/api/v1/health`)
    healthy.value = res.ok
  } catch {
    healthy.value = false
  }
}

onMounted(() => {
  checkHealth()
  timer = setInterval(checkHealth, 30000)
})

onUnmounted(() => clearInterval(timer))
</script>
