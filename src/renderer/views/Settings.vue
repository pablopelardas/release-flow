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
              :disabled="testing"
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

    <!-- Microsoft Teams Configuration Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center mb-4">
        <i class="pi pi-microsoft text-blue-500 mr-2"></i>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Microsoft Teams</h2>
      </div>
      
      <div class="space-y-4">
        <div class="flex items-center">
          <input 
            type="checkbox"
            v-model="teamsEnabled" 
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Habilitar notificaciones de release a Teams (Power Automate)
          </label>
        </div>
        
        <div v-if="teamsEnabled" class="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Power Automate Workflow URL <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="teamsWebhookUrl" 
              type="url"
              placeholder="https://prod-01.brazilsouth.logic.azure.com:443/workflows/..." 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              URL del workflow de Power Automate para enviar notificaciones de releases a Teams
            </p>
          </div>
          
          <div class="flex items-center space-x-4">
            <button 
              @click="testTeamsConnection"
              :disabled="testingTeamsConnection"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <i :class="testingTeamsConnection ? 'pi pi-spin pi-spinner' : 'pi pi-send'"></i>
              <span>{{ testingTeamsConnection ? 'Probando...' : 'Probar Conexión' }}</span>
            </button>
            
            <span v-if="teamsConnectionStatus === 'success'" class="text-green-600 dark:text-green-400 text-sm flex items-center">
              <i class="pi pi-check-circle mr-1"></i>
              Conexión exitosa
            </span>
            <span v-else-if="teamsConnectionStatus === 'error'" class="text-red-600 dark:text-red-400 text-sm flex items-center">
              <i class="pi pi-times-circle mr-1"></i>
              Error de conexión
            </span>
          </div>
          
          <div v-if="teamsConnectionError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-red-700 dark:text-red-300 text-sm">
              {{ teamsConnectionError }}
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
              :disabled="testingJira"
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

    <!-- Database Information Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <i class="pi pi-database text-indigo-500 mr-2"></i>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Información de Base de Datos</h2>
        </div>
        <button 
          @click="loadDatabaseInfo"
          :disabled="loadingDbInfo"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
        >
          <i :class="loadingDbInfo ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
          <span>Actualizar</span>
        </button>
      </div>
      
      <div v-if="databaseInfo" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ubicación de la Base de Datos
              </label>
              <div class="flex items-center space-x-2">
                <input 
                  :value="databaseInfo.databasePath" 
                  readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button 
                  @click="copyToClipboard(databaseInfo.databasePath)"
                  class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  title="Copiar ruta"
                >
                  <i class="pi pi-copy"></i>
                </button>
                <button 
                  @click="showInExplorer(databaseInfo.databasePath)"
                  class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Mostrar en explorador"
                >
                  <i class="pi pi-folder-open"></i>
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ databaseInfo.isDevelopment ? 'Modo desarrollo' : 'Modo producción' }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Directorio de Datos de Usuario
              </label>
              <div class="flex items-center space-x-2">
                <input 
                  :value="databaseInfo.userDataPath" 
                  readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button 
                  @click="copyToClipboard(databaseInfo.userDataPath)"
                  class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  title="Copiar ruta"
                >
                  <i class="pi pi-copy"></i>
                </button>
                <button 
                  @click="showInExplorer(databaseInfo.userDataPath)"
                  class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Mostrar en explorador"
                >
                  <i class="pi pi-folder-open"></i>
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Carpeta donde Electron almacena todos los datos de la aplicación
              </p>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Estado de la Base de Datos</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Estado:</span>
                  <span :class="databaseInfo.databaseExists ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    <i :class="databaseInfo.databaseExists ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    {{ databaseInfo.databaseExists ? 'Existe' : 'No encontrada' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Tamaño:</span>
                  <span class="text-gray-900 dark:text-white font-mono">{{ formatBytes(databaseInfo.databaseSize) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Modo:</span>
                  <span class="text-gray-900 dark:text-white">{{ databaseInfo.isDevelopment ? 'Desarrollo' : 'Producción' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
            <i class="pi pi-info-circle mr-2"></i>
            Compartir Base de Datos entre Desarrolladores
          </h4>
          <div class="text-blue-800 dark:text-blue-200 text-sm space-y-2">
            <p>
              <strong>En desarrollo:</strong> La base de datos se guarda en el directorio del proyecto como <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">releaseflow-dev.db</code>
            </p>
            <p>
              <strong>En producción:</strong> Se guarda en el directorio de datos de usuario del sistema operativo
            </p>
            <p>
              <strong>Para compartir:</strong> Puedes copiar el archivo <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">.db</code> entre desarrolladores para mantener los mismos repositorios y configuraciones.
            </p>
          </div>
        </div>
      </div>
      
      <div v-else-if="loadingDbInfo" class="flex items-center justify-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
        <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando información...</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

// Reactive data
const codebaseEnabled = ref(false)
const accountName = ref('mindware')
const projectPermalink = ref('Clever')
const username = ref('')
const apiKey = ref('')
const showApiKey = ref(false)

// Teams configuration
const teamsEnabled = ref(false)
const teamsWebhookUrl = ref('')
const testingTeamsConnection = ref(false)
const teamsConnectionStatus = ref('')
const teamsConnectionError = ref('')
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

// Database info
const databaseInfo = ref(null)
const loadingDbInfo = ref(false)


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
      'jira_project_key',
      'teams_enabled',
      'teams_webhook_url'
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
          case 'teams_enabled':
            teamsEnabled.value = value === 'true' || value === true
            break
          case 'teams_webhook_url':
            teamsWebhookUrl.value = value || ''
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
  if (!username.value || !apiKey.value) {
    alert('⚠️ Por favor completa Username y API Key antes de probar la conexión')
    return
  }
  
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

// Test Teams connection
const testTeamsConnection = async () => {
  if (!teamsWebhookUrl.value) {
    alert('⚠️ Por favor completa la URL del webhook antes de probar la conexión')
    return
  }
  
  testingTeamsConnection.value = true
  teamsConnectionStatus.value = null
  teamsConnectionError.value = ''
  
  try {
    const config = {
      webhookUrl: teamsWebhookUrl.value,
      enabled: true
    }
    
    const result = await window.electronAPI.teamsTestConnection(config)
    
    if (result.success) {
      teamsConnectionStatus.value = 'success'
    } else {
      teamsConnectionStatus.value = 'error'
      teamsConnectionError.value = result.error || 'Error desconocido'
    }
  } catch (error) {
    console.error('Error testing Teams connection:', error)
    teamsConnectionStatus.value = 'error'
    teamsConnectionError.value = 'Error de conexión'
  } finally {
    testingTeamsConnection.value = false
  }
}

// Test JIRA connection
const testJiraConnection = async () => {
  if (!jiraUsername.value || !jiraApiToken.value) {
    alert('⚠️ Por favor completa Username y API Token antes de probar la conexión')
    return
  }
  
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
  if (!window.electronAPI || !window.electronAPI.dbSetConfig) {
    alert('❌ Error: API de Electron no disponible')
    return
  }

  saving.value = true
  
  // Timeout de seguridad - forzar desbloqueo después de 10 segundos
  const emergencyTimeout = setTimeout(async () => {
    saving.value = false
    await nextTick()
    alert('⚠️ Timeout de guardado - Formulario desbloqueado automáticamente')
  }, 10000)
  
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
      { key: 'jira_project_key', value: jiraProjectKey.value },
      { key: 'teams_enabled', value: teamsEnabled.value ? 'true' : 'false' },
      { key: 'teams_webhook_url', value: teamsWebhookUrl.value }
    ]
    
    for (const setting of settings) {
      const response = await Promise.race([
        window.electronAPI.dbSetConfig(setting.key, setting.value),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout guardando ${setting.key}`)), 3000)
        )
      ])
      
      if (!response || !response.success) {
        throw new Error(`Error guardando ${setting.key}: ${response?.error || 'Sin respuesta'}`)
      }
    }
    
    // Reset connection status
    connectionStatus.value = null
    connectionError.value = ''
    
    // Forzar actualización de UI antes del alert
    await nextTick()
    
    // HACK: Simular pérdida y recuperación de foco para forzar re-render
    window.blur()
    setTimeout(() => {
      window.focus()
    }, 50)
    
    alert('✅ Configuración guardada exitosamente')
    
  } catch (error) {
    console.error('Error saving settings:', error)
    alert(`❌ Error guardando configuración: ${error.message}`)
    
  } finally {
    // Cancelar timeout de emergencia
    clearTimeout(emergencyTimeout)
    
    // FORZAR desbloqueo
    saving.value = false
    
    // Forzar re-render de Vue para actualizar UI inmediatamente
    await nextTick()
    
    // HACK FINAL: Simular ciclo focus para forzar actualización
    setTimeout(() => {
      window.blur()
      setTimeout(() => {
        window.focus()
      }, 30)
    }, 50)
    
    // Verificación adicional
    setTimeout(async () => {
      if (saving.value) {
        saving.value = false
        await nextTick()
      }
    }, 200)
  }
}

// Load database info
const loadDatabaseInfo = async () => {
  loadingDbInfo.value = true
  try {
    const response = await window.electronAPI.getDatabaseInfo()
    if (response.success) {
      databaseInfo.value = response.data
    } else {
      console.error('Error loading database info:', response.error)
    }
  } catch (error) {
    console.error('Error loading database info:', error)
  } finally {
    loadingDbInfo.value = false
  }
}

// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('✅ Ruta copiada al portapapeles')
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    alert('❌ Error copiando al portapapeles')
  }
}

// Show in explorer
const showInExplorer = async (path) => {
  try {
    await window.electronAPI.showInExplorer(path)
  } catch (error) {
    console.error('Error showing in explorer:', error)
    alert('❌ Error abriendo explorador')
  }
}

// Format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}


onMounted(() => {
  loadSettings()
  loadDatabaseInfo()
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