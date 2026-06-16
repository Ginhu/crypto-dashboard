<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-accent">API Health</h1>

    <div class="bg-card rounded p-6 border border-border space-y-4">
      <span
        data-testid="status-badge"
        class="inline-block px-4 py-2 rounded text-base font-semibold"
        :class="status === 'healthy' ? 'bg-success text-bg' : 'bg-danger text-bg'"
      >{{ status }}</span>

      <pre
        v-if="raw"
        class="bg-bg rounded p-4 border border-border text-sm text-gray-300 overflow-auto"
      >{{ raw }}</pre>

      <div>
        <button
          data-testid="refresh-btn"
          @click="check"
          class="px-4 py-1.5 border border-accent text-accent rounded text-sm font-medium"
        >Refresh</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const status = ref('unreachable')
const raw = ref(null)

async function check() {
  try {
    const res = await fetch(`${BASE}/api/v1/health`)
    const data = await res.json()
    raw.value = JSON.stringify(data, null, 2)
    status.value = res.ok ? 'healthy' : 'unreachable'
  } catch {
    status.value = 'unreachable'
    raw.value = null
  }
}

onMounted(check)
</script>
