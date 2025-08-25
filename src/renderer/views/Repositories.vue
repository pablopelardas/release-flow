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
        </div>
        
        <div class="flex space-x-2 mt-4">
          <button 
            @click="openRepository(repo)" 
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm transition-colors"
          >
            Abrir
          </button>
          <button 
            @click="refreshRepository(repo)" 
            class="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-sm transition-colors"
          >
            Actualizar
          </button>
          <button 
            @click="removeRepository(repo)" 
            class="flex-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm transition-colors"
          >
            Eliminar
          </button>
        </div>
        
        <!-- Configure Secondary Repositories Button for Main Repositories -->
        <div v-if="repo.is_main_repository" class="mt-3">
          <button 
            @click="configureSecondaryRepos(repo)"
            class="w-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>⚙️</span>
            <span>Configurar Repos Secundarios</span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRepositoriesStore } from '../store'

// Store
const repositoriesStore = useRepositoriesStore()

// Reactive data
const showAddDialog = ref(false)
const newRepoPath = ref('')
const newRepoName = ref('')
const newRepoTagPrefix = ref('')
const newRepoIsMain = ref(false)

// Secondary repositories configuration
const showConfigureSecondariesDialog = ref(false)
const selectedMainRepo = ref(null)
const availableSecondaryRepos = ref([])
const selectedSecondaryRepoIds = ref([])

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
      is_main_repository: newRepoIsMain.value
    }

    await repositoriesStore.addRepository(repoData)

    // Reset form solo si fue exitoso
    newRepoPath.value = ''
    newRepoName.value = ''
    newRepoTagPrefix.value = ''
    newRepoIsMain.value = false
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

onMounted(async () => {
  await repositoriesStore.loadRepositories()
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