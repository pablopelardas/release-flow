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
        class="bg-blue-600 hover:bg-blue-700 text-white dark:text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
      >
        <span>Agregar Repositorio</span>
      </button>
    </div>

    <!-- Repository Cards Grid -->
    <div v-if="repositories.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="repo in repositories" :key="repo.id" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow repository-card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ repo.name }}</h3>
              <p class="text-sm text-gray-500">{{ repo.path }}</p>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Rama actual:</span>
            <span class="text-sm text-gray-900 dark:text-white">{{ repo.current_branch }}</span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
            <span class="text-sm" :class="repo.is_clean ? 'text-green-600' : 'text-yellow-600'">
              {{ repo.is_clean ? 'Limpio' : 'Con cambios' }}
            </span>
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
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl text-gray-400 mb-4">📁</div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay repositorios</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-4">Comienza agregando tu primer repositorio Git</p>
      <button 
        @click="showAddDialog = true" 
        class="bg-blue-600 hover:bg-blue-700 text-white dark:text-white px-4 py-2 rounded-lg transition-colors"
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
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
          >
            Agregar
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
    }

    await repositoriesStore.addRepository(repoData)

    // Reset form solo si fue exitoso
    newRepoPath.value = ''
    newRepoName.value = ''
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
</style>