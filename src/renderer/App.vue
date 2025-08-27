<template>
  <div>
    <router-view />
    <!-- Toast Global - Debe estar en el nivel más alto de la app -->
    <Toast position="top-right" />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
</script>

<style>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>