<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar Navigation -->
    <aside class="w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <i class="pi pi-code mr-2 text-primary-500"></i>
          ReleaseFlow
        </h1>
      </div>
      
      <nav class="mt-4">
        <ul class="space-y-2 px-4">
          <li>
            <router-link
              :to="{ path: '/' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/' 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-home mr-3"></i>
              Dashboard
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ path: '/repositories' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/repositories'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-folder mr-3"></i>
              Repositorios
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ path: '/templates' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/templates'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-file-edit mr-3"></i>
              Templates
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ path: '/releases' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/releases'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-send mr-3"></i>
              Releases
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ path: '/activity' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/activity'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-chart-line mr-3"></i>
              Actividad
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ path: '/settings' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/settings'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-link mr-3"></i>
              Integraciones
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center space-x-4">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ _pageTitle }}
            </h2>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Theme Toggle -->
            <button
              @click="_toggleTheme"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>
            
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-6">
        <router-view />
      </div>
    </main>
    
    <!-- Toast Notifications -->
    <Toast position="top-right" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'

const route = useRoute()
const isDark = ref(false)

const _pageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard',
    '/repositories': 'Gestión de Repositorios',
    '/templates': 'Editor de Templates',
    '/releases': 'Generación de Releases',
  }
  return titles[route.path] || 'ReleaseFlow'
})

const _toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  // Check for saved theme preference or default to light
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark')
  }
})
</script>