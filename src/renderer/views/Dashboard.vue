<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      ReleaseFlow Dashboard
    </h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Repositorios
        </h2>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {{ repositoriesCount }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Templates
        </h2>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ templatesCount }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Releases
        </h2>
        <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {{ releasesCount }}
        </p>
      </div>
    </div>

    <!-- Integrations Status Card -->
    <div v-if="settingsStore.isCodebaseConfigured || settingsStore.isTeamsConfigured" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Estado de Integraciones
        </h2>
        <div class="flex items-center space-x-4">
          <div v-if="settingsStore.isCodebaseConfigured" class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm text-green-600 dark:text-green-400">CodebaseHQ</span>
          </div>
          <div v-if="settingsStore.isTeamsConfigured" class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span class="text-sm text-blue-600 dark:text-blue-400">Teams</span>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Actividades Recientes
        </h3>
        
        <!-- Loading state -->
        <div v-if="activitiesLoading" class="space-y-2">
          <div v-for="n in 5" :key="n" class="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
        </div>

        <!-- Activities list -->
        <div v-else-if="recentActivities.length > 0" class="space-y-3">
          <div v-for="activity in recentActivities" :key="activity.id" 
               class="flex items-start space-x-3 py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <!-- Avatar -->
            <img 
              :src="activity.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.actorName)}&background=8b5cf6&color=fff`"
              :alt="activity.actorName"
              class="w-8 h-8 rounded-full flex-shrink-0"
            />
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">
                <span class="font-medium">{{ activity.actorName }}</span>
                <span class="ml-1 text-gray-700 dark:text-gray-300">{{ activity.title?.replace(new RegExp(`^${activity.actorName}\\s+`), '') }}</span>
              </p>
              <div class="flex items-center justify-between mt-1">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(activity.timestamp) }}
                </p>
                <span v-if="activity.repository" class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {{ activity.repository }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- No activities -->
        <p v-else class="text-gray-500 dark:text-gray-400 text-sm">
          No hay actividades recientes
        </p>
      </div>

      <div class="flex justify-end">
        <router-link to="/activity" 
                     class="bg-blue-600 hover:bg-blue-700 text-white dark:text-white px-4 py-2 rounded-lg transition-colors text-sm">
          Ver todas las actividades
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppStore, useRepositoriesStore, useTemplatesStore, useReleasesStore, useSettingsStore } from '../store'

export default {
  name: 'Dashboard',
  setup() {
    const appStore = useAppStore()
    const repositoriesStore = useRepositoriesStore()
    const templatesStore = useTemplatesStore()
    const releasesStore = useReleasesStore()
    const settingsStore = useSettingsStore()

    const recentActivities = ref([])
    const activitiesLoading = ref(false)
    let refreshInterval = null

    // Parse XML activity response (copied from Activity.vue)
    const parseActivities = (xmlText) => {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      const events = xmlDoc.querySelectorAll('event')
      const parsedActivities = []
      
      events.forEach(event => {
        const activity = {
          id: event.querySelector('id')?.textContent,
          title: event.querySelector('title')?.textContent,
          htmlTitle: event.querySelector('html-title')?.textContent,
          htmlText: event.querySelector('html-text')?.textContent,
          timestamp: event.querySelector('timestamp')?.textContent,
          type: event.querySelector('type')?.textContent,
          actorName: event.querySelector('actor-name')?.textContent,
          actorEmail: event.querySelector('actor-email')?.textContent,
          avatarUrl: event.querySelector('avatar-url')?.textContent,
          deleted: event.querySelector('deleted')?.textContent === 'true',
          commits: [],
          repository: '',
          branch: ''
        }
        
        // Parse repository and branch from title
        const titleMatch = activity.title?.match(/on (.+)$/)
        if (titleMatch) {
          activity.repository = titleMatch[1]
        }
        
        const branchMatch = activity.title?.match(/to (\S+) on/)
        if (branchMatch) {
          activity.branch = branchMatch[1]
        }
        
        // Parse commits from HTML text
        if (activity.htmlText) {
          const commitMatches = activity.htmlText.matchAll(/>([a-f0-9]{10})<\/a>\s+(.+?)<\/p>/g)
          for (const match of commitMatches) {
            activity.commits.push({
              hash: match[1],
              message: match[2].replace(/&amp;#39;/g, "'").replace(/&amp;/g, '&')
            })
          }
        }
        
        parsedActivities.push(activity)
      })
      
      return parsedActivities
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Fecha desconocida'
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (minutes < 1) return 'Hace un momento'
      if (minutes < 60) return `Hace ${minutes} minuto${minutes === 1 ? '' : 's'}`
      if (hours < 24) return `Hace ${hours} hora${hours === 1 ? '' : 's'}`
      if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`
      
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const loadRecentActivities = async () => {
      console.log('[Dashboard] Loading recent activities...')
      console.log('[Dashboard] CodebaseHQ configured:', settingsStore.isCodebaseConfigured)
      console.log('[Dashboard] Codebase config:', settingsStore.codebaseConfig)
      
      if (!settingsStore.isCodebaseConfigured) {
        console.log('[Dashboard] CodebaseHQ not configured, skipping activities load')
        return
      }

      activitiesLoading.value = true
      try {
        console.log('[Dashboard] Calling codebaseGetActivity...')
        
        // Get CodebaseHQ activities
        const response = await window.electronAPI.codebaseGetActivity({
          accountName: settingsStore.codebaseConfig.accountName,
          username: settingsStore.codebaseConfig.username,
          apiKey: settingsStore.codebaseConfig.apiKey,
          projectPermalink: settingsStore.codebaseConfig.projectPermalink
        }, 1)
        
        console.log('[Dashboard] CodebaseHQ response:', response)
        
        if (response.success && response.data) {
          // Parse the XML response using the same logic as Activity.vue
          const parsedActivities = parseActivities(response.data)
          // Take only the first 5 activities
          recentActivities.value = parsedActivities.slice(0, 5)
          console.log('[Dashboard] Activities loaded:', recentActivities.value.length)
        } else {
          console.log('[Dashboard] No activities in response or response failed')
        }
      } catch (error) {
        console.error('[Dashboard] Error loading recent activities:', error)
      } finally {
        activitiesLoading.value = false
      }
    }

    onMounted(async () => {
      // Inicializar la aplicación si no se ha hecho
      if (!appStore.lastActivity) {
        await appStore.initializeApp()
      }

      // Load settings to check CodebaseHQ configuration
      await settingsStore.loadSettings()
      
      // Load recent activities if CodebaseHQ is configured
      if (settingsStore.isCodebaseConfigured) {
        await loadRecentActivities()
        
        // Set up auto-refresh every 30 seconds
        refreshInterval = setInterval(() => {
          loadRecentActivities()
        }, 30000)
      }
    })

    onUnmounted(() => {
      // Clear the refresh interval when component is unmounted
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    })

    return {
      // Stores
      settingsStore,
      
      // Contadores reactivos
      repositoriesCount: computed(() => repositoriesStore.repositoriesCount),
      templatesCount: computed(() => templatesStore.templatesCount),
      releasesCount: computed(() => releasesStore.releasesCount),
      
      // Estados de carga
      loading: computed(() => appStore.loading),
      error: computed(() => appStore.error),

      // Activities
      recentActivities,
      activitiesLoading,
      formatDate,
    }
  },
}
</script>