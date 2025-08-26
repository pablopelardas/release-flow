<template>
  <div class="space-y-6">
    <!-- Header with Add Repository Button -->
    <div class="flex justify-between items-center">
      <div>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          Gestiona múltiples repositorios Git para automatizar releases
        </p>
      </div>
      <button 
        @click="showAddDialog = true" 
        class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 btn-add-repo"
      >
        <span>Agregar Repositorio</span>
      </button>
    </div>

    <!-- Repository Cards Grid -->
    <div v-if="repositories.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="repo in repositories" :key="repo.id" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow repository-card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ repo.name }}</h3>
                <span v-if="repo.is_main_repository" class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  Principal
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ repo.path }}</p>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Rama actual:</span>
            <span class="text-sm text-gray-900 dark:text-white">{{ repo.current_branch || 'No disponible' }}</span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
            <span class="text-sm" :class="repo.is_clean === null || repo.is_clean === undefined ? 'text-gray-500 dark:text-gray-400' : (repo.is_clean ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')">
              {{ repo.is_clean === null || repo.is_clean === undefined ? 'No disponible' : (repo.is_clean ? 'Limpio' : 'Con cambios') }}
            </span>
          </div>
          
          <div v-if="repo.tag_prefix" class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Prefijo de Tag:</span>
            <span class="text-sm text-gray-900 dark:text-white font-mono">{{ repo.tag_prefix }}</span>
          </div>
          
          <div v-if="repo.codebase_enabled" class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">CodebaseHQ:</span>
            <div class="flex items-center space-x-2">
              <i class="pi pi-cloud-upload text-purple-500"></i>
              <span class="text-sm text-purple-600 dark:text-purple-400">{{ repo.codebase_environment }}</span>
            </div>
          </div>
          
          <!-- Last Tag Display -->
          <div v-if="repo.last_tag" class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Último tag:</span>
            <span class="text-sm font-semibold text-green-600 dark:text-green-400">
              <i class="pi pi-tag text-xs mr-1"></i>{{ repo.last_tag }}
            </span>
          </div>
        </div>
        
        <div class="flex space-x-2 mt-4">
          <button 
            @click="openRepository(repo)" 
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm transition-colors"
            title="Abrir en explorador"
          >
            <i class="pi pi-folder-open text-xs"></i>
          </button>
          <button 
            @click="editRepository(repo)" 
            class="flex-1 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-300 px-3 py-2 rounded text-sm transition-colors"
            title="Editar repositorio"
          >
            <i class="pi pi-pencil text-xs"></i>
          </button>
          <button 
            @click="refreshRepository(repo)" 
            class="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-sm transition-colors"
            title="Actualizar estado"
          >
            <i class="pi pi-refresh text-xs"></i>
          </button>
          <button 
            @click="removeRepository(repo)" 
            class="flex-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm transition-colors"
            title="Eliminar repositorio"
          >
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
        
        <!-- Configuration Buttons Row -->
        <div v-if="repo.is_main_repository || settingsStore.isCodebaseConfigured" class="flex space-x-2 mt-3">
          <!-- Configure Secondary Repositories Button for Main Repositories -->
          <button 
            v-if="repo.is_main_repository"
            @click="configureSecondaryRepos(repo)"
            class="flex-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center space-x-1"
            title="Configurar Repositorios Secundarios"
          >
            <span class="text-sm">⚙️</span>
            <span>Repos Sec.</span>
          </button>
          
          <!-- Configure CodebaseHQ Button -->
          <button 
            v-if="settingsStore.isCodebaseConfigured"
            @click="configureCodebaseHQ(repo)"
            class="flex-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center space-x-1"
            title="Configurar CodebaseHQ"
          >
            <i class="pi pi-cloud-upload text-xs"></i>
            <span>CodebaseHQ</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl text-gray-400 mb-4">📁</div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay repositorios</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-4">Comienza agregando tu primer repositorio Git</p>
      <button 
        @click="showAddDialog = true" 
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors btn-add-repo"
      >
        Agregar Repositorio
      </button>
    </div>

    <!-- Add Repository Dialog -->
    <div v-if="showAddDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Agregar Repositorio</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ruta del repositorio
            </label>
            <input 
              v-model="newRepoPath" 
              placeholder="Seleccionar carpeta..." 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              readonly
            />
            <button 
              @click="selectFolder" 
              class="mt-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded transition-colors"
            >
              Examinar
            </button>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre (opcional)
            </label>
            <input 
              v-model="newRepoName" 
              placeholder="Nombre personalizado..." 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prefijo de Tag (opcional)
            </label>
            <input 
              v-model="newRepoTagPrefix" 
              placeholder="ej: UtilitiesAPIv, AppNamev..." 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Los tags se crearán como: {{ newRepoTagPrefix || '[prefijo]' }}1.2.0
            </p>
          </div>
          
          <div>
            <div class="flex items-center">
              <input 
                type="checkbox"
                v-model="newRepoIsMain" 
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Es repositorio principal de aplicación
              </label>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Los repositorios principales pueden tener repositorios secundarios donde se replicarán exactamente los mismos tags (con el mismo prefijo)
            </p>
          </div>

          <!-- CodebaseHQ Configuration -->
          <div v-if="settingsStore.isCodebaseConfigured" class="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div class="flex items-center mb-3">
              <input 
                type="checkbox"
                v-model="newRepoCodebaseEnabled" 
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <i class="pi pi-cloud-upload mr-1 text-purple-500"></i>
                Habilitar deployments en CodebaseHQ
              </label>
            </div>
            
            <div v-if="newRepoCodebaseEnabled" class="space-y-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Repository Permalink en CodebaseHQ
                </label>
                <input 
                  v-model="newRepoCodebasePermalink" 
                  placeholder="ej: omint" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL será: https://api3.codebasehq.com/Clever/<strong>{{ newRepoCodebasePermalink || 'repo' }}</strong>/deployments
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Environment
                </label>
                <input 
                  v-model="newRepoCodebaseEnvironment" 
                  placeholder="ej: TurnosOmintWebAPI, production" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servers (separados por coma)
                </label>
                <input 
                  v-model="newRepoCodebaseServers" 
                  placeholder="ej: vturnoscli.omint.ad, server2.domain.com" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            @click="showAddDialog = false" 
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="addRepository" 
            :disabled="!newRepoPath" 
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-4 py-2 rounded transition-colors btn-add-repo"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>

    <!-- Configure Secondary Repositories Modal -->
    <div v-if="showConfigureSecondariesDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-full max-h-[80vh] overflow-y-auto">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Configurar Repositorios Secundarios
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Para: <span class="font-semibold">{{ selectedMainRepo?.name }}</span>
        </p>
        
        <div class="space-y-3 mb-6">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selecciona los repositorios donde se replicarán los tags:
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p class="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Importante:</strong> Los repositorios secundarios recibirán exactamente el mismo tag que el principal.
              <br>Por ejemplo, si creas <code>{{ selectedMainRepo?.tag_prefix || 'MiAppv' }}2.1.0</code> aquí, ese mismo tag se creará en todos los repositorios secundarios.
            </p>
          </div>
          
          <div v-if="!availableSecondaryRepos.length" class="text-center py-4">
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              No hay repositorios secundarios disponibles
            </p>
          </div>
          
          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div 
              v-for="repo in availableSecondaryRepos" 
              :key="repo.id"
              class="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input 
                type="checkbox"
                :value="repo.id"
                v-model="selectedSecondaryRepoIds"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-3"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ repo.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ repo.path }}</p>
                <p class="text-xs text-gray-400 italic mt-1">
                  Recibirá tag: <code>{{ selectedMainRepo?.tag_prefix || '' }}[version]</code>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button 
            @click="cancelConfigureSecondaries" 
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveSecondaryRepos" 
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Configure CodebaseHQ Modal -->
    <div v-if="showConfigureCodebaseDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-full">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Configurar CodebaseHQ
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Para: <span class="font-semibold">{{ selectedCodebaseRepo?.name }}</span>
        </p>
        
        <div class="space-y-4">
          <div class="flex items-center">
            <input 
              type="checkbox"
              v-model="editCodebaseEnabled"
              :disabled="savingCodebase"
              class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-300"
            />
            <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Habilitar deployments en CodebaseHQ
            </label>
          </div>
          
          <div v-if="editCodebaseEnabled" class="space-y-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Repository Permalink
              </label>
              <input 
                v-model="editCodebasePermalink"
                :disabled="savingCodebase"
                placeholder="ej: omint" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 disabled:text-gray-500"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL: https://api3.codebasehq.com/Clever/<strong>{{ editCodebasePermalink || 'repo' }}</strong>/deployments
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Environment
              </label>
              <input 
                v-model="editCodebaseEnvironment"
                :disabled="savingCodebase"
                placeholder="ej: TurnosOmintWebAPI" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servers (separados por coma)
              </label>
              <input 
                v-model="editCodebaseServers"
                :disabled="savingCodebase"
                placeholder="ej: vturnoscli.omint.ad" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            @click="cancelConfigureCodebase"
            :disabled="savingCodebase"
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveCodebaseConfig"
            :disabled="savingCodebase"
            class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors flex items-center justify-center space-x-2"
          >
            <i v-if="savingCodebase" class="pi pi-spin pi-spinner"></i>
            <span>{{ savingCodebase ? 'Guardando...' : 'Guardar' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Edit Repository Modal -->
    <div v-if="showEditDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-full">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Editar Repositorio
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input 
              v-model="editRepoName" 
              placeholder="Nombre del repositorio" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ruta del Repositorio
            </label>
            <div class="flex space-x-2">
              <input 
                v-model="editRepoPath" 
                placeholder="C:\proyectos\mi-repo" 
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                readonly
              />
              <button 
                @click="selectEditRepoPath" 
                class="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <i class="pi pi-folder"></i>
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecciona la carpeta raíz del repositorio Git
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prefijo de Tags
            </label>
            <input 
              v-model="editRepoTagPrefix" 
              placeholder="ej: v, MiAppv, release-" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Los tags se crearán como: {{ editRepoTagPrefix || 'v' }}1.0.0
            </p>
          </div>
          
          <div>
            <div class="flex items-center">
              <input 
                type="checkbox"
                v-model="editRepoIsMain" 
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Repositorio Principal
              </label>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Los repositorios principales pueden tener repositorios secundarios asociados
            </p>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            @click="cancelEdit" 
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveEditRepository" 
            :disabled="!editRepoName || !editRepoPath" 
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRepositoriesStore, useSettingsStore } from '../store'

// Stores
const repositoriesStore = useRepositoriesStore()
const settingsStore = useSettingsStore()

// Reactive data
const showAddDialog = ref(false)
const newRepoPath = ref('')
const newRepoName = ref('')
const newRepoTagPrefix = ref('')
const newRepoIsMain = ref(false)
const newRepoCodebaseEnabled = ref(false)
const newRepoCodebasePermalink = ref('')
const newRepoCodebaseEnvironment = ref('production')
const newRepoCodebaseServers = ref('vturnoscli.omint.ad')

// Secondary repositories configuration
const showConfigureSecondariesDialog = ref(false)
const selectedMainRepo = ref(null)
const availableSecondaryRepos = ref([])
const selectedSecondaryRepoIds = ref([])

// CodebaseHQ configuration
const showConfigureCodebaseDialog = ref(false)
const selectedCodebaseRepo = ref(null)
const editCodebaseEnabled = ref(false)
const editCodebasePermalink = ref('')
const editCodebaseEnvironment = ref('')
const editCodebaseServers = ref('')
const savingCodebase = ref(false)

// Edit repository
const showEditDialog = ref(false)
const editingRepo = ref(null)
const editRepoName = ref('')
const editRepoPath = ref('')
const editRepoTagPrefix = ref('')
const editRepoIsMain = ref(false)

// Computed properties
const repositories = computed(() => repositoriesStore.repositories)

const selectFolder = async () => {
  try {
    const result = await window.electronAPI?.openFolder?.()
    if (result && !result.canceled && result.filePaths?.length > 0) {
      newRepoPath.value = result.filePaths[0]
      if (!newRepoName.value) {
        newRepoName.value = newRepoPath.value.split(/[/\\]/).pop() || ''
      }
    }
  } catch (error) {
    console.error('Error selecting folder:', error)
  }
}

const addRepository = async () => {
  if (!newRepoPath.value) return

  try {
    const repoData = {
      name: newRepoName.value || newRepoPath.value.split(/[/\\]/).pop(),
      path: newRepoPath.value,
      tag_prefix: newRepoTagPrefix.value || '',
      is_main_repository: newRepoIsMain.value,
      codebase_enabled: newRepoCodebaseEnabled.value,
      codebase_repository_permalink: newRepoCodebasePermalink.value || '',
      codebase_environment: newRepoCodebaseEnvironment.value || 'production',
      codebase_servers: newRepoCodebaseServers.value || ''
    }

    await repositoriesStore.addRepository(repoData)

    // Reset form solo si fue exitoso
    newRepoPath.value = ''
    newRepoName.value = ''
    newRepoTagPrefix.value = ''
    newRepoIsMain.value = false
    newRepoCodebaseEnabled.value = false
    newRepoCodebasePermalink.value = ''
    newRepoCodebaseEnvironment.value = 'production'
    newRepoCodebaseServers.value = 'vturnoscli.omint.ad'
    showAddDialog.value = false
  } catch (error) {
    console.error('Error adding repository:', error)
  }
}

const openRepository = async (repo) => {
  try {
    await repositoriesStore.openRepositoryInExplorer(repo.path)
  } catch (error) {
    console.error('Error opening repository:', error)
  }
}

const refreshRepository = async (repo) => {
  try {
    await repositoriesStore.refreshRepositoryStatus(repo.id)
  } catch (error) {
    console.error('Error refreshing repository:', error)
  }
}

const removeRepository = async (repo) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el repositorio "${repo.name}"?`)) {
    try {
      await repositoriesStore.deleteRepository(repo.id)
    } catch (error) {
      console.error('Error removing repository:', error)
    }
  }
}

const editRepository = (repo) => {
  console.log('Opening edit dialog for repo:', repo)
  console.log('repo.is_main_repository type:', typeof repo.is_main_repository, 'value:', repo.is_main_repository)
  
  editingRepo.value = repo
  editRepoName.value = repo.name
  editRepoPath.value = repo.path
  editRepoTagPrefix.value = repo.tag_prefix || ''
  
  // Convert to boolean properly - handle both 0/1 and true/false
  // SQLite returns integers, so 1 = true, 0 = false
  editRepoIsMain.value = repo.is_main_repository === 1 || repo.is_main_repository === true
  
  console.log('Setting editRepoIsMain.value to:', editRepoIsMain.value)
  
  showEditDialog.value = true
}

const cancelEdit = () => {
  showEditDialog.value = false
  editingRepo.value = null
  editRepoName.value = ''
  editRepoPath.value = ''
  editRepoTagPrefix.value = ''
  editRepoIsMain.value = false
}

const selectEditRepoPath = async () => {
  try {
    const result = await window.electronAPI.openFolder()
    if (result.filePaths && result.filePaths.length > 0) {
      editRepoPath.value = result.filePaths[0]
    }
  } catch (error) {
    console.error('Error selecting folder:', error)
  }
}

const saveEditRepository = async () => {
  if (!editRepoName.value || !editRepoPath.value || !editingRepo.value) return
  
  try {
    // Check if it's a valid Git repository (only if path changed)
    if (editRepoPath.value !== editingRepo.value.path) {
      const validationResult = await window.electronAPI.gitValidateRepository(editRepoPath.value)
      if (!validationResult.success || !validationResult.data?.isValid) {
        alert('La carpeta seleccionada no es un repositorio Git válido')
        return
      }
    }
    
    const updates = {
      name: editRepoName.value,
      path: editRepoPath.value,
      tag_prefix: editRepoTagPrefix.value,
      is_main_repository: editRepoIsMain.value ? 1 : 0,
    }
    
    console.log('Updating repository:', editingRepo.value.id, 'with updates:', updates)
    console.log('Original is_main_repository:', editingRepo.value.is_main_repository)
    console.log('New is_main_repository:', updates.is_main_repository)
    
    await repositoriesStore.updateRepository(editingRepo.value.id, updates)
    
    // Always reload repositories to ensure UI is updated
    await repositoriesStore.loadRepositories()
    
    cancelEdit()
  } catch (error) {
    console.error('Error updating repository:', error)
    alert(`Error al actualizar el repositorio: ${error.message}`)
  }
}

const configureSecondaryRepos = async (repo) => {
  try {
    // Crear una copia simple del objeto repo para evitar problemas de reactividad
    selectedMainRepo.value = {
      id: repo.id,
      name: repo.name,
      path: repo.path,
      tag_prefix: repo.tag_prefix,
      is_main_repository: repo.is_main_repository
    }
    
    console.log('Configuring secondary repos for:', selectedMainRepo.value)
    
    // Obtener repositorios secundarios disponibles
    const availableResponse = await window.electronAPI.dbGetAvailableSecondaryRepositories(repo.id)
    if (availableResponse.success) {
      availableSecondaryRepos.value = availableResponse.data.repositories || []
      console.log('Available secondary repositories:', availableSecondaryRepos.value.length)
    } else {
      console.error('Error loading available secondary repositories:', availableResponse.error)
      availableSecondaryRepos.value = []
    }
    
    // Obtener repositorios secundarios actuales
    const currentResponse = await window.electronAPI.dbGetSecondaryRepositories(repo.id)
    if (currentResponse.success) {
      // Asegurar que son números simples
      selectedSecondaryRepoIds.value = (currentResponse.data.repositories || []).map(r => Number(r.id))
      console.log('Current secondary repository IDs:', selectedSecondaryRepoIds.value)
    } else {
      selectedSecondaryRepoIds.value = []
    }
    
    showConfigureSecondariesDialog.value = true
  } catch (error) {
    console.error('Error configuring secondary repositories:', error)
    alert(`Error configuring secondary repositories: ${error.message}`)
  }
}

const cancelConfigureSecondaries = () => {
  showConfigureSecondariesDialog.value = false
  selectedMainRepo.value = null
  availableSecondaryRepos.value = []
  selectedSecondaryRepoIds.value = []
}

const saveSecondaryRepos = async () => {
  try {
    if (!selectedMainRepo.value) return
    
    // Convertir a array plano para evitar problemas de clonación
    const secondaryIds = [...selectedSecondaryRepoIds.value].map(id => Number(id))
    const mainRepoId = Number(selectedMainRepo.value.id)
    
    console.log('Updating secondary repositories:', {
      mainRepoId,
      secondaryIds
    })
    
    const response = await window.electronAPI.dbUpdateSecondaryRepositories(
      mainRepoId, 
      secondaryIds
    )
    
    if (response.success) {
      console.log('✅ Secondary repositories updated successfully')
      cancelConfigureSecondaries()
    } else {
      console.error('❌ Error updating secondary repositories:', response.error)
      alert(`Error updating secondary repositories: ${response.error}`)
    }
  } catch (error) {
    console.error('❌ Error saving secondary repositories:', error)
    alert(`Error saving secondary repositories: ${error.message}`)
  }
}

const configureCodebaseHQ = (repo) => {
  selectedCodebaseRepo.value = { ...repo }
  editCodebaseEnabled.value = Boolean(repo.codebase_enabled)
  editCodebasePermalink.value = repo.codebase_repository_permalink || ''
  editCodebaseEnvironment.value = repo.codebase_environment || 'production'
  editCodebaseServers.value = repo.codebase_servers || ''
  showConfigureCodebaseDialog.value = true
}

const cancelConfigureCodebase = () => {
  showConfigureCodebaseDialog.value = false
  selectedCodebaseRepo.value = null
  editCodebaseEnabled.value = false
  editCodebasePermalink.value = ''
  editCodebaseEnvironment.value = ''
  editCodebaseServers.value = ''
  savingCodebase.value = false
}

const saveCodebaseConfig = async () => {
  if (!selectedCodebaseRepo.value) return
  
  savingCodebase.value = true
  
  try {
    const updates = {
      codebase_enabled: editCodebaseEnabled.value ? 1 : 0, // Convertir boolean a integer para SQLite
      codebase_repository_permalink: editCodebasePermalink.value,
      codebase_environment: editCodebaseEnvironment.value,
      codebase_servers: editCodebaseServers.value
    }
    
    console.log('Updating CodebaseHQ configuration for repo ID:', selectedCodebaseRepo.value.id)
    console.log('Updates:', updates)
    
    const response = await window.electronAPI.dbUpdateRepository(selectedCodebaseRepo.value.id, updates)
    
    console.log('Update response:', response)
    
    if (response.success) {
      console.log('✅ CodebaseHQ configuration updated successfully')
      
      // Actualizar el repositorio local
      await repositoriesStore.loadRepositories()
      cancelConfigureCodebase()
      
      // Usar notificación menos intrusiva
      console.log('✅ Configuración de CodebaseHQ actualizada exitosamente')
    } else {
      console.error('❌ Error updating CodebaseHQ configuration:', response.error)
      alert(`Error updating CodebaseHQ configuration: ${response.error}`)
    }
  } catch (error) {
    console.error('❌ Error saving CodebaseHQ configuration:', error)
    alert(`Error saving CodebaseHQ configuration: ${error.message}`)
  } finally {
    savingCodebase.value = false
  }
}

onMounted(async () => {
  // Load repositories and CodebaseHQ configuration
  await Promise.all([
    repositoriesStore.loadRepositories(),
    settingsStore.loadCodebaseConfig()
  ])
})
</script>

<style scoped>
.repository-card {
  transition: all 0.3s ease;
}

.repository-card:hover {
  transform: translateY(-2px);
}

.btn-add-repo {
  color: white !important;
}

.btn-add-repo:hover {
  color: white !important;
}

.btn-add-repo:disabled {
  color: white !important;
}
</style>