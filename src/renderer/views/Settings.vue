<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
      <p class="text-gray-600 dark:text-gray-300">
        Configuración global de ReleaseFlow
      </p>
    </div>

    <!-- CodebaseHQ Configuration Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center mb-4">
        <i class="pi pi-cloud-upload text-purple-500 mr-2"></i>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">CodebaseHQ</h2>
      </div>
      
      <div class="space-y-4">
        <div class="flex items-center">
          <input 
            type="checkbox"
            v-model="codebaseEnabled" 
            class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Habilitar integración con CodebaseHQ
          </label>
        </div>
        
        <div v-if="codebaseEnabled" class="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Name
              </label>
              <input 
                v-model="accountName" 
                placeholder="mindware" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                readonly
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fijo para todos los usuarios
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Permalink
              </label>
              <input 
                v-model="projectPermalink" 
                placeholder="Clever" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                readonly
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Proyecto común para todos
              </p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="username" 
              placeholder="pablo-pelardas" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tu username de CodebaseHQ
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="apiKey" 
                :type="showApiKey ? 'text' : 'password'"
                placeholder="ygUiFetU28zDJxe1y8FC4yLaK5PIAkmPrU8uhpTbCFmxBpMMYD6RpgxzZSeV" 
                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              <button 
                @click="showApiKey = !showApiKey"
                class="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i :class="showApiKey ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tu API key personal de CodebaseHQ (Settings → My Profile)
            </p>
          </div>
          
          <div class="flex items-center space-x-3">
            <button 
              @click="testConnection"
              :disabled="!username || !apiKey || testing"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <i :class="testing ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"></i>
              <span>{{ testing ? 'Probando...' : 'Probar Conexión' }}</span>
            </button>
            
            <span v-if="connectionStatus === 'success'" class="text-green-600 dark:text-green-400 text-sm flex items-center">
              <i class="pi pi-check-circle mr-1"></i>
              Conexión exitosa
            </span>
            <span v-else-if="connectionStatus === 'error'" class="text-red-600 dark:text-red-400 text-sm flex items-center">
              <i class="pi pi-times-circle mr-1"></i>
              Error de conexión
            </span>
          </div>
          
          <div v-if="connectionError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-red-700 dark:text-red-300 text-sm">
              {{ connectionError }}
            </p>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button 
            @click="saveSettings"
            :disabled="saving"
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
            <span>{{ saving ? 'Guardando...' : 'Guardar Configuración' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Other Settings Sections -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center mb-4">
        <i class="pi pi-cog text-blue-500 mr-2"></i>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">General</h2>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tema
          </label>
          <select 
            v-model="theme"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="system">Sistema</option>
          </select>
        </div>
        
        <div>
          <div class="flex items-center">
            <input 
              type="checkbox"
              v-model="autoPushTags" 
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Push automático de tags por defecto
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Reactive data
const codebaseEnabled = ref(false)
const accountName = ref('mindware')
const projectPermalink = ref('Clever')
const username = ref('')
const apiKey = ref('')
const showApiKey = ref(false)
const testing = ref(false)
const saving = ref(false)
const connectionStatus = ref(null) // 'success', 'error', null
const connectionError = ref('')

// General settings
const theme = ref('light')
const autoPushTags = ref(false)

// Load settings
const loadSettings = async () => {
  try {
    const settings = [
      'codebase_enabled',
      'codebase_account_name', 
      'codebase_username',
      'codebase_api_key',
      'codebase_project_permalink',
      'theme',
      'auto_push_tags'
    ]
    
    for (const key of settings) {
      const response = await window.electronAPI.dbGetConfig(key)
      if (response.success) {
        const value = response.data.value
        
        switch (key) {
          case 'codebase_enabled':
            codebaseEnabled.value = value === 'true'
            break
          case 'codebase_account_name':
            accountName.value = value || 'mindware'
            break
          case 'codebase_username':
            username.value = value || ''
            break
          case 'codebase_api_key':
            apiKey.value = value || ''
            break
          case 'codebase_project_permalink':
            projectPermalink.value = value || 'Clever'
            break
          case 'theme':
            theme.value = value || 'light'
            break
          case 'auto_push_tags':
            autoPushTags.value = value === 'true'
            break
        }
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

// Test CodebaseHQ connection
const testConnection = async () => {
  if (!username.value || !apiKey.value) return
  
  testing.value = true
  connectionStatus.value = null
  connectionError.value = ''
  
  try {
    const config = {
      accountName: accountName.value,
      username: username.value,
      apiKey: apiKey.value,
      projectPermalink: projectPermalink.value,
      repositoryPermalink: '' // No es necesario para test de actividad
    }
    
    const response = await window.electronAPI.codebaseTestConnection(config)
    
    if (response.success) {
      connectionStatus.value = 'success'
    } else {
      connectionStatus.value = 'error'
      connectionError.value = response.error
    }
  } catch (error) {
    connectionStatus.value = 'error' 
    connectionError.value = error.message
  } finally {
    testing.value = false
  }
}

// Save settings
const saveSettings = async () => {
  saving.value = true
  
  try {
    const settings = [
      { key: 'codebase_enabled', value: codebaseEnabled.value ? 'true' : 'false' },
      { key: 'codebase_account_name', value: accountName.value },
      { key: 'codebase_username', value: username.value },
      { key: 'codebase_api_key', value: apiKey.value },
      { key: 'codebase_project_permalink', value: projectPermalink.value },
      { key: 'theme', value: theme.value },
      { key: 'auto_push_tags', value: autoPushTags.value ? 'true' : 'false' }
    ]
    
    for (const setting of settings) {
      const response = await window.electronAPI.dbSetConfig(setting.key, setting.value)
      if (!response.success) {
        throw new Error(`Error guardando ${setting.key}: ${response.error}`)
      }
    }
    
    alert('✅ Configuración guardada exitosamente')
    
    // Reset connection status
    connectionStatus.value = null
    connectionError.value = ''
    
  } catch (error) {
    console.error('Error saving settings:', error)
    alert(`❌ Error guardando configuración: ${error.message}`)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
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