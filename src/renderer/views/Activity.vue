<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Actividad del Proyecto</h1>
        <p class="text-gray-600 dark:text-gray-300">
          Últimas actividades en CodebaseHQ
        </p>
      </div>
      <button 
        @click="loadActivity"
        :disabled="loading"
        class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white dark:text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
      >
        <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        <span>{{ loading ? 'Cargando...' : 'Actualizar' }}</span>
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
      <button 
        @click="goToSettings"
        class="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
      >
        Ir a Configuración →
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !activities.length" class="flex justify-center items-center py-12">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-purple-500 mb-4"></i>
        <p class="text-gray-600 dark:text-gray-300">Cargando actividad...</p>
      </div>
    </div>

    <!-- Activities List -->
    <div v-else-if="activities.length > 0" class="space-y-4">
      <div 
        v-for="activity in activities" 
        :key="activity.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start space-x-3">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <img 
              :src="activity.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.actorName)}&background=8b5cf6&color=fff`"
              :alt="activity.actorName"
              class="w-10 h-10 rounded-full"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm">
                  <span class="font-medium text-gray-900 dark:text-white">{{ activity.actorName }}</span>
                  <span 
                    class="ml-1"
                    v-html="formatActivityTitle(activity)"
                  ></span>
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatDate(activity.timestamp) }}
                </p>
              </div>
              
              <!-- Type Badge -->
              <span 
                :class="getTypeBadgeClass(activity.type)"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ getTypeLabel(activity.type) }}
              </span>
            </div>

            <!-- Commits/Details -->
            <div v-if="activity.commits && activity.commits.length > 0" class="mt-3 bg-gray-50 dark:bg-gray-700 rounded p-3">
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Commits:</p>
              <ul class="space-y-1">
                <li 
                  v-for="(commit, index) in activity.commits.slice(0, 3)" 
                  :key="index"
                  class="flex items-start"
                >
                  <span class="text-xs font-mono text-purple-600 dark:text-purple-400 mr-2">{{ commit.hash }}</span>
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ commit.message }}</span>
                </li>
                <li v-if="activity.commits.length > 3" class="text-xs text-gray-500 dark:text-gray-400 italic">
                  y {{ activity.commits.length - 3 }} más...
                </li>
              </ul>
            </div>

            <!-- Repository/Branch Info -->
            <div v-if="activity.repository || activity.branch" class="mt-2 flex items-center space-x-4 text-xs">
              <span v-if="activity.repository" class="flex items-center text-gray-600 dark:text-gray-400">
                <i class="pi pi-folder mr-1"></i>
                {{ activity.repository }}
              </span>
              <span v-if="activity.branch" class="flex items-center text-gray-600 dark:text-gray-400">
                <i class="pi pi-share-alt mr-1"></i>
                {{ activity.branch }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Indicator -->
      <div v-if="loadingMore" class="flex justify-center items-center py-6">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-purple-500 mb-2"></i>
          <p class="text-sm text-gray-600 dark:text-gray-300">Cargando más actividades...</p>
        </div>
      </div>
      
      <!-- End of Activities Message -->
      <div v-else-if="activities.length > 0 && !hasMorePages" class="text-center py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">✨ Has visto toda la actividad disponible</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-12">
      <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay actividad</h3>
      <p class="text-gray-600 dark:text-gray-300">No se encontraron eventos recientes</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Data
const activities = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const hasMorePages = ref(true)

// Parse XML activity response
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

// Load activity from CodebaseHQ (initial load)
const loadActivity = async (reset = true) => {
  if (reset) {
    loading.value = true
    activities.value = []
    currentPage.value = 1
    hasMorePages.value = true
  } else {
    loadingMore.value = true
  }
  
  error.value = ''
  
  try {
    // Get configuration
    const config = {
      accountName: await getConfig('codebase_account_name'),
      username: await getConfig('codebase_username'),
      apiKey: await getConfig('codebase_api_key'),
      projectPermalink: await getConfig('codebase_project_permalink')
    }
    
    // Validate configuration
    if (!config.username || !config.apiKey) {
      error.value = 'CodebaseHQ no está configurado. Por favor, configura tus credenciales primero.'
      return
    }
    
    // Fetch activity
    const response = await window.electronAPI.codebaseGetActivity(config, currentPage.value)
    
    if (response.success) {
      const newActivities = parseActivities(response.data)
      
      if (reset) {
        activities.value = newActivities
      } else {
        activities.value = [...activities.value, ...newActivities]
      }
      
      // Check if we have more pages (CodebaseHQ returns 20 items per page)
      hasMorePages.value = newActivities.length === 20
    } else {
      error.value = response.error || 'Error cargando actividad'
    }
  } catch (err) {
    error.value = `Error inesperado: ${err.message}`
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Helper to get config value
const getConfig = async (key) => {
  try {
    const response = await window.electronAPI.dbGetConfig(key)
    return response.success ? response.data.value : ''
  } catch (error) {
    console.warn(`Error getting config ${key}:`, error)
    return ''
  }
}

// Format activity title
const formatActivityTitle = (activity) => {
  let title = activity.title || ''
  
  // Remove actor name from beginning
  title = title.replace(new RegExp(`^${activity.actorName}\\s+`), '')
  
  // Add styling to important parts
  title = title.replace(/(\d+) commit\(s\)/g, '<strong class="text-purple-600 dark:text-purple-400">$1 commits</strong>')
  title = title.replace(/pushed/g, '<span class="text-blue-600 dark:text-blue-400">pushed</span>')
  title = title.replace(/deployed/g, '<span class="text-green-600 dark:text-green-400">deployed</span>')
  title = title.replace(/merged/g, '<span class="text-orange-600 dark:text-orange-400">merged</span>')
  title = title.replace(/created/g, '<span class="text-purple-600 dark:text-purple-400">created</span>')
  title = title.replace(/deleted/g, '<span class="text-red-600 dark:text-red-400">deleted</span>')
  
  return `<span class="text-gray-700 dark:text-gray-300">${title}</span>`
}

// Format date
const formatDate = (timestamp) => {
  if (!timestamp) return ''
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

// Get type badge class
const getTypeBadgeClass = (type) => {
  const classes = {
    push: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    deployment: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    merge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    ticket: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    comment: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }
  return classes[type] || classes.comment
}

// Get type label
const getTypeLabel = (type) => {
  const labels = {
    push: 'Push',
    deployment: 'Deploy',
    merge: 'Merge',
    ticket: 'Ticket',
    comment: 'Comment'
  }
  return labels[type] || type
}

// Load more activities for infinite scroll
const loadMore = async () => {
  if (!hasMorePages.value || loadingMore.value) return
  
  currentPage.value++
  await loadActivity(false)
}

// Infinite scroll handler
const handleScroll = () => {
  const scrollContainer = document.querySelector('.flex-1.overflow-auto')
  if (!scrollContainer) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 300 // 300px before bottom
  
  if (isNearBottom && hasMorePages.value && !loadingMore.value) {
    loadMore()
  }
}

const goToSettings = () => {
  router.push('/settings')
}

onMounted(async () => {
  await loadActivity()
  
  // Wait for DOM to be ready and add scroll event listener
  await nextTick()
  const scrollContainer = document.querySelector('.flex-1.overflow-auto')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  // Remove scroll event listener
  const scrollContainer = document.querySelector('.flex-1.overflow-auto')
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>