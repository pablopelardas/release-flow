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
              :to="{ path: '/changelog' }"
              :class="[
                'flex items-center px-4 py-2 rounded-lg transition-colors',
                $route.path === '/changelog'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              <i class="pi pi-history mr-3"></i>
              Changelog
            </router-link>
          </li>
          <li v-if="settingsStore.isCodebaseConfigured">
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
            <!-- Version Badge -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">v{{ appVersion }}</span>
              
              <!-- Indicador de verificación -->
              <span v-if="checkingForUpdates" class="text-xs text-blue-500 flex items-center">
                <i class="pi pi-spin pi-spinner mr-1"></i>
                Verificando...
              </span>
              
              <!-- Botón de actualización -->
              <button
                v-if="updateAvailable"
                @click="installUpdate"
                class="text-xs bg-green-500 text-white px-2 py-1 rounded-full hover:bg-green-600 transition-colors animate-pulse"
              >
                <i class="pi pi-download mr-1"></i>
                Actualizar a v{{ newVersion }}
              </button>
              
              <!-- Botón para verificar manualmente -->
              <button
                v-if="!updateAvailable && !checkingForUpdates"
                @click="checkForUpdates"
                title="Verificar actualizaciones"
                class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i class="pi pi-refresh"></i>
              </button>
            </div>
            
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '../store/settings'

const route = useRoute()
const isDark = ref(false)
const settingsStore = useSettingsStore()
const appVersion = ref('1.0.0')
const updateAvailable = ref(false)
const checkingForUpdates = ref(false)
const newVersion = ref('')

const _pageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard',
    '/repositories': 'Gestión de Repositorios',
    '/templates': 'Editor de Templates',
    '/releases': 'Generación de Releases',
    '/changelog': 'Changelog Completo',
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

const installUpdate = async () => {
  console.log('[MainLayout] Instalando actualización...')
  if (window.electronAPI && window.electronAPI.appRestartAndInstallUpdate) {
    await window.electronAPI.appRestartAndInstallUpdate()
  }
}

const checkForUpdates = async () => {
  console.log('[MainLayout] 🔍 Verificando actualizaciones manualmente...')
  console.log('[MainLayout] 📱 Versión actual mostrada:', appVersion.value)
  console.log('[MainLayout] 🌐 ElectronAPI disponible:', !!window.electronAPI)
  console.log('[MainLayout] 🔧 Método appCheckForUpdates disponible:', !!(window.electronAPI && window.electronAPI.appCheckForUpdates))
  
  checkingForUpdates.value = true
  
  try {
    if (window.electronAPI && window.electronAPI.appCheckForUpdates) {
      console.log('[MainLayout] 📡 Llamando a appCheckForUpdates...')
      
      const response = await window.electronAPI.appCheckForUpdates()
      
      console.log('[MainLayout] ✅ Respuesta completa recibida:', response)
      console.log('[MainLayout] 📊 Tipo de respuesta:', typeof response)
      console.log('[MainLayout] 🔍 Success:', response?.success)
      console.log('[MainLayout] 📦 Data:', response?.data)
      console.log('[MainLayout] 📦 Tipo de data:', typeof response?.data)
      console.log('[MainLayout] ❌ Error:', response?.error)
      
      if (response?.success === true) {
        console.log('[MainLayout] ✅ Verificación exitosa')
        if (response.data !== undefined && response.data !== null) {
          console.log('[MainLayout] 📦 Data contiene información:', response.data)
          console.log('[MainLayout] 📦 Keys en data:', typeof response.data === 'object' ? Object.keys(response.data) : 'no es objeto')
        } else {
          console.log('[MainLayout] ⚠️ Data es undefined/null - posible no hay actualizaciones')
        }
      } else {
        console.log('[MainLayout] ❌ Verificación falló:', response?.error)
      }
      
      if (!response.success) {
        console.log('[MainLayout] 🚫 No se pudo verificar actualizaciones:', response.error)
      }
    } else {
      console.log('[MainLayout] ❌ ElectronAPI no disponible o método faltante')
      console.log('[MainLayout] 🔧 window.electronAPI:', window.electronAPI)
      console.log('[MainLayout] 🔧 appCheckForUpdates:', window.electronAPI?.appCheckForUpdates)
    }
  } catch (error) {
    console.error('[MainLayout] 💥 Error verificando actualizaciones:', error)
    console.error('[MainLayout] 💥 Stack trace:', error.stack)
    console.error('[MainLayout] 💥 Message:', error.message)
  } finally {
    console.log('[MainLayout] 🏁 Finalizando verificación de actualizaciones')
    setTimeout(() => {
      console.log('[MainLayout] 🔄 Ocultando indicador de verificación')
      checkingForUpdates.value = false
    }, 3000)
  }
}

onMounted(async () => {
  // Check for saved theme preference or default to light
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark')
  }
  
  // Load CodebaseHQ configuration to check if it's configured
  await settingsStore.loadCodebaseConfig()
  
  // Obtener versión de la aplicación
  console.log('[MainLayout] 🚀 Inicializando aplicación...')
  console.log('[MainLayout] 🔧 ElectronAPI disponible:', !!window.electronAPI)
  console.log('[MainLayout] 🔧 Método appGetVersion disponible:', !!(window.electronAPI && window.electronAPI.appGetVersion))
  
  if (window.electronAPI && window.electronAPI.appGetVersion) {
    console.log('[MainLayout] 📱 Obteniendo versión de la aplicación...')
    const versionResponse = await window.electronAPI.appGetVersion()
    console.log('[MainLayout] 📱 Respuesta de versión:', versionResponse)
    
    if (versionResponse.success) {
      console.log('[MainLayout] ✅ Versión obtenida:', versionResponse.data.version)
      appVersion.value = versionResponse.data.version
    } else {
      console.log('[MainLayout] ❌ Error obteniendo versión:', versionResponse.error)
    }
  } else {
    console.log('[MainLayout] ❌ No se pudo obtener la versión - API no disponible')
  }
  
  // Escuchar eventos de actualización
  console.log('[MainLayout] 🔧 Listener onUpdateDownloaded disponible:', !!(window.electronAPI && window.electronAPI.onUpdateDownloaded))
  
  if (window.electronAPI && window.electronAPI.onUpdateDownloaded) {
    console.log('[MainLayout] 📡 Registrando listener para actualizaciones...')
    window.electronAPI.onUpdateDownloaded((event, info) => {
      console.log('[MainLayout] 🎉 ¡Actualización descargada!', info)
      console.log('[MainLayout] 📦 Event:', event)
      console.log('[MainLayout] 📦 Info type:', typeof info)
      console.log('[MainLayout] 📦 Info content:', info)
      
      updateAvailable.value = true
      console.log('[MainLayout] ✅ updateAvailable set to true')
      
      // Si viene información de la versión, mostrarla
      if (info && info.version) {
        console.log('[MainLayout] 🔖 Versión detectada en info:', info.version)
        newVersion.value = info.version
      } else {
        console.log('[MainLayout] ⚠️ No se detectó versión en info, usando 1.2.4 por defecto')
        newVersion.value = '1.2.4'
      }
      
      console.log('[MainLayout] 🔖 Nueva versión establecida:', newVersion.value)
    })
    console.log('[MainLayout] ✅ Listener registrado exitosamente')
  } else {
    console.log('[MainLayout] ❌ No se pudo registrar listener - API no disponible')
  }
  
  // Verificar actualizaciones automáticamente al inicio
  console.log('[MainLayout] Verificando actualizaciones al iniciar...')
  setTimeout(() => {
    checkForUpdates()
  }, 5000) // Esperar 5 segundos después de iniciar
})
</script>