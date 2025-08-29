<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Changelog Completo
        </h1>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          Historial completo de versiones y cambios de tus repositorios
        </p>
      </div>
    </div>

    <!-- Repository Selection -->
    <Card class="w-full">
      <template #content>
        <div class="p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Seleccionar Repositorio
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Repository Dropdown -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repositorio
              </label>
              <select 
                v-model="selectedRepository" 
                @change="loadRepositoryChangelog"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecciona un repositorio...</option>
                <option 
                  v-for="repo in repositories" 
                  :key="repo.id" 
                  :value="repo.id"
                >
                  {{ repo.name }} {{ repo.is_main_repository ? '(Principal)' : '' }}
                </option>
              </select>
            </div>

            <!-- Current Branch Info -->
            <div v-if="selectedRepository">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rama Actual
              </label>
              <div class="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <i class="pi pi-code-branch text-green-500"></i>
                <span class="text-gray-900 dark:text-white font-medium">
                  {{ currentBranch || 'Cargando...' }}
                </span>
                <Button 
                  @click="refreshBranchInfo" 
                  icon="pi pi-refresh" 
                  size="small" 
                  text
                  :loading="loadingBranch"
                  class="ml-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
      <p class="text-gray-600 dark:text-gray-400">Cargando changelog...</p>
    </div>

    <!-- Error State -->
    <Card v-if="error && !loading" class="w-full">
      <template #content>
        <div class="p-6 text-center">
          <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error cargando changelog
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
          <Button 
            @click="loadRepositoryChangelog" 
            label="Reintentar" 
            icon="pi pi-refresh"
          />
        </div>
      </template>
    </Card>

    <!-- Changelog Content -->
    <div v-if="selectedRepository && !loading && !error" class="space-y-6">
      
      <!-- Repository Summary -->
      <Card class="w-full">
        <template #content>
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ repositories.find(r => r.id === selectedRepository)?.name || 'Repositorio' }}
              </h2>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Total de versiones: {{ releases.length }}
                </span>
                <span v-if="pendingChanges > 0" class="text-sm text-amber-600 dark:text-amber-400">
                  {{ pendingChanges }} cambios pendientes
                </span>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div class="flex items-center space-x-2">
                  <i class="pi pi-bookmark text-blue-600"></i>
                  <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Última Versión
                  </span>
                </div>
                <p class="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {{ lastVersion || 'Sin versiones' }}
                </p>
              </div>
              
              <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div class="flex items-center space-x-2">
                  <i class="pi pi-calendar text-green-600"></i>
                  <span class="text-sm font-medium text-green-800 dark:text-green-200">
                    Último Release
                  </span>
                </div>
                <p class="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
                  {{ lastReleaseDate || 'Nunca' }}
                </p>
              </div>
              
              <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div class="flex items-center space-x-2">
                  <i class="pi pi-users text-purple-600"></i>
                  <span class="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Colaboradores
                  </span>
                </div>
                <p class="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {{ allCollaborators.length }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pending Changes (if any) -->
      <Card v-if="pendingCommits.length > 0" class="w-full">
        <template #content>
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <i class="pi pi-clock text-amber-500 mr-2"></i>
                Cambios Pendientes
              </h3>
              <span class="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full text-sm">
                {{ pendingCommits.length }} commits desde {{ lastVersion || 'inicio' }}
              </span>
            </div>
            
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div 
                v-for="commit in pendingCommits" 
                :key="commit.hash"
                class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div class="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ commit.subject }}
                  </p>
                  <div class="flex items-center space-x-4 mt-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ commit.author }} • {{ formatDate(commit.date) }}
                    </span>
                    <span class="text-xs font-mono text-gray-400 dark:text-gray-500">
                      {{ commit.hash.substring(0, 7) }}
                    </span>
                    <span 
                      v-if="commit.type !== 'other'" 
                      :class="getCommitTypeClass(commit.type)"
                      class="px-2 py-0.5 rounded text-xs font-medium"
                    >
                      {{ commit.type }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Release History Timeline -->
      <Card class="w-full">
        <template #content>
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Historial de Versiones
              </h3>
              <div class="flex items-center space-x-2">
                <Button 
                  @click="exportChangelog" 
                  icon="pi pi-download" 
                  label="Exportar" 
                  size="small" 
                  outlined
                />
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="releases.length === 0" class="text-center py-8">
              <i class="pi pi-history text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600 dark:text-gray-400">
                Este repositorio no tiene releases registrados aún
              </p>
            </div>

            <!-- Timeline -->
            <div v-else class="relative">
              <!-- Timeline line -->
              <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>
              
              <div class="space-y-8">
                <div 
                  v-for="(release, index) in releases" 
                  :key="release.id"
                  class="relative flex items-start space-x-6"
                >
                  <!-- Timeline dot -->
                  <div class="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center relative z-10">
                    <i class="pi pi-tag text-white text-sm"></i>
                  </div>
                  
                  <!-- Release content -->
                  <div class="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                      <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                          {{ release.tag_name || `v${release.version}` }}
                        </h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          {{ formatDate(release.created_at) }}
                          <span v-if="release.collaborators && release.collaborators.length > 0" class="ml-2">
                            • 👥 {{ release.collaborators.join(', ') }}
                          </span>
                        </p>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span v-if="index === 0" class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
                          Más reciente
                        </span>
                        <Button 
                          @click="toggleReleaseExpansion(release, index)" 
                          :icon="expandedReleases.has(release.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" 
                          size="small" 
                          text
                          :loading="loadingCommits.has(release.id)"
                        />
                      </div>
                    </div>
                    
                    <!-- Release notes preview -->
                    <div class="prose dark:prose-invert max-w-none mb-4">
                      <div 
                        v-html="getFormattedReleaseNotes(release.content)" 
                        class="text-sm text-gray-700 dark:text-gray-300"
                      ></div>
                    </div>
                    
                    <!-- Expandable commits section -->
                    <div v-if="expandedReleases.has(release.id)" class="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div class="flex items-center justify-between mb-3">
                        <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                          Commits incluidos
                        </h5>
                        <span v-if="release.commits" class="text-xs text-gray-500 dark:text-gray-400">
                          {{ release.commits.length }} commits
                        </span>
                      </div>
                      
                      <!-- Loading state for commits -->
                      <div v-if="loadingCommits.has(release.id)" class="text-center py-4">
                        <i class="pi pi-spin pi-spinner text-lg text-primary-500"></i>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Cargando commits...</p>
                      </div>
                      
                      <!-- Commits list -->
                      <div v-else-if="release.commits && release.commits.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
                        <div 
                          v-for="commit in release.commits" 
                          :key="commit.hash"
                          class="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                        >
                          <div class="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5"></div>
                          <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-white font-medium">
                              {{ commit.subject }}
                            </p>
                            <div class="flex items-center space-x-3 mt-1">
                              <span class="text-xs text-gray-500 dark:text-gray-400">
                                {{ commit.author }} • {{ formatDate(commit.date) }}
                              </span>
                              <span class="text-xs font-mono text-gray-400 dark:text-gray-500">
                                {{ commit.hash.substring(0, 7) }}
                              </span>
                              <span 
                                v-if="commit.type !== 'other'" 
                                :class="getCommitTypeClass(commit.type)"
                                class="px-1.5 py-0.5 rounded text-xs font-medium"
                              >
                                {{ commit.type }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- No commits message -->
                      <div v-else-if="release.commitsLoaded" class="text-center py-4">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron commits para esta versión
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Secondary Repositories Changelogs -->
      <div v-if="secondaryRepos.length > 0" class="space-y-6">
        <Card 
          v-for="secondaryRepo in secondaryRepos" 
          :key="secondaryRepo.id" 
          class="w-full"
        >
          <template #content>
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ secondaryRepo.name }}
                  </h3>
                  <span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                    Repositorio Secundario
                  </span>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ secondaryChangelogs[secondaryRepo.id]?.releases?.length || 0 }} versiones sincronizadas
                </div>
              </div>

              <!-- Repository Info -->
              <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Path:</span>
                  <span class="font-mono text-gray-900 dark:text-white">{{ secondaryRepo.path }}</span>
                </div>
                <div v-if="secondaryChangelogs[secondaryRepo.id]?.currentBranch" class="flex items-center justify-between text-sm mt-2">
                  <span class="text-gray-600 dark:text-gray-400">Rama:</span>
                  <span class="font-mono text-gray-900 dark:text-white">{{ secondaryChangelogs[secondaryRepo.id].currentBranch }}</span>
                </div>
              </div>

              <!-- Error State -->
              <div v-if="secondaryChangelogs[secondaryRepo.id]?.error" class="text-center py-4">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                <p class="text-red-600 dark:text-red-400 text-sm">
                  Error: {{ secondaryChangelogs[secondaryRepo.id].error }}
                </p>
              </div>

              <!-- Empty State -->
              <div v-else-if="!secondaryChangelogs[secondaryRepo.id]?.releases?.length" class="text-center py-6">
                <i class="pi pi-history text-2xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  No se encontraron tags sincronizados en este repositorio
                </p>
              </div>

              <!-- Secondary Timeline -->
              <div v-else class="relative">
                <!-- Timeline line -->
                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-green-200 dark:bg-green-600"></div>
                
                <div class="space-y-6">
                  <div 
                    v-for="(release, index) in secondaryChangelogs[secondaryRepo.id].releases" 
                    :key="release.id"
                    class="relative flex items-start space-x-6"
                  >
                    <!-- Timeline dot -->
                    <div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center relative z-10">
                      <i class="pi pi-tag text-white text-xs"></i>
                    </div>
                    
                    <!-- Release content -->
                    <div class="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-600 rounded-lg p-6">
                      <div class="flex items-center justify-between mb-4">
                        <div>
                          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {{ release.tag_name || `v${release.version}` }}
                          </h4>
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ formatDate(release.created_at) }}
                            <span v-if="release.author" class="ml-2">
                              • 👤 {{ release.author }}
                            </span>
                          </p>
                        </div>
                        <div class="flex items-center space-x-2">
                          <span class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
                            Secundario
                          </span>
                          <Button 
                            @click="toggleSecondaryRelease(release, secondaryRepo)" 
                            :icon="expandedSecondaryReleases.has(`${secondaryRepo.id}-${release.id}`) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" 
                            size="small" 
                            text
                            :loading="loadingSecondaryCommits.has(`${secondaryRepo.id}-${release.id}`)"
                          />
                        </div>
                      </div>
                      
                      <!-- Release notes preview -->
                      <div class="prose dark:prose-invert max-w-none mb-4">
                        <div class="text-sm text-gray-700 dark:text-gray-300">
                          <p>Tag sincronizado desde repositorio principal <strong>{{ repositories.find(r => r.id === selectedRepository)?.name }}</strong></p>
                        </div>
                      </div>
                      
                      <!-- Expandable commits section -->
                      <div v-if="expandedSecondaryReleases.has(`${secondaryRepo.id}-${release.id}`)" class="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div class="flex items-center justify-between mb-3">
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            Commits en este repositorio
                          </h5>
                          <span v-if="release.commits" class="text-sm text-gray-500 dark:text-gray-400">
                            {{ release.commits.length }} commits
                          </span>
                        </div>

                        <!-- Loading commits -->
                        <div v-if="loadingSecondaryCommits.has(`${secondaryRepo.id}-${release.id}`)" class="text-center py-6">
                          <i class="pi pi-spin pi-spinner text-green-500 text-2xl mb-3"></i>
                          <p class="text-gray-600 dark:text-gray-400">
                            Cargando commits entre tags...
                          </p>
                        </div>

                        <!-- Commits list -->
                        <div v-else-if="release.commits && release.commits.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
                          <div 
                            v-for="commit in release.commits" 
                            :key="commit.hash"
                            class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-green-100 dark:border-green-800"
                          >
                            <div class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ commit.subject }}
                              </p>
                              <div class="flex items-center space-x-4 mt-1">
                                <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {{ commit.hash.substring(0, 7) }}
                                </span>
                                <span v-if="commit.author" class="text-xs text-gray-500 dark:text-gray-400">
                                  {{ commit.author }}
                                </span>
                                <span v-if="commit.date" class="text-xs text-gray-500 dark:text-gray-400">
                                  {{ formatDate(commit.date) }}
                                </span>
                                <span v-if="commit.type && commit.type !== 'other'" class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded">
                                  {{ commit.type }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- No commits message -->
                        <div v-else-if="release.commitsLoaded" class="text-center py-4">
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron commits para esta versión
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { useRepositoriesStore, useReleasesStore } from '../store'

// Toast - con manejo de error si no está disponible
let toast = null
try {
  toast = useToast()
} catch (error) {
  console.warn('Toast service not available, using console for notifications')
  toast = {
    add: (config) => {
      console.log(`[Toast ${config.severity}]:`, config.summary, config.detail)
    }
  }
}

const repositoriesStore = useRepositoriesStore()
const releasesStore = useReleasesStore()

// Reactive state
const selectedRepository = ref(null)
const loading = ref(false)
const loadingBranch = ref(false)
const error = ref(null)
const currentBranch = ref(null)
const releases = ref([])
const pendingCommits = ref([])
const expandedReleases = ref(new Set())
const loadingCommits = ref(new Set())
const secondaryRepos = ref([])
const secondaryChangelogs = ref({})
const expandedSecondaryReleases = ref(new Set())
const loadingSecondaryCommits = ref(new Set())

// Computed properties
const repositories = computed(() => repositoriesStore.repositories)
const pendingChanges = computed(() => pendingCommits.value.length)
const lastVersion = computed(() => {
  if (releases.value.length > 0) {
    return releases.value[0].tag_name || releases.value[0].version
  }
  return null
})
const lastReleaseDate = computed(() => {
  if (releases.value.length > 0) {
    return formatDate(releases.value[0].created_at)
  }
  return null
})
const allCollaborators = computed(() => {
  const collaborators = new Set()
  releases.value.forEach(release => {
    if (release.collaborators) {
      release.collaborators.forEach(collab => collaborators.add(collab))
    }
  })
  pendingCommits.value.forEach(commit => {
    if (commit.author && commit.author !== 'Unknown') {
      collaborators.add(commit.author)
    }
  })
  return Array.from(collaborators)
})

// Methods
const loadRepositoryChangelog = async () => {
  if (!selectedRepository.value) return

  loading.value = true
  error.value = null
  
  // Clear previous state
  expandedReleases.value.clear()
  loadingCommits.value.clear()
  expandedSecondaryReleases.value.clear()
  loadingSecondaryCommits.value.clear()
  secondaryRepos.value = []
  secondaryChangelogs.value = {}

  try {
    // Get repository details by ID
    const repo = repositories.value.find(r => r.id === selectedRepository.value)
    if (!repo) {
      throw new Error('Repositorio no encontrado')
    }
    
    console.log('🔄 Loading changelog for repository:', repo.name)
    
    // Load current branch
    await loadCurrentBranch()
    
    // Load releases from Git tags
    await loadReleasesFromTags()
    
    // Load pending commits
    await loadPendingCommits()
    
    // If it's a main repository, load secondary repositories and their changelogs
    if (repo.is_main_repository) {
      await loadSecondaryRepositoriesChangelogs()
    }
    
    console.log('✅ Changelog loaded successfully')
  } catch (err) {
    console.error('❌ Error loading changelog:', err)
    error.value = err.message || 'Error cargando el changelog'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar el changelog del repositorio',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const loadCurrentBranch = async () => {
  try {
    const repo = repositories.value.find(r => r.id === selectedRepository.value)
    if (!repo) throw new Error('Repositorio no encontrado')
    
    const response = await window.electronAPI.gitGetCurrentBranch(repo.path)
    if (response.success) {
      currentBranch.value = response.data.branch || response.data
    } else {
      throw new Error(response.error || 'Error obteniendo rama actual')
    }
  } catch (err) {
    console.error('Error loading current branch:', err)
    currentBranch.value = 'unknown'
  }
}

const loadReleasesFromTags = async () => {
  try {
    const repo = repositories.value.find(r => r.id === selectedRepository.value)
    if (!repo) throw new Error('Repositorio no encontrado')
    
    // Get all Git tags with details sorted by semver, filtered by prefix if exists
    const tagsResponse = await window.electronAPI.gitGetTagsWithDetails(repo.path, true, repo.tag_prefix)
    if (!tagsResponse.success) {
      throw new Error(tagsResponse.error || 'Error obteniendo tags de Git')
    }

    // The GitService returns an array of tag objects with details
    const tagDetails = tagsResponse.data || []
    console.log(`🏷️ Found ${tagDetails.length} tags in repository with prefix "${repo.tag_prefix || 'none'}":`, tagDetails)
    
    // Transform tag details into release-like objects
    releases.value = tagDetails.map(tag => ({
      id: tag.name,
      version: tag.name,
      tag_name: tag.name,
      created_at: tag.date,
      content: tag.message || 'Sin notas de release',
      collaborators: [],
      commits: [], // Will be loaded on demand
      commitsLoaded: false,
    }))
    
    console.log(`🏷️ Transformed into ${releases.value.length} release objects`)
    
  } catch (err) {
    console.error('Error loading releases from tags:', err)
    releases.value = []
  }
}

const loadPendingCommits = async () => {
  try {
    const repo = repositories.value.find(r => r.id === selectedRepository.value)
    if (!repo) throw new Error('Repositorio no encontrado')
    
    let commits = []
    
    if (releases.value.length > 0) {
      // Get commits since the most recent tag using the new optimized method
      console.log('📝 Getting commits since last tag...')
      
      // Get the latest tag to use as the base for comparison
      const latestTag = releases.value.length > 0 ? releases.value[0].tag_name : null
      const response = await window.electronAPI.gitGetCommitsBetweenTags(repo.path, latestTag, undefined)
      
      if (response.success && response.data?.commits) {
        commits = response.data.commits
        console.log(`📝 Found ${commits.length} commits since last tag with prefix "${repo.tag_prefix || 'none'}"`)
      } else {
        console.warn('No commits found since last tag or error occurred:', response.error)
      }
    } else {
      // If no tags exist, get all recent commits
      console.log('📝 No tags found, getting all recent commits...')
      const response = await window.electronAPI.gitGetCommits(repo.path, 50)
      if (response.success && response.data?.commits) {
        commits = response.data.commits
        console.log(`📝 Found ${commits.length} total commits`)
      }
    }
    
    pendingCommits.value = commits || []
    
  } catch (err) {
    console.error('Error loading pending commits:', err)
    pendingCommits.value = []
  }
}

const refreshBranchInfo = async () => {
  loadingBranch.value = true
  await loadCurrentBranch()
  loadingBranch.value = false
}


const toggleReleaseExpansion = async (release, index) => {
  const releaseId = release.id
  
  if (expandedReleases.value.has(releaseId)) {
    // Collapse
    expandedReleases.value.delete(releaseId)
  } else {
    // Expand and load commits if not already loaded
    expandedReleases.value.add(releaseId)
    
    if (!release.commitsLoaded) {
      await loadCommitsForRelease(release, index)
    }
  }
}

const loadCommitsForRelease = async (release, index) => {
  const repo = repositories.value.find(r => r.id === selectedRepository.value)
  if (!repo) return
  
  loadingCommits.value.add(release.id)
  
  try {
    // Determine the range: from previous tag to this tag
    const nextRelease = releases.value[index + 1] // Next release (older)
    const fromTag = nextRelease ? nextRelease.tag_name : undefined
    const toTag = release.tag_name
    
    console.log(`📝 Loading commits for release ${release.tag_name}, range: ${fromTag} to ${toTag}`)
    
    const response = await window.electronAPI.gitGetCommitsBetweenTags(repo.path, fromTag, toTag)
    
    if (response.success && response.data?.commits) {
      // Update the release object
      releases.value[index].commits = response.data.commits
      releases.value[index].commitsLoaded = true
      console.log(`📝 Loaded ${response.data.commits.length} commits for ${release.tag_name}`)
    } else {
      console.warn(`Failed to load commits for ${release.tag_name}:`, response.error)
    }
    
  } catch (err) {
    console.error(`Error loading commits for release ${release.tag_name}:`, err)
  } finally {
    loadingCommits.value.delete(release.id)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida'
  
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string received: "${dateString}"`)
    return `Fecha inválida`
  }
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCommitTypeClass = (type) => {
  const classes = {
    feat: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    fix: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    docs: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    chore: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    refactor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    perf: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    test: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  }
  return classes[type] || classes.chore
}

const getFormattedReleaseNotes = (content) => {
  if (!content) return '<p class="text-gray-500 italic">Sin notas de release</p>'
  
  // Truncate content for preview
  const maxLength = 300
  let preview = content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  
  // Basic HTML sanitization and formatting
  return preview
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
}

const exportChangelog = async () => {
  try {
    console.log('📄 Generating changelog content with all commits...')
    const changelogContent = await generateChangelogContent()
    
    const repo = repositories.value.find(r => r.id === selectedRepository.value)
    const repoName = repo?.name || 'repositorio'
    
    // Use Electron's save dialog
    const result = await window.electronAPI.showSaveDialog({
      title: 'Exportar Changelog',
      defaultPath: `${repoName}-changelog.md`,
      filters: [
        { name: 'Markdown files', extensions: ['md'] },
        { name: 'Text files', extensions: ['txt'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })
    
    if (!result.canceled) {
      await window.electronAPI.writeFile(result.filePath, changelogContent)
      toast.add({
        severity: 'success',
        summary: 'Exportado',
        detail: `Changelog exportado a ${result.filePath}`,
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error exporting changelog:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo exportar el changelog',
      life: 3000
    })
  }
}

const generateChangelogContent = async () => {
  const repo = repositories.value.find(r => r.id === selectedRepository.value)
  const repoName = repo?.name || 'Repositorio'
  
  let content = `# Changelog - ${repoName}\n\n`
  content += `*Generado el ${new Date().toLocaleDateString('es-ES')}*\n\n`
  
  // Add repository info
  if (repo?.is_main_repository && secondaryRepos.value.length > 0) {
    content += `## 📂 Repositorios incluidos en este changelog\n\n`
    content += `**Repositorio Principal:** ${repoName}\n`
    content += `**Repositorios Secundarios:**\n`
    secondaryRepos.value.forEach(secondaryRepo => {
      content += `- ${secondaryRepo.name} (${secondaryRepo.path})\n`
    })
    content += '\n'
  }
  
  if (pendingCommits.value.length > 0) {
    content += `## 🚧 Cambios Pendientes (${repoName})\n\n`
    pendingCommits.value.forEach(commit => {
      content += `- **${commit.subject}** (${commit.hash.substring(0, 7)}) - ${commit.author}\n`
    })
    content += '\n'
  }
  
  // Process each release and ensure its commits are loaded
  for (let index = 0; index < releases.value.length; index++) {
    const release = releases.value[index]
    
    content += `## ${release.tag_name || `v${release.version}`}\n`
    content += `*${formatDate(release.created_at)}*\n\n`
    
    if (release.content && release.content !== 'Sin notas de release') {
      // Strip HTML tags for markdown export
      const plainContent = release.content.replace(/<[^>]*>/g, '')
      content += `${plainContent}\n\n`
    }
    
    // Load commits for this release if not already loaded
    if (!release.commitsLoaded && repo) {
      try {
        const nextRelease = releases.value[index + 1]
        const fromTag = nextRelease ? nextRelease.tag_name : undefined
        const toTag = release.tag_name
        
        const response = await window.electronAPI.gitGetCommitsBetweenTags(repo.path, fromTag, toTag)
        if (response.success && response.data?.commits) {
          release.commits = response.data.commits
          release.commitsLoaded = true
        }
      } catch (err) {
        console.warn(`Could not load commits for ${release.tag_name}:`, err)
      }
    }
    
    // Add commits from main repository
    if (release.commits && release.commits.length > 0) {
      content += `### 📝 Commits en repositorio principal (${release.commits.length}):\n\n`
      release.commits.forEach(commit => {
        const typePrefix = commit.type !== 'other' ? `**${commit.type}**: ` : ''
        content += `- ${typePrefix}${commit.subject} (${commit.hash.substring(0, 7)}) - ${commit.author}\n`
      })
      content += '\n'
    }
    
    // Add commits from secondary repositories
    if (secondaryRepos.value.length > 0) {
      for (const secondaryRepo of secondaryRepos.value) {
        const secondaryChangelog = secondaryChangelogs.value[secondaryRepo.id]
        if (!secondaryChangelog) continue
        
        // Find the corresponding release in the secondary repo
        const secondaryRelease = secondaryChangelog.releases.find(r => r.tag_name === release.tag_name)
        if (!secondaryRelease) continue
        
        // Load commits for this secondary release if not already loaded
        if (!secondaryRelease.commitsLoaded) {
          try {
            const secondaryReleases = secondaryChangelog.releases
            const currentIndex = secondaryReleases.findIndex(r => r.id === secondaryRelease.id)
            const nextSecondaryRelease = secondaryReleases[currentIndex + 1]
            
            const fromTag = nextSecondaryRelease ? nextSecondaryRelease.tag_name : undefined
            const toTag = secondaryRelease.tag_name
            
            const response = await window.electronAPI.gitGetCommitsBetweenTags(
              secondaryRepo.path, 
              fromTag, 
              toTag
            )
            
            if (response.success && response.data?.commits) {
              secondaryRelease.commits = response.data.commits
              secondaryRelease.commitsLoaded = true
            }
          } catch (err) {
            console.warn(`Could not load commits for secondary ${secondaryRepo.name} ${secondaryRelease.tag_name}:`, err)
          }
        }
        
        // Add secondary repository commits if available
        if (secondaryRelease.commits && secondaryRelease.commits.length > 0) {
          content += `### 🔗 Commits en repositorio secundario "${secondaryRepo.name}" (${secondaryRelease.commits.length}):\n\n`
          secondaryRelease.commits.forEach(commit => {
            const typePrefix = commit.type !== 'other' ? `**${commit.type}**: ` : ''
            content += `- ${typePrefix}${commit.subject} (${commit.hash.substring(0, 7)}) - ${commit.author}\n`
          })
          content += '\n'
        } else {
          content += `### 🔗 Repositorio secundario "${secondaryRepo.name}": Sin commits específicos\n\n`
        }
      }
    }
    
    content += '---\n\n'
  }
  
  return content
}

const loadSecondaryCommitsForRelease = async (release, secondaryRepo) => {
  const releaseKey = `${secondaryRepo.id}-${release.id}`
  
  if (loadingSecondaryCommits.value.has(releaseKey) || release.commitsLoaded) {
    return
  }

  loadingSecondaryCommits.value.add(releaseKey)
  
  try {
    console.log(`🔄 Loading commits for secondary release: ${release.tag_name} in ${secondaryRepo.name}`)
    
    // Find the previous release to determine the commit range
    const secondaryChangelog = secondaryChangelogs.value[secondaryRepo.id]
    if (!secondaryChangelog) return
    
    const releases = secondaryChangelog.releases
    const currentIndex = releases.findIndex(r => r.id === release.id)
    const nextRelease = releases[currentIndex + 1]
    
    const fromTag = nextRelease ? nextRelease.tag_name : undefined
    const toTag = release.tag_name
    
    console.log(`📊 Getting commits between ${fromTag || 'start'} and ${toTag} for secondary repo`)
    
    const response = await window.electronAPI.gitGetCommitsBetweenTags(
      secondaryRepo.path, 
      fromTag, 
      toTag
    )
    
    if (response.success && response.data?.commits) {
      // Update the release object in the secondary changelog
      release.commits = response.data.commits
      release.commitsLoaded = true
      
      console.log(`✅ Loaded ${response.data.commits.length} commits for ${release.tag_name}`)
    } else {
      console.warn(`No commits found for ${release.tag_name}:`, response.error)
      release.commits = []
      release.commitsLoaded = true
    }
  } catch (err) {
    console.error(`Error loading commits for secondary release ${release.tag_name}:`, err)
    release.commits = []
    release.commitsLoaded = true
  } finally {
    loadingSecondaryCommits.value.delete(releaseKey)
  }
}

const toggleSecondaryRelease = async (release, secondaryRepo) => {
  const releaseKey = `${secondaryRepo.id}-${release.id}`
  
  if (expandedSecondaryReleases.value.has(releaseKey)) {
    expandedSecondaryReleases.value.delete(releaseKey)
  } else {
    expandedSecondaryReleases.value.add(releaseKey)
    
    // Load commits if not already loaded
    if (!release.commitsLoaded) {
      await loadSecondaryCommitsForRelease(release, secondaryRepo)
    }
  }
}

const loadSecondaryRepositoriesChangelogs = async () => {
  try {
    const mainRepo = repositories.value.find(r => r.id === selectedRepository.value)
    if (!mainRepo || !mainRepo.is_main_repository) return
    
    console.log('🔗 Loading secondary repositories for:', mainRepo.name)
    
    // Get secondary repositories
    const response = await window.electronAPI.dbGetSecondaryRepositories(mainRepo.id)
    if (!response.success) {
      console.warn('No secondary repositories found or error:', response.error)
      return
    }
    
    const secondaryRepoIds = (response.data.repositories || []).map(r => r.id)
    if (secondaryRepoIds.length === 0) {
      console.log('No secondary repositories configured')
      return
    }
    
    // Get full repository objects
    secondaryRepos.value = repositories.value.filter(repo => 
      secondaryRepoIds.includes(repo.id)
    )
    
    console.log(`📂 Found ${secondaryRepos.value.length} secondary repositories:`, 
      secondaryRepos.value.map(r => r.name))
    
    // Load changelog for each secondary repository
    for (const secondaryRepo of secondaryRepos.value) {
      try {
        console.log(`🔄 Loading changelog for secondary repo: ${secondaryRepo.name}`)
        
        const changelog = {
          repo: secondaryRepo,
          releases: [],
          pendingCommits: [],
          currentBranch: null,
          error: null
        }
        
        // Load releases from tags with the main repository's prefix
        const tagsResponse = await window.electronAPI.gitGetTagsWithDetails(
          secondaryRepo.path, 
          true, 
          mainRepo.tag_prefix // Use main repo's prefix!
        )
        
        if (tagsResponse.success) {
          const tagDetails = tagsResponse.data || []
          console.log(`🏷️ Found ${tagDetails.length} tags in secondary repo ${secondaryRepo.name} with main prefix "${mainRepo.tag_prefix}"`)
          
          // Transform tags to releases
          changelog.releases = tagDetails.map(tag => ({
            id: `${secondaryRepo.id}-${tag.name}`,
            tag_name: tag.name,
            version: tag.name.replace(mainRepo.tag_prefix || '', ''),
            created_at: tag.date,
            author: tag.author,
            content: `Release ${tag.name} en repositorio secundario ${secondaryRepo.name}`,
            repository_name: secondaryRepo.name,
            repository_id: secondaryRepo.id,
            isSecondary: true
          }))
        } else {
          console.warn(`Error loading tags for secondary repo ${secondaryRepo.name}:`, tagsResponse.error)
          changelog.error = tagsResponse.error
        }
        
        // Get current branch
        try {
          const branchResponse = await window.electronAPI.gitGetCurrentBranch(secondaryRepo.path)
          if (branchResponse.success) {
            changelog.currentBranch = branchResponse.data.branch || branchResponse.data
          }
        } catch (err) {
          console.warn(`Could not get current branch for ${secondaryRepo.name}:`, err)
          changelog.currentBranch = 'unknown'
        }
        
        secondaryChangelogs.value[secondaryRepo.id] = changelog
        
      } catch (err) {
        console.error(`Error loading changelog for secondary repo ${secondaryRepo.name}:`, err)
        secondaryChangelogs.value[secondaryRepo.id] = {
          repo: secondaryRepo,
          releases: [],
          pendingCommits: [],
          currentBranch: null,
          error: err.message
        }
      }
    }
    
    console.log('✅ Secondary repositories changelogs loaded')
    
  } catch (err) {
    console.error('Error loading secondary repositories changelogs:', err)
  }
}

// Lifecycle
onMounted(async () => {
  await repositoriesStore.loadRepositories()
})
</script>