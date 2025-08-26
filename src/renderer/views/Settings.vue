<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Integraciones</h1>
      <p class="text-gray-600 dark:text-gray-300">
        Configuración de integraciones externas
      </p>
    </div>

    <!-- CodebaseHQ Configuration Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center mb-4">
        <i class="pi pi-box text-purple-500 mr-2"></i>
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

    <!-- JIRA Configuration Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center mb-4">
        <i class="pi pi-sitemap text-blue-500 mr-2"></i>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">JIRA</h2>
      </div>
      
      <div class="space-y-4">
        <div class="flex items-center">
          <input 
            type="checkbox"
            v-model="jiraEnabled" 
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Habilitar integración con JIRA
          </label>
        </div>
        
        <div v-if="jiraEnabled" class="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base URL <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="jiraBaseUrl" 
              placeholder="https://your-company.atlassian.net" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              URL base de tu instancia de JIRA/Atlassian Cloud
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username/Email <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="jiraUsername" 
                placeholder="user@company.com" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tu email de JIRA/Atlassian
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Key <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="jiraProjectKey" 
                placeholder="PROJ" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                @input="jiraProjectKey = jiraProjectKey.toUpperCase()"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Clave del proyecto JIRA (ej: PROJ, DEV, etc.)
              </p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Token <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="jiraApiToken" 
                :type="showJiraApiToken ? 'text' : 'password'"
                placeholder="ATATTxxxxxxxxxxxxxxxxxxxxx" 
                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              <button 
                @click="showJiraApiToken = !showJiraApiToken"
                class="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i :class="showJiraApiToken ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              API Token de JIRA (Account Settings → Security → API tokens)
            </p>
          </div>
          
          <div class="flex items-center space-x-3">
            <button 
              @click="testJiraConnection"
              :disabled="!jiraUsername || !jiraApiToken || testingJira"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <i :class="testingJira ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"></i>
              <span>{{ testingJira ? 'Probando...' : 'Probar Conexión' }}</span>
            </button>
            
            <span v-if="jiraConnectionStatus === 'success'" class="text-green-600 dark:text-green-400 text-sm flex items-center">
              <i class="pi pi-check-circle mr-1"></i>
              Conexión exitosa
            </span>
            <span v-else-if="jiraConnectionStatus === 'error'" class="text-red-600 dark:text-red-400 text-sm flex items-center">
              <i class="pi pi-times-circle mr-1"></i>
              Error de conexión
            </span>
          </div>
          
          <div v-if="jiraConnectionError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-red-700 dark:text-red-300 text-sm">
              {{ jiraConnectionError }}
            </p>
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-blue-700 dark:text-blue-300 text-sm">
              <strong>¿Cómo funciona?</strong> ReleaseFlow detectará automáticamente tickets de JIRA en los commits 
              (ej: PROJ-123, #456) y creará releases en JIRA con los tickets asociados.
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

// JIRA settings
const jiraEnabled = ref(false)
const jiraBaseUrl = ref('https://your-company.atlassian.net')
const jiraUsername = ref('')
const jiraApiToken = ref('')
const jiraProjectKey = ref('PROJ')
const showJiraApiToken = ref(false)
const testingJira = ref(false)
const jiraConnectionStatus = ref(null)
const jiraConnectionError = ref('')


// Load settings
const loadSettings = async () => {
  try {
    const settings = [
      'codebase_enabled',
      'codebase_account_name', 
      'codebase_username',
      'codebase_api_key',
      'codebase_project_permalink',
      'jira_enabled',
      'jira_base_url',
      'jira_username',
      'jira_api_token',
      'jira_project_key'
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
          case 'jira_enabled':
            jiraEnabled.value = value === 'true'
            break
          case 'jira_base_url':
            jiraBaseUrl.value = value || 'https://your-company.atlassian.net'
            break
          case 'jira_username':
            jiraUsername.value = value || ''
            break
          case 'jira_api_token':
            jiraApiToken.value = value || ''
            break
          case 'jira_project_key':
            jiraProjectKey.value = value || 'PROJ'
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

// Test JIRA connection
const testJiraConnection = async () => {
  if (!jiraUsername.value || !jiraApiToken.value) return
  
  testingJira.value = true
  jiraConnectionStatus.value = null
  jiraConnectionError.value = ''
  
  try {
    // First save JIRA config to test
    await window.electronAPI.dbSetConfig('jira_enabled', 'true')
    await window.electronAPI.dbSetConfig('jira_base_url', jiraBaseUrl.value)
    await window.electronAPI.dbSetConfig('jira_username', jiraUsername.value)
    await window.electronAPI.dbSetConfig('jira_api_token', jiraApiToken.value)
    await window.electronAPI.dbSetConfig('jira_project_key', jiraProjectKey.value)
    
    const response = await window.electronAPI.jiraTestConnection()
    
    if (response.success) {
      jiraConnectionStatus.value = 'success'
    } else {
      jiraConnectionStatus.value = 'error'
      jiraConnectionError.value = response.error
    }
  } catch (error) {
    jiraConnectionStatus.value = 'error' 
    jiraConnectionError.value = error.message
  } finally {
    testingJira.value = false
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
      { key: 'jira_enabled', value: jiraEnabled.value ? 'true' : 'false' },
      { key: 'jira_base_url', value: jiraBaseUrl.value },
      { key: 'jira_username', value: jiraUsername.value },
      { key: 'jira_api_token', value: jiraApiToken.value },
      { key: 'jira_project_key', value: jiraProjectKey.value }
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