<template>
  <div class="space-y-6">
    <!-- Header with Add Repository Button -->
    <div class="flex justify-between items-center">
      <div>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          Gestiona múltiples repositorios Git para automatizar releases
        </p>
      </div>
      <Button 
        @click="showAddDialog = true" 
        icon="pi pi-plus" 
        label="Agregar Repositorio" 
        class="p-button-primary"
      />
    </div>

    <!-- Repository Cards Grid -->
    <div v-if="repositories.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card v-for="repo in repositories" :key="repo.id" class="repository-card">
        <template #header>
          <div class="flex items-center justify-between p-4 border-b">
            <div class="flex items-center space-x-3">
              <i class="pi pi-folder text-2xl text-primary-500"></i>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ repo.name }}</h3>
                <p class="text-sm text-gray-500">{{ repo.path }}</p>
              </div>
            </div>
            <Badge :value="repo.status" :severity="getStatusSeverity(repo.status)" />
          </div>
        </template>
        
        <template #content>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Rama actual:</span>
              <Tag :value="repo.currentBranch" icon="pi pi-code-branch" />
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Último tag:</span>
              <Tag :value="repo.lastTag || 'Sin tags'" severity="info" />
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Commits pendientes:</span>
              <Badge :value="repo.pendingCommits" severity="warning" />
            </div>
          </div>
        </template>
        
        <template #footer>
          <div class="flex space-x-2">
            <Button 
              @click="openRepository(repo)" 
              size="small" 
              outlined
              icon="pi pi-folder-open" 
              label="Abrir"
              title="Abrir carpeta en explorador"
            />
            <Button 
              @click="refreshRepository(repo)" 
              size="small" 
              outlined
              icon="pi pi-refresh" 
              label="Actualizar"
              title="Actualizar estado del repositorio"
            />
            <Button 
              @click="removeRepository(repo)" 
              size="small" 
              severity="danger"
              outlined
              icon="pi pi-trash"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <i class="pi pi-folder-open text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No hay repositorios configurados
      </h3>
      <p class="text-gray-500 mb-6">
        Agrega tu primer repositorio para comenzar a gestionar releases
      </p>
      <Button 
        @click="showAddDialog = true" 
        icon="pi pi-plus" 
        label="Agregar Repositorio"
        class="p-button-primary"
      />
    </div>

    <!-- Add Repository Dialog -->
    <Dialog 
      v-model:visible="showAddDialog" 
      modal 
      header="Agregar Repositorio" 
      :style="{ width: '450px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ruta del repositorio
          </label>
          <InputText 
            v-model="newRepoPath" 
            placeholder="Seleccionar carpeta..." 
            class="w-full" 
            readonly
          />
          <Button 
            @click="selectFolder" 
            class="mt-2" 
            outlined
            icon="pi pi-folder" 
            label="Examinar"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre (opcional)
          </label>
          <InputText 
            v-model="newRepoName" 
            placeholder="Nombre personalizado..." 
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showAddDialog = false" 
          label="Cancelar" 
          text 
        />
        <Button 
          @click="addRepository" 
          :disabled="!newRepoPath" 
          label="Agregar" 
          class="p-button-primary"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'

const repositories = ref([
  {
    id: 1,
    name: 'release-flow',
    path: '/home/user/projects/release-flow',
    status: 'active',
    currentBranch: 'main',
    lastTag: 'v1.0.0',
    pendingCommits: 5
  },
  {
    id: 2,
    name: 'my-app',
    path: '/home/user/projects/my-app',
    status: 'inactive',
    currentBranch: 'develop',
    lastTag: null,
    pendingCommits: 12
  }
])

const showAddDialog = ref(false)
const newRepoPath = ref('')
const newRepoName = ref('')

const getStatusSeverity = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'error': return 'danger'
    default: return 'info'
  }
}

const selectFolder = async () => {
  try {
    // Usar la API de Electron para seleccionar carpeta
    const result = await window.electronAPI?.openFolder?.()
    if (result && !result.canceled && result.filePaths?.length > 0) {
      newRepoPath.value = result.filePaths[0]
      // Auto-generar nombre basado en la carpeta seleccionada
      if (!newRepoName.value) {
        newRepoName.value = newRepoPath.value.split(/[/\\]/).pop() || ''
      }
    }
  } catch (error) {
    console.error('Error selecting folder:', error)
    // Fallback: permitir entrada manual
    const path = prompt('Ingresa la ruta del repositorio:')
    if (path) {
      newRepoPath.value = path
      if (!newRepoName.value) {
        newRepoName.value = path.split(/[/\\]/).pop() || ''
      }
    }
  }
}

const addRepository = () => {
  if (!newRepoPath.value) return
  
  const newRepo = {
    id: Date.now(),
    name: newRepoName.value || newRepoPath.value.split('/').pop(),
    path: newRepoPath.value,
    status: 'active',
    currentBranch: 'main',
    lastTag: null,
    pendingCommits: 0
  }
  
  repositories.value.push(newRepo)
  
  // Reset form
  newRepoPath.value = ''
  newRepoName.value = ''
  showAddDialog.value = false
}

const openRepository = async (repo) => {
  try {
    const result = await window.electronAPI?.showInExplorer?.(repo.path)
    if (!result?.success) {
      console.error('Error opening repository folder:', result?.error)
      // Fallback: mostrar la ruta en un alert
      alert(`Repositorio ubicado en: ${repo.path}`)
    }
  } catch (error) {
    console.error('Error opening repository:', error)
    alert(`No se pudo abrir la carpeta: ${repo.path}`)
  }
}

const refreshRepository = async (repo) => {
  console.log('Refreshing repository:', repo.name)
  // TODO: Implement repository refresh logic using GitService
  // Por ahora simulamos una actualización
  try {
    // Aquí podríamos llamar a window.electronAPI.gitStatus(repo.path)
    // y actualizar la información del repositorio
    
    // Simulación de actualización
    const repoIndex = repositories.value.findIndex(r => r.id === repo.id)
    if (repoIndex > -1) {
      // Simulamos cambios aleatorios para demostrar
      repositories.value[repoIndex] = {
        ...repo,
        pendingCommits: Math.floor(Math.random() * 20),
        status: Math.random() > 0.5 ? 'active' : 'inactive'
      }
    }
  } catch (error) {
    console.error('Error refreshing repository:', error)
  }
}

const removeRepository = (repo) => {
  const index = repositories.value.findIndex(r => r.id === repo.id)
  if (index > -1) {
    repositories.value.splice(index, 1)
  }
}

onMounted(() => {
  // TODO: Load repositories from store or service
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