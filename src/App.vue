<template>
  <div class="flex min-h-screen bg-bg">
    <AppSidebar />
    <main class="flex-1 p-6 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './components/AppSidebar.vue'
</script>
