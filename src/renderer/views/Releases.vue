<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Generación de Releases
        </h1>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          Crea releases automáticos con templates personalizados y versionado semántico
        </p>
      </div>
      <div class="flex space-x-3">
        <Button 
          @click="startNewRelease" 
          icon="pi pi-plus" 
          label="Nuevo Release" 
          size="large"
        />
        <Button 
          @click="showReleaseHistory" 
          icon="pi pi-history" 
          label="Historial" 
          outlined
          size="large"
        />
      </div>
    </div>

    <!-- Release Wizard -->
    <Card v-if="showWizard" class="w-full">
      <template #content>
        <div class="p-6">
          <!-- Steps Progress -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Wizard de Release - Paso {{ currentStep }} de {{ totalSteps }}
              </h2>
              <Button 
                @click="cancelWizard" 
                icon="pi pi-times" 
                text 
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              />
            </div>
            
            <!-- Progress Bar -->
            <ProgressBar 
              :value="(currentStep / totalSteps) * 100" 
              class="mb-4"
              :showValue="false"
            />
            
            <!-- Steps Indicators -->
            <div class="flex justify-between">
              <div 
                v-for="(step, index) in steps" 
                :key="index"
                class="flex flex-col items-center"
                :class="{ 'opacity-50': index + 1 > currentStep }"
              >
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2"
                  :class="index + 1 <= currentStep ? 
                    'bg-primary-500 text-white' : 
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                >
                  <i v-if="index + 1 < currentStep" class="pi pi-check text-xs"></i>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {{ step.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Step Content -->
          <div class="min-h-96">
            <!-- Step 1: Repository Selection -->
            <div v-if="currentStep === 1" class="space-y-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <i class="pi pi-folder mr-2 text-blue-500"></i>
                Selecciona el Repositorio Principal
              </h3>
              
              <div v-if="repositories.length" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  💡 Solo se muestran repositorios principales. Los tags se replicarán automáticamente en sus repositorios secundarios asociados.
                </p>
              </div>
              
              <div v-if="!repositories.length" class="text-center py-8">
                <i class="pi pi-folder-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  No hay repositorios principales configurados
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Solo los repositorios marcados como "principales" pueden generar releases
                </p>
                <Button 
                  @click="$router.push('/repositories')" 
                  label="Configurar Repositorios" 
                  outlined
                />
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  v-for="repo in repositories" 
                  :key="repo.id"
                  class="cursor-pointer border-2 transition-all duration-200"
                  :class="selectedRepository?.id === repo.id ? 
                    'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
                    'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                  @click="selectRepository(repo)"
                >
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">
                          {{ repo.name }}
                        </h4>
                        <div 
                          class="w-3 h-3 rounded-full"
                          :class="repo.status === 'clean' ? 'bg-green-500' : 'bg-yellow-500'"
                        ></div>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {{ repo.path }}
                      </p>
                      <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          <i class="pi pi-git-pull-request mr-1"></i>
                          {{ repo.branch }}
                        </span>
                        <span>
                          <i class="pi pi-clock mr-1"></i>
                          {{ repo.lastCommit }}
                        </span>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>

            <!-- Step 2: Version Configuration -->
            <div v-if="currentStep === 2" class="space-y-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  <i class="pi pi-tag mr-2 text-green-500"></i>
                  Configuración de Versión
                </h3>
                <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Tag actual:</span>
                  <span class="font-mono font-semibold text-gray-900 dark:text-white ml-2">{{ (selectedRepository?.tag_prefix || '') + currentVersion }}</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <!-- Major (primero - mayor impacto) -->
                <Card 
                  class="cursor-pointer border-2 transition-all"
                  :class="versionType === 'major' ? 
                    'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
                    'border-transparent hover:border-gray-300'"
                  @click="versionType = 'major'"
                >
                  <template #content>
                    <div class="p-4 text-center">
                      <i class="pi pi-exclamation-triangle text-2xl text-red-500 mb-2"></i>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-1">Major</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Cambios que rompen compatibilidad
                      </p>
                      <div class="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded">
                        {{ (selectedRepository?.tag_prefix || '') + currentVersion }} → {{ getVersionPreview('major') }}
                      </div>
                    </div>
                  </template>
                </Card>

                <!-- Minor (segundo - características nuevas) -->
                <Card 
                  class="cursor-pointer border-2 transition-all"
                  :class="versionType === 'minor' ? 
                    'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
                    'border-transparent hover:border-gray-300'"
                  @click="versionType = 'minor'"
                >
                  <template #content>
                    <div class="p-4 text-center">
                      <i class="pi pi-plus-circle text-2xl text-green-500 mb-2"></i>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-1">Minor</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Nuevas características compatibles
                      </p>
                      <div class="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded">
                        {{ (selectedRepository?.tag_prefix || '') + currentVersion }} → {{ getVersionPreview('minor') }}
                      </div>
                    </div>
                  </template>
                </Card>

                <!-- Patch (tercero - menor impacto) -->
                <Card 
                  class="cursor-pointer border-2 transition-all"
                  :class="versionType === 'patch' ? 
                    'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
                    'border-transparent hover:border-gray-300'"
                  @click="versionType = 'patch'"
                >
                  <template #content>
                    <div class="p-4 text-center">
                      <i class="pi pi-wrench text-2xl text-blue-500 mb-2"></i>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-1">Patch</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Correcciones y mejoras menores
                      </p>
                      <div class="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded">
                        {{ (selectedRepository?.tag_prefix || '') + currentVersion }} → {{ getVersionPreview('patch') }}
                      </div>
                    </div>
                  </template>
                </Card>
              </div>

              <!-- Custom Version Input -->
              <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div class="flex items-center mb-3">
                  <Checkbox v-model="useCustomVersion" :binary="true" />
                  <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usar versión personalizada
                  </label>
                </div>
                <div v-if="useCustomVersion" class="flex">
                  <span class="flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 font-mono">
                    {{ selectedRepository?.tag_prefix || '' }}
                  </span>
                  <InputText 
                    v-model="customVersion"
                    placeholder="2.1.0-beta.1"
                    class="rounded-l-none flex-1"
                  />
                </div>
              </div>
            </div>

            <!-- Step 3: Template Selection -->
            <div v-if="currentStep === 3" class="space-y-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <i class="pi pi-file-edit mr-2 text-purple-500"></i>
                Selecciona el Template
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  v-for="template in availableTemplates" 
                  :key="template.id"
                  class="cursor-pointer border-2 transition-all"
                  :class="selectedTemplate?.id === template.id ? 
                    'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
                    'border-transparent hover:border-gray-300'"
                  @click="selectTemplate(template)"
                >
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">
                          {{ template.name }}
                        </h4>
                        <Button 
                          @click.stop="previewTemplate(template)" 
                          icon="pi pi-eye" 
                          size="small" 
                          text
                        />
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ template.description }}
                      </p>
                    </div>
                  </template>
                </Card>
              </div>

              <div class="text-center">
                <Button 
                  @click="$router.push('/templates')" 
                  label="Crear Nuevo Template" 
                  outlined 
                  icon="pi pi-plus"
                />
              </div>
            </div>

            <!-- Step 4: Preview and Confirmation -->
            <div v-if="currentStep === 4" class="space-y-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <i class="pi pi-eye mr-2 text-indigo-500"></i>
                Vista Previa del Release
              </h3>

              <!-- Release Summary -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div class="flex items-center mb-2">
                    <i class="pi pi-folder text-blue-500 mr-2"></i>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Repositorio</span>
                  </div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ selectedRepository?.name }}</p>
                </div>

                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div class="flex items-center mb-2">
                    <i class="pi pi-tag text-green-500 mr-2"></i>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Versión</span>
                  </div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ (selectedRepository?.tag_prefix || '') + getFinalVersion() }}</p>
                </div>

                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div class="flex items-center mb-2">
                    <i class="pi pi-file-edit text-purple-500 mr-2"></i>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Template</span>
                  </div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ selectedTemplate?.name }}</p>
                </div>
              </div>


              <!-- Repository Validation -->
              <div v-if="repositoryValidation.errors.length > 0 || repositoryValidation.warnings.length > 0" class="space-y-3">
                <!-- Errors -->
                <div v-if="repositoryValidation.errors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 class="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                    <i class="pi pi-exclamation-triangle mr-2"></i>
                    Errores del Repositorio
                  </h4>
                  <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li v-for="error in repositoryValidation.errors" :key="error" class="flex items-start">
                      <i class="pi pi-times-circle mr-2 mt-0.5 text-red-500"></i>
                      {{ error }}
                    </li>
                  </ul>
                  <p class="text-xs text-red-600 dark:text-red-400 mt-2">
                    ⚠️ No se puede crear el release hasta resolver estos errores
                  </p>
                </div>

                <!-- Warnings -->
                <div v-if="repositoryValidation.warnings.length > 0" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
                    <i class="pi pi-exclamation-triangle mr-2"></i>
                    Advertencias del Repositorio
                  </h4>
                  <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li v-for="warning in repositoryValidation.warnings" :key="warning" class="flex items-start">
                      <i class="pi pi-info-circle mr-2 mt-0.5 text-yellow-500"></i>
                      {{ warning }}
                    </li>
                  </ul>
                  <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    ℹ️ Se recomienda resolver estas advertencias antes del release
                  </p>
                </div>
              </div>

              <!-- Generated Content Preview -->
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
                  Release Notes Generados:
                </h4>
                <div 
                  class="prose prose-sm dark:prose-invert max-w-none"
                  v-html="generatedPreview"
                ></div>
              </div>

              <!-- Secondary Repositories Info -->
              <div v-if="selectedRepository?.is_main_repository && createTag" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 class="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                  <i class="pi pi-link mr-2"></i>
                  Replicación de Tags
                </h4>
                <p class="text-sm text-green-700 dark:text-green-300">
                  El tag <code>{{ selectedRepository?.tag_prefix || '' }}{{ getFinalVersion() }}</code> se creará también en los repositorios secundarios asociados.
                </p>
                <p v-if="secondaryReposInfo" class="text-xs text-green-600 dark:text-green-400 mt-2" v-html="secondaryReposInfo"></p>
              </div>

              <!-- Options -->
              <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <!-- Tag creation is mandatory -->
                <div class="flex items-center text-green-700 dark:text-green-300">
                  <i class="pi pi-check-circle mr-2 text-green-500"></i>
                  <span class="text-sm font-medium">
                    Se creará tag de Git automáticamente: <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">{{ (selectedRepository?.tag_prefix || '') + getFinalVersion() }}</code>
                  </span>
                </div>
                
                <div class="flex items-center">
                  <Checkbox v-model="pushTags" :binary="true" />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    <i class="pi pi-upload mr-1 text-blue-500"></i>
                    Hacer push automático de tags al repositorio remoto
                  </label>
                </div>
                
                <!-- Integration Options -->
                <div v-if="integrationsStatus.codebase.enabled" class="flex items-center">
                  <Checkbox v-model="createCodebaseDeployment" :binary="true" />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    <i class="pi pi-box mr-1 text-purple-500"></i>
                    Crear deployment en CodebaseHQ
                  </label>
                </div>
                
                <div v-if="integrationsStatus.jira.enabled" class="flex items-center">
                  <Checkbox v-model="createJiraRelease" :binary="true" />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    <i class="pi pi-sitemap mr-1 text-blue-500"></i>
                    Crear release en JIRA
                  </label>
                </div>
                
                <div class="flex items-center">
                  <Checkbox v-model="saveToFile" :binary="true" />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    <i class="pi pi-file mr-1 text-gray-500"></i>
                    Guardar release notes en archivo
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              v-if="currentStep > 1"
              @click="previousStep" 
              label="Anterior" 
              outlined 
              icon="pi pi-chevron-left"
            />
            <div v-else></div>

            <div class="flex space-x-3">
              <Button 
                v-if="currentStep < totalSteps"
                @click="nextStep" 
                label="Siguiente" 
                :disabled="!canProceed"
                icon="pi pi-chevron-right"
                iconPos="right"
              />
              <Button 
                v-else
                @click="generateRelease" 
                label="Generar Release" 
                :disabled="!canProceed"
                icon="pi pi-send"
                :loading="generatingRelease"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Recent Releases -->
    <Card v-if="!showWizard">
      <template #header>
        <div class="p-6 pb-0">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Releases Recientes
          </h2>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-4">
          <div v-if="!recentReleases.length" class="text-center py-8">
            <i class="pi pi-send text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              No hay releases generados aún
            </p>
            <Button 
              @click="startNewRelease" 
              label="Crear Primer Release" 
              icon="pi pi-plus"
            />
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="release in recentReleases" 
              :key="release.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <i class="pi pi-tag text-primary-600 dark:text-primary-400 text-sm"></i>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ release.version }} - {{ release.repository }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ new Date(release.date).toLocaleDateString('es-ES') }} • {{ release.template }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <Button 
                  @click="viewRelease(release)" 
                  icon="pi pi-eye" 
                  size="small" 
                  text
                />
                <Button 
                  @click="downloadRelease(release)" 
                  icon="pi pi-download" 
                  size="small" 
                  text
                />
                <Button 
                  @click="deployToCodebaseHQ(release)" 
                  icon="pi pi-cloud-upload" 
                  size="small" 
                  text
                  class="text-purple-600 hover:text-purple-700"
                  v-tooltip.top="'Deploy to CodebaseHQ'"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import { useRepositoriesStore, useTemplatesStore, useReleasesStore } from '../store'

const router = useRouter()

// Stores
const repositoriesStore = useRepositoriesStore()
const templatesStore = useTemplatesStore()
const releasesStore = useReleasesStore()

// Wizard State
const showWizard = ref(false)
const currentStep = ref(1)
const totalSteps = ref(4)
const generatingRelease = ref(false)

// Steps Configuration
const steps = [
  { label: 'Repositorio', icon: 'pi-folder' },
  { label: 'Versión', icon: 'pi-tag' },
  { label: 'Template', icon: 'pi-file-edit' },
  { label: 'Confirmar', icon: 'pi-check' }
]

// Step 1: Repository data - mostrar solo repositorios principales
const repositories = computed(() => {
  const allRepos = repositoriesStore.repositories
  const mainRepos = allRepos.filter(repo => {
    // Convertir a número y comprobar si es truthy (1, true, etc.)
    const value = repo.is_main_repository
    const isMain = !!value && value != 0
    return isMain
  })
  
  return mainRepos
})
const selectedRepository = ref(null)

// Step 2: Version data
const versionType = ref('minor')
const useCustomVersion = ref(false)
const customVersion = ref('')
const currentVersion = ref('1.0.0')

// Step 3: Template data - usar store real
const availableTemplates = computed(() => templatesStore.templates)
const selectedTemplate = ref(null)

// Step 4: Preview and options
const generatedPreview = ref('')
const createTag = ref(true) // Always true, no longer a checkbox
const pushTags = ref(true) // Default enabled
const saveToFile = ref(false) // Default disabled
const createCodebaseDeployment = ref(true) // Default enabled
const createJiraRelease = ref(false) // Will be set based on JIRA enabled status

// Recent releases - usar store real
const recentReleases = computed(() => releasesStore.releases)

// Información de repositorios secundarios
const secondaryReposInfo = ref('')

// Estado de integraciones
const integrationsStatus = ref({
  codebase: { enabled: false, status: 'unknown' },
  jira: { enabled: false, status: 'unknown' }
})

// Validación del repositorio
const repositoryValidation = ref({
  isValid: true,
  warnings: [],
  errors: [],
  status: null
})

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedRepository.value !== null
    case 2:
      return versionType.value || (useCustomVersion.value && customVersion.value)
    case 3:
      return selectedTemplate.value !== null
    case 4:
      return repositoryValidation.value.isValid
    default:
      return false
  }
})

// Methods
const startNewRelease = async () => {
  showWizard.value = true
  currentStep.value = 1
  resetWizardData()
}

const cancelWizard = () => {
  showWizard.value = false
  resetWizardData()
}

const resetWizardData = () => {
  selectedRepository.value = null
  versionType.value = 'minor'
  useCustomVersion.value = false
  customVersion.value = ''
  selectedTemplate.value = null
  generatedPreview.value = ''
  createTag.value = true
  pushTags.value = true // Default enabled
  saveToFile.value = false // Default disabled  
  createCodebaseDeployment.value = false // Will be set by loadIntegrationsStatus
  createJiraRelease.value = false // Will be set by loadIntegrationsStatus
  repositoryValidation.value = {
    isValid: true,
    warnings: [],
    errors: [],
    status: null
  }
}

const nextStep = () => {
  if (currentStep.value < totalSteps.value && canProceed.value) {
    currentStep.value++
    
    // Generate preview when entering step 4
    if (currentStep.value === 4) {
      generatePreview()
      loadSecondaryReposInfo()
      validateRepositoryForRelease()
      loadIntegrationsStatus() // Recargar integraciones con el repo seleccionado
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const selectRepository = async (repo) => {
  selectedRepository.value = repo
  
  // Obtener la versión actual del repositorio desde Git (último tag)
  try {
    console.log(`🔍 Obteniendo tags para repo: ${repo.name} en path: ${repo.path}`)
    const tagsResponse = await window.electronAPI.gitGetTags(repo.path, true)
    console.log('📋 Tags response:', tagsResponse)
    
    if (tagsResponse.success && tagsResponse.data && tagsResponse.data.length > 0) {
      // getTags devuelve array de strings directamente, no objetos con .name
      const rawTag = tagsResponse.data[0]
      
      // Remover prefijos, incluido el prefijo específico del repositorio si existe
      let latestTag = rawTag
      if (repo.tag_prefix && rawTag.startsWith(repo.tag_prefix)) {
        latestTag = rawTag.substring(repo.tag_prefix.length)
      } else {
        // Fallback para prefijos comunes
        latestTag = rawTag.replace(/^v|^[A-Za-z]+v?/, '')
      }
      
      currentVersion.value = latestTag
      console.log(`✅ Version actual del repo ${repo.name}: ${currentVersion.value}`)
      console.log('🏷️ Latest tag raw:', rawTag)
      console.log('🏷️ Tag prefix:', repo.tag_prefix || 'none')
      console.log('🔄 Preview versions:', {
        major: getVersionPreview('major'),
        minor: getVersionPreview('minor'), 
        patch: getVersionPreview('patch')
      })
    } else {
      currentVersion.value = '0.0.0' // Si no hay tags, empezar desde 0.0.0
      console.log(`⚠️ No hay tags en ${repo.name}, usando version inicial: ${currentVersion.value}`)
    }
  } catch (error) {
    console.error('Error obteniendo versión del repositorio:', error)
    currentVersion.value = repo.currentVersion || '1.0.0'
  }
}

const getVersionPreview = (type) => {
  if (!currentVersion.value) return '1.0.0'
  
  // Usar currentVersion que se actualiza con el último tag de Git
  const [major, minor, patch] = currentVersion.value.split('.').map(Number)
  
  let nextVersion
  switch (type) {
    case 'major':
      nextVersion = `${major + 1}.0.0`
      break
    case 'minor':
      nextVersion = `${major}.${minor + 1}.0`
      break
    case 'patch':
      nextVersion = `${major}.${minor}.${patch + 1}`
      break
    default:
      nextVersion = currentVersion.value
  }
  
  // Mostrar con el prefijo si hay un repositorio seleccionado
  const prefix = selectedRepository.value?.tag_prefix || ''
  return `${prefix}${nextVersion}`
}

const getVersionNumber = (type) => {
  if (!currentVersion.value) return '1.0.0'
  
  // Usar currentVersion que se actualiza con el último tag de Git
  const [major, minor, patch] = currentVersion.value.split('.').map(Number)
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      return currentVersion.value
  }
}

const getFinalVersion = () => {
  if (useCustomVersion.value && customVersion.value) {
    return customVersion.value
  }
  return getVersionNumber(versionType.value)
}

const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const previewTemplate = (template) => {
  console.log('Preview template:', template.name)
}

const generatePreview = async () => {
  if (!selectedTemplate.value || !selectedRepository.value) return
  
  try {
    console.log('Generating preview for repository:', selectedRepository.value.path)
    
    let templateData
    let renderResponse
    
    // Check if this is a main repository with secondary repositories
    if (selectedRepository.value.is_main_repository) {
      console.log('🔗 Checking for secondary repositories...')
      
      // Get secondary repositories
      const secondaryResponse = await window.electronAPI.dbGetSecondaryRepositories(selectedRepository.value.id)
      
      if (secondaryResponse.success && secondaryResponse.data.repositories.length > 0) {
        console.log(`📦 Found ${secondaryResponse.data.repositories.length} secondary repositories - generating unified changelog`)
        
        // Generate unified changelog using the selected template for all repositories
        renderResponse = await generateUnifiedChangelogWithTemplate(secondaryResponse.data.repositories)
        
      } else {
        console.log('ℹ️ No secondary repositories found, falling back to single repository mode')
        // Fall back to single repository mode
        return await generateSingleRepositoryPreview()
      }
    } else {
      // Single repository mode
      return await generateSingleRepositoryPreview()
    }
    
    if (renderResponse) {
      // Convert Markdown to HTML
      generatedPreview.value = `<div class="space-y-4">${convertMarkdownToHtml(renderResponse)}</div>`
    } else {
      generatedPreview.value = 'Error generando preview'
    }
    
  } catch (error) {
    console.error('Error generating preview:', error)
    generatedPreview.value = `<div class="text-red-600">Error generando preview: ${error.message}</div>`
  }
}

const generateUnifiedChangelogWithTemplate = async (secondaryRepositories) => {
  try {
    console.log('🔄 Generating unified changelog with template:', selectedTemplate.value.name)
    
    // Generate changelog for main repository
    const mainCommitsResponse = await window.electronAPI.gitGetCommitsForReleaseType(
      selectedRepository.value.path,
      currentVersion.value,
      versionType.value
    )
    
    if (!mainCommitsResponse.success) {
      throw new Error(`Error obteniendo commits del repositorio principal: ${mainCommitsResponse.error}`)
    }
    
    const mainTemplateData = {
      version: getFinalVersion(),
      date: new Date(),
      type: versionType.value,
      repository: selectedRepository.value.name,
      commits: mainCommitsResponse.data.commits || [],
      fromTag: mainCommitsResponse.data.fromTag || 'inicio',
      toTag: mainCommitsResponse.data.toTag || 'HEAD',
      commitsCount: mainCommitsResponse.data.commits?.length || 0,
      baseVersion: currentVersion.value,
      releaseType: versionType.value,
      author: 'Usuario'
    }
    
    // Render main repository changelog
    const mainChangelogResponse = await templatesStore.renderTemplate(selectedTemplate.value.content, mainTemplateData)
    
    if (!mainChangelogResponse) {
      throw new Error('Error generando changelog del repositorio principal')
    }
    
    // Clean automatic generation text from individual changelogs
    const cleanMainChangelog = cleanAutomaticGenerationText(mainChangelogResponse)
    
    // Start unified changelog with main repository
    let unifiedChangelog = `# ${selectedRepository.value.name} - Release ${getFinalVersion()}\n\n`
    unifiedChangelog += `## 📁 Repositorio Principal: ${selectedRepository.value.name}\n\n`
    unifiedChangelog += cleanMainChangelog + '\n\n'
    
    // Generate changelog for each secondary repository
    for (const secondaryRepo of secondaryRepositories) {
      try {
        console.log(`📦 Generating changelog for secondary repository: ${secondaryRepo.name}`)
        
        // Get commits for this secondary repository
        const secondaryCommitsResponse = await window.electronAPI.gitGetCommitsForReleaseType(
          secondaryRepo.path,
          currentVersion.value, // Using same version logic
          versionType.value
        )
        
        if (secondaryCommitsResponse.success) {
          const secondaryTemplateData = {
            version: getFinalVersion(),
            date: new Date(),
            type: versionType.value,
            repository: secondaryRepo.name,
            commits: secondaryCommitsResponse.data.commits || [],
            fromTag: secondaryCommitsResponse.data.fromTag || 'inicio',
            toTag: secondaryCommitsResponse.data.toTag || 'HEAD',
            commitsCount: secondaryCommitsResponse.data.commits?.length || 0,
            baseVersion: currentVersion.value,
            releaseType: versionType.value,
            author: 'Usuario'
          }
          
          // Render secondary repository changelog using the same template
          const secondaryChangelogResponse = await templatesStore.renderTemplate(selectedTemplate.value.content, secondaryTemplateData)
          
          if (secondaryChangelogResponse) {
            // Clean automatic generation text from secondary changelog
            const cleanSecondaryChangelog = cleanAutomaticGenerationText(secondaryChangelogResponse)
            
            unifiedChangelog += `---\n\n`
            unifiedChangelog += `## 📦 Repositorio Secundario: ${secondaryRepo.name}\n\n`
            unifiedChangelog += cleanSecondaryChangelog + '\n\n'
            console.log(`✅ Successfully generated changelog for ${secondaryRepo.name}`)
          } else {
            console.warn(`⚠️ Failed to generate changelog for ${secondaryRepo.name}`)
            unifiedChangelog += `---\n\n`
            unifiedChangelog += `## 📦 Repositorio Secundario: ${secondaryRepo.name}\n\n`
            unifiedChangelog += `*No se pudieron obtener cambios para este repositorio*\n\n`
          }
        } else {
          console.warn(`⚠️ Failed to get commits for ${secondaryRepo.name}:`, secondaryCommitsResponse.error)
          unifiedChangelog += `---\n\n`
          unifiedChangelog += `## 📦 Repositorio Secundario: ${secondaryRepo.name}\n\n`
          unifiedChangelog += `*No se pudieron obtener commits para este repositorio*\n\n`
        }
      } catch (error) {
        console.error(`❌ Error processing secondary repository ${secondaryRepo.name}:`, error)
        unifiedChangelog += `---\n\n`
        unifiedChangelog += `## 📦 Repositorio Secundario: ${secondaryRepo.name}\n\n`
        unifiedChangelog += `*Error procesando este repositorio: ${error.message}*\n\n`
      }
    }
    
    // Add summary footer
    unifiedChangelog += `---\n\n`
    unifiedChangelog += `## 📊 Resumen\n\n`
    unifiedChangelog += `- **Repositorio Principal:** ${selectedRepository.value.name}\n`
    secondaryRepositories.forEach(repo => {
      unifiedChangelog += `- **Repositorio Secundario:** ${repo.name}\n`
    })
    unifiedChangelog += ``
    
    console.log('✅ Unified changelog generated successfully')
    return unifiedChangelog
    
  } catch (error) {
    console.error('❌ Error generating unified changelog:', error)
    throw error
  }
}

const generateSingleRepositoryPreview = async () => {
  // Obtener commits específicos para el tipo de release seleccionado
  const commitsResponse = await window.electronAPI.gitGetCommitsForReleaseType(
    selectedRepository.value.path,
    currentVersion.value,
    versionType.value
  )
  console.log('Git commits response:', commitsResponse)
  
  if (!commitsResponse.success) {
    throw new Error(commitsResponse.error || 'Error obteniendo commits')
  }
  
  // Preparar datos reales para el template
  const templateData = {
    version: getFinalVersion(),
    date: new Date(),
    type: versionType.value,
    repository: selectedRepository.value.name,
    commits: commitsResponse.data.commits || [],
    fromTag: commitsResponse.data.fromTag || 'inicio',
    toTag: commitsResponse.data.toTag || 'HEAD',
    commitsCount: commitsResponse.data.commits?.length || 0,
    baseVersion: currentVersion.value,
    releaseType: versionType.value,
    author: 'Usuario' // Se puede obtener de Git config si está disponible
  }
  
  console.log('Template data:', templateData)
  
  // Usar el servicio de templates para renderizar con Liquid.js
  const renderResponse = await templatesStore.renderTemplate(selectedTemplate.value.content, templateData)
  console.log('Template render response:', renderResponse)
  
  if (renderResponse) {
    generatedPreview.value = `<div class="space-y-4">${convertMarkdownToHtml(renderResponse)}</div>`
  } else {
    generatedPreview.value = 'Error generando preview'
  }
}

const cleanAutomaticGenerationText = (text) => {
  let cleaned = text
  
  // Remove automatic generation footers
  cleaned = cleaned
    .replace(/---\s*\n\s*Generado automáticamente por ReleaseFlow\s*$/gm, '')
    .replace(/---\s*\n\s*\*Generado automáticamente por ReleaseFlow\*\s*$/gm, '')
    .replace(/---\s*\n\s*\*Generated automatically by ReleaseFlow\*\s*$/gm, '')
    .replace(/^\s*Generado automáticamente por ReleaseFlow\s*$/gm, '')
    .replace(/^\s*\*Generated automatically by ReleaseFlow\*\s*$/gm, '')
  
  // Fix specific duplications found in the output
  cleaned = cleaned
    // Fix "Fecha de Lanzamiento:Fecha de Lanzamiento:" -> "Fecha de Lanzamiento:"
    .replace(/Fecha de Lanzamiento:Fecha de Lanzamiento:/g, 'Fecha de Lanzamiento:')
    // Fix "Tipo de Release:Tipo de Release:" -> "Tipo de Release:"
    .replace(/Tipo de Release:Tipo de Release:/g, 'Tipo de Release:')
    // Generic fix for any duplicated labels
    .replace(/(\*\*[^:]*:)\1/g, '$1')
  
  // Clean up excessive whitespace and empty lines
  cleaned = cleaned
    // Remove excessive empty lines after list items
    .replace(/(\n- [^\n]+)\n\n+/g, '$1\n')
    // Remove excessive empty lines (more than 2)
    .replace(/\n\n\n+/g, '\n\n')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    // Remove trailing separator lines
    .replace(/---\s*$/gm, '')
    // Clean trailing whitespace on lines
    .replace(/[ \t]+$/gm, '')
  
  return cleaned.trim()
}

const convertMarkdownToHtml = (markdown) => {
  return markdown
    // Headers
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-medium mb-2 text-gray-700 dark:text-gray-300">$1</h4>')
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    // List items - envolver en <ul>
    .replace(/(^- .+$\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line => 
        line.replace(/^- (.+)$/, '<li class="mb-1 text-gray-700 dark:text-gray-300">$1</li>')
      ).join('\n')
      return `<ul class="list-none space-y-1 mb-4">\n${items}\n</ul>`
    })
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
    // Italic text
    .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-600 dark:text-gray-400">$1</em>')
    // Párrafos - convertir saltos dobles en párrafos
    .split('\n\n')
    .filter(paragraph => paragraph.trim())
    .map(paragraph => {
      // Si ya es HTML (contiene tags), no envolver
      if (paragraph.includes('<')) return paragraph
      // Si es texto plano, envolver en párrafo
      return `<p class="mb-4 text-gray-700 dark:text-gray-300">${paragraph.replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')
}

const generateRelease = async () => {
  generatingRelease.value = true
  
  try {
    const finalVersion = getFinalVersion()
    const releaseData = {
      version: finalVersion,
      repository: selectedRepository.value.name,
      repositoryPath: selectedRepository.value.path,
      template: selectedTemplate.value.name,
      templateId: selectedTemplate.value.id,
      date: new Date().toISOString(),
      content: generatedPreview.value,
      releaseType: versionType.value,
      baseVersion: currentVersion.value
    }
    
    console.log('🚀 Generando release:', releaseData)
    
    // 1. Crear tag de Git si está habilitado
    const tagName = `${selectedRepository.value.tag_prefix || ''}${finalVersion}`
    
    if (createTag.value) {
      console.log('📝 Creando tag de Git...')
      const releaseMessage = generateCleanTagMessage(finalVersion, generatedPreview.value)
      
      console.log(`🏷️ Tag name: ${tagName}`)
      
      // Crear tag en repositorio principal
      const tagResponse = await window.electronAPI.gitCreateTag(
        selectedRepository.value.path,
        tagName,
        releaseMessage
      )
      
      if (!tagResponse.success) {
        throw new Error(`Error creando tag en repositorio principal: ${tagResponse.error}`)
      }
      console.log('✅ Tag creado en repositorio principal:', tagName)
      
      // Si es un repositorio principal, crear tags en repositorios secundarios
      if (selectedRepository.value.is_main_repository) {
        console.log('🔗 Obteniendo repositorios secundarios...')
        const secondaryResponse = await window.electronAPI.dbGetSecondaryRepositories(selectedRepository.value.id)
        
        if (secondaryResponse.success && secondaryResponse.data.repositories.length > 0) {
          console.log(`📦 Creando tags en ${secondaryResponse.data.repositories.length} repositorios secundarios...`)
          
          const secondaryErrors = []
          
          for (const secondaryRepo of secondaryResponse.data.repositories) {
            try {
              // IMPORTANTE: Usar el mismo tag del repositorio principal, no el prefijo del secundario
              // Esto permite que un repositorio secundario tenga tags de múltiples aplicaciones
              console.log(`🏷️ Creando tag en ${secondaryRepo.name}: ${tagName} (replicado desde ${selectedRepository.value.name})`)
              
              const secondaryTagResponse = await window.electronAPI.gitCreateTag(
                secondaryRepo.path,
                tagName, // Usar exactamente el mismo tag que el principal
                generateCleanTagMessage(finalVersion, generatedPreview.value, `from ${selectedRepository.value.name}`)
              )
              
              if (secondaryTagResponse.success) {
                console.log(`✅ Tag replicado en ${secondaryRepo.name}: ${tagName}`)
              } else {
                console.error(`❌ Error replicando tag en ${secondaryRepo.name}:`, secondaryTagResponse.error)
                secondaryErrors.push(`${secondaryRepo.name}: ${secondaryTagResponse.error}`)
              }
            } catch (error) {
              console.error(`❌ Error procesando repositorio ${secondaryRepo.name}:`, error)
              secondaryErrors.push(`${secondaryRepo.name}: ${error.message}`)
            }
          }
          
          if (secondaryErrors.length > 0) {
            console.warn('⚠️ Algunos repositorios secundarios tuvieron errores:', secondaryErrors)
            // No fallar completamente, pero mostrar advertencia
          }
        } else {
          console.log('ℹ️ No hay repositorios secundarios configurados')
        }
      }
      
      // Push tags to remote if enabled
      if (pushTags.value) {
        console.log('📤 Haciendo push de tags al repositorio remoto...')
        
        // Push tags from main repository
        const pushResponse = await window.electronAPI.gitPushTags(selectedRepository.value.path)
        if (!pushResponse.success) {
          console.warn('⚠️ Error haciendo push de tags en repositorio principal:', pushResponse.error)
          alert(`⚠️ Tags creados exitosamente, pero hubo un error al hacer push en el repositorio principal:\n${pushResponse.error}`)
        } else {
          console.log('✅ Tags pusheados exitosamente en repositorio principal')
        }
        
        // Push tags from secondary repositories if this is a main repository
        if (selectedRepository.value.is_main_repository) {
          const secondaryResponse = await window.electronAPI.dbGetSecondaryRepositories(selectedRepository.value.id)
          
          if (secondaryResponse.success && secondaryResponse.data.repositories.length > 0) {
            console.log(`📤 Haciendo push de tags en ${secondaryResponse.data.repositories.length} repositorios secundarios...`)
            
            const pushErrors = []
            
            for (const secondaryRepo of secondaryResponse.data.repositories) {
              try {
                const secondaryPushResponse = await window.electronAPI.gitPushTags(secondaryRepo.path)
                
                if (secondaryPushResponse.success) {
                  console.log(`✅ Tags pusheados en ${secondaryRepo.name}`)
                } else {
                  console.error(`❌ Error haciendo push de tags en ${secondaryRepo.name}:`, secondaryPushResponse.error)
                  pushErrors.push(`${secondaryRepo.name}: ${secondaryPushResponse.error}`)
                }
              } catch (error) {
                console.error(`❌ Error procesando push en repositorio ${secondaryRepo.name}:`, error)
                pushErrors.push(`${secondaryRepo.name}: ${error.message}`)
              }
            }
            
            if (pushErrors.length > 0) {
              console.warn('⚠️ Algunos repositorios secundarios tuvieron errores al hacer push:', pushErrors)
              // Show warning but don't fail completely
              alert(`⚠️ Tags creados exitosamente, pero algunos repositorios tuvieron errores al hacer push:\n${pushErrors.join('\n')}`)
            }
          }
        }
      }
    }
    
    // 2. Guardar en base de datos
    console.log('💾 Guardando release en base de datos...')
    const dbResponse = await releasesStore.saveRelease(releaseData)
    if (!dbResponse.success) {
      throw new Error(`Error guardando en BD: ${dbResponse.error}`)
    }
    console.log('✅ Release guardado en BD')
    
    // 3. Crear release en JIRA si está habilitado
    try {
      console.log('🎫 Verificando configuración de JIRA...')
      const jiraConfig = await window.electronAPI.jiraGetConfig()
      
      if (jiraConfig.success && jiraConfig.data.enabled && createJiraRelease.value) {
        console.log('🎫 JIRA habilitado, creando release...')
        
        // Obtener commits para el análisis de issues
        const commitsResponse = await window.electronAPI.gitGetCommitsForReleaseType(
          selectedRepository.value.path,
          currentVersion.value,
          versionType.value
        )
        
        console.log('🔍 Commits response from backend:', commitsResponse)
        
        if (commitsResponse.success && commitsResponse.data && commitsResponse.data.commits && commitsResponse.data.commits.length > 0) {
          console.log(`🎫 Analizando ${commitsResponse.data.commits.length} commits para issues de JIRA...`)
          
          // Convertir HTML de release notes a texto plano para JIRA
          const plainTextNotes = convertHtmlToMarkdown(generatedPreview.value)
          console.log('📝 Release notes for JIRA:', {
            originalHtml: generatedPreview.value.substring(0, 200) + '...',
            converted: plainTextNotes.substring(0, 200) + '...',
            originalLength: generatedPreview.value.length,
            convertedLength: plainTextNotes.length
          })
          const releaseDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD
          
          const fullVersionName = `${selectedRepository.value.tag_prefix || ''}${finalVersion}`
          
          const jiraResponse = await window.electronAPI.jiraCreateReleaseWithIssues(
            fullVersionName,
            commitsResponse.data.commits,
            plainTextNotes,
            releaseDate
          )
          
          if (jiraResponse.success) {
            const { version, issues, associatedIssues } = jiraResponse.data
            console.log(`✅ JIRA release creado: ${version.name}`)
            console.log(`🎫 Issues encontrados: ${issues.length}`)
            console.log(`🔗 Issues asociados: ${associatedIssues}`)
            
            // Mostrar notificación de éxito
            if (issues.length > 0) {
              window.electronAPI.notify(
                'JIRA Integration', 
                `Release ${finalVersion} creado con ${issues.length} tickets asociados`
              )
            }
          } else {
            console.warn('⚠️ Error creando release en JIRA:', jiraResponse.error)
            // No fallar el release completo por error de JIRA
          }
        } else {
          console.log('ℹ️ No hay commits para analizar, creando release básico en JIRA...')
          console.log('🔍 Commits data was:', commitsResponse.data)
          console.log('🔍 Commits success:', commitsResponse.success)
          console.log('🔍 Commits array length:', commitsResponse.data?.commits?.length || 0)
          
          const fullVersionName = `${selectedRepository.value.tag_prefix || ''}${finalVersion}`
          
          const basicJiraResponse = await window.electronAPI.jiraCreateVersion({
            name: fullVersionName,
            description: `Release generated automatically by ReleaseFlow`,
            releaseDate: new Date().toISOString().split('T')[0]
          })
          
          if (basicJiraResponse.success) {
            console.log('✅ Release básico creado en JIRA:', basicJiraResponse.data.name)
          } else {
            console.warn('⚠️ Error creando release básico en JIRA:', basicJiraResponse.error)
          }
        }
      } else {
        console.log('ℹ️ JIRA no está habilitado o checkbox desactivado, omitiendo creación de release')
      }
    } catch (error) {
      console.warn('⚠️ Error en integración con JIRA (no crítico):', error.message)
      // No fallar el release completo por errores de JIRA
    }
    
    // 4. Guardar en archivo si está habilitado
    if (saveToFile.value) {
      console.log('📁 Guardando archivo de release...')
      
      // Convertir HTML de vuelta a Markdown apropiado
      const fileContent = convertHtmlToMarkdown(generatedPreview.value)
      
      const saveResponse = await window.electronAPI.saveFileDialog({
        title: 'Guardar Release Notes',
        defaultPath: `release-${finalVersion}.md`,
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (saveResponse && !saveResponse.canceled && saveResponse.filePath) {
        console.log('📝 Escribiendo archivo a:', saveResponse.filePath)
        const writeResponse = await window.electronAPI.writeFile(saveResponse.filePath, fileContent)
        if (writeResponse.success) {
          console.log('✅ Archivo guardado exitosamente:', saveResponse.filePath)
        } else {
          console.error('❌ Error escribiendo archivo:', writeResponse.error)
          throw new Error(`Error escribiendo archivo: ${writeResponse.error}`)
        }
      } else if (saveResponse && saveResponse.canceled) {
        console.log('ℹ️ Usuario canceló el guardado de archivo')
      } else {
        console.error('❌ Error en dialog de guardado:', saveResponse)
      }
    }
    
    // 4. Crear deployment en CodebaseHQ si está habilitado
    if (createCodebaseDeployment.value) {
      console.log('☁️ Creando deployment en CodebaseHQ...')
      
      try {
        // Obtener configuración global de CodebaseHQ
        const codebaseConfig = {
          accountName: await getConfig('codebase_account_name'),
          username: await getConfig('codebase_username'), 
          apiKey: await getConfig('codebase_api_key'),
          projectPermalink: await getConfig('codebase_project_permalink'),
          repositoryPermalink: selectedRepository.value.codebase_repository_permalink || selectedRepository.value.name.toLowerCase()
        }

        // Validar configuración
        const configValidation = await window.electronAPI.codebaseValidateConfig(codebaseConfig)
        if (!configValidation.success || !configValidation.data.isValid) {
          const errors = configValidation.data?.errors || ['Error de validación desconocido']
          console.warn('⚠️ Configuración de CodebaseHQ inválida:', errors)
          alert(`⚠️ No se pudo crear deployment en CodebaseHQ: ${errors.join(', ')}`)
        } else {
          // Obtener información del commit actual
          console.log('🔍 Obteniendo información del repositorio:', selectedRepository.value.path)
          const currentBranchResponse = await window.electronAPI.gitGetCurrentBranch(selectedRepository.value.path)
          const commitsResponse = await window.electronAPI.gitGetCommits(selectedRepository.value.path, 1)
          
          console.log('🌿 Respuesta de branch:', currentBranchResponse)
          console.log('📝 Respuesta de commits:', commitsResponse)
          
          const currentBranch = currentBranchResponse.success ? currentBranchResponse.data : 'main'
          const lastCommit = commitsResponse.success && commitsResponse.data?.commits?.length > 0 
            ? commitsResponse.data.commits[0] : null

          if (!lastCommit) {
            console.warn('⚠️ No se pudo obtener información del commit actual')
            console.warn('Detalles del branch:', currentBranchResponse)
            console.warn('Detalles de commits:', commitsResponse)
            
            let errorDetails = []
            if (!currentBranchResponse.success) {
              errorDetails.push(`Error obteniendo branch: ${currentBranchResponse.error}`)
            }
            if (!commitsResponse.success) {
              errorDetails.push(`Error obteniendo commits: ${commitsResponse.error}`)
            }
            if (commitsResponse.success && (!commitsResponse.data?.commits || commitsResponse.data.commits.length === 0)) {
              errorDetails.push('No hay commits en el repositorio')
            }
            
            alert(`⚠️ No se pudo crear deployment: falta información del commit\n\n${errorDetails.join('\n')}`)
          } else {
            // Crear deployment
            const deployment = {
              branch: currentBranch,
              revision: lastCommit.hash,
              environment: selectedRepository.value.codebase_environment || 'production',
              servers: (selectedRepository.value.codebase_servers || 'app.server.com').split(',').map(s => s.trim()),
              tagName: tagName,
              releaseNotes: generatedPreview.value
            }

            console.log('📤 Datos del deployment:', deployment)
            
            const deploymentResponse = await window.electronAPI.codebaseCreateDeployment(codebaseConfig, deployment)
            
            if (deploymentResponse.success) {
              console.log('✅ Deployment creado exitosamente en CodebaseHQ')
            } else {
              console.error('❌ Error creando deployment:', deploymentResponse.error)
              alert(`⚠️ Release creado, pero falló el deployment en CodebaseHQ: ${deploymentResponse.error}`)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error en proceso de CodebaseHQ:', error)
        alert(`⚠️ Release creado, pero hubo un error con CodebaseHQ: ${error.message}`)
      }
    }
    
    // 5. Actualizar lista de releases recientes
    await releasesStore.loadReleases()
    
    alert(`✅ Release ${finalVersion} generado exitosamente!`)
    showWizard.value = false
    resetWizardData()
    
  } catch (error) {
    console.error('❌ Error generating release:', error)
    alert(`❌ Error generando el release: ${error.message}`)
  } finally {
    generatingRelease.value = false
  }
}

const showReleaseHistory = () => {
  console.log('Show release history')
}

// Función para arreglar texto suelto sin clases de dark mode
const fixLooseText = (htmlContent) => {
  // Envolver texto que aparece después de tags de cierre y texto suelto en líneas
  let fixed = htmlContent
  
  // Capturar texto que aparece después de tags de cierre como </strong> texto
  fixed = fixed.replace(/(<\/[^>]+>)\s*([^<\n]+?)(?=\s*<|$)/g, '$1 <span class="text-gray-900 dark:text-white">$2</span>')
  
  // Capturar líneas que son solo texto sin tags
  fixed = fixed.replace(/^(?!<)([^<\n]+)$/gm, '<span class="text-gray-900 dark:text-white">$1</span>')
  
  return fixed
}

const viewRelease = (release) => {
  // Mostrar modal o popup con el contenido de la release
  const releaseContent = fixLooseText(release.content || 'Sin contenido disponible')
  
  // Hacer la release actual disponible globalmente para el botón de descarga
  window.currentRelease = release
  
  // Crear un modal simple con el contenido
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  
  // Asegurar que el modal herede el tema actual
  if (document.documentElement.classList.contains('dark')) {
    modal.classList.add('dark')
  }
  
  const closeModal = () => {
    modal.remove()
    window.currentRelease = null
    document.removeEventListener('keydown', handleEscape)
  }
  
  const downloadCurrent = () => {
    downloadRelease(window.currentRelease)
  }
  
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-auto">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            ${release.version} - ${release.repository}
          </h2>
          <button id="closeBtn" class="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 text-2xl">&times;</button>
        </div>
        <p class="text-sm mt-1">
          <span class="text-gray-500 dark:text-gray-400">${new Date(release.date).toLocaleDateString('es-ES')}</span>
          <span class="text-gray-500 dark:text-gray-400"> • </span>
          <span class="text-gray-500 dark:text-gray-400">${release.template}</span>
        </p>
      </div>
      <div class="p-6 prose prose-sm dark:prose-invert max-w-none">
        ${releaseContent}
      </div>
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button id="closeBtnFooter" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
          Cerrar
        </button>
        <button id="downloadBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" style="color: white !important;">
          Descargar
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Event listeners
  modal.querySelector('#closeBtn').addEventListener('click', closeModal)
  modal.querySelector('#closeBtnFooter').addEventListener('click', closeModal)
  modal.querySelector('#downloadBtn').addEventListener('click', downloadCurrent)
  
  // Cerrar con escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal()
    }
  }
  document.addEventListener('keydown', handleEscape)
  
  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })
}

const downloadRelease = async (release) => {
  try {
    console.log('📁 Descargando release:', release.version)
    
    // Convertir HTML a Markdown si es necesario
    const fileContent = release.content.includes('<') ? 
      convertHtmlToMarkdown(release.content) : 
      release.content
    
    const saveResponse = await window.electronAPI.saveFileDialog({
      title: 'Descargar Release Notes',
      defaultPath: `release-${release.version}.md`,
      filters: [
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (saveResponse && !saveResponse.canceled && saveResponse.filePath) {
      console.log('📝 Escribiendo archivo a:', saveResponse.filePath)
      const writeResponse = await window.electronAPI.writeFile(saveResponse.filePath, fileContent)
      if (writeResponse.success) {
        console.log('✅ Release descargado exitosamente:', saveResponse.filePath)
        alert(`✅ Release descargado en:\n${saveResponse.filePath}`)
      } else {
        console.error('❌ Error escribiendo archivo:', writeResponse.error)
        alert(`❌ Error escribiendo archivo: ${writeResponse.error}`)
      }
    } else if (saveResponse && saveResponse.canceled) {
      console.log('ℹ️ Usuario canceló la descarga')
    } else {
      console.error('❌ Error en dialog de guardado:', saveResponse)
    }
  } catch (error) {
    console.error('❌ Error descargando release:', error)
    alert(`❌ Error descargando release: ${error.message}`)
  }
}

const deployToCodebaseHQ = async (release) => {
  try {
    console.log('🚀 Deploying release to CodebaseHQ:', release)
    
    // Obtener configuración global de CodebaseHQ
    const globalConfig = {
      accountName: await getConfig('codebase_account_name'),
      username: await getConfig('codebase_username'), 
      apiKey: await getConfig('codebase_api_key'),
      projectPermalink: await getConfig('codebase_project_permalink')
    }

    // Buscar el repositorio para obtener configuración específica
    const reposResponse = await window.electronAPI.dbListRepositories()
    if (!reposResponse.success) {
      throw new Error('No se pudieron cargar los repositorios')
    }

    const repository = reposResponse.data.repositories.find(repo => repo.name === release.repository)
    if (!repository) {
      throw new Error(`Repositorio '${release.repository}' no encontrado`)
    }

    if (!repository.codebase_enabled) {
      alert(`⚠️ CodebaseHQ no está habilitado para el repositorio '${release.repository}'. Ve a Repositorios → Configurar CodebaseHQ para habilitarlo.`)
      return
    }

    // Configuración completa para deployment (incluyendo repository permalink)
    const fullConfig = {
      ...globalConfig,
      repositoryPermalink: repository.codebase_repository_permalink || release.repository.toLowerCase()
    }

    // Validar configuración completa (incluyendo repository permalink)
    const configValidation = await window.electronAPI.codebaseValidateConfig(fullConfig)
    if (!configValidation.success || !configValidation.data.isValid) {
      const errors = configValidation.data?.errors || ['Error de configuración desconocido']
      alert(`⚠️ Configuración de CodebaseHQ incompleta. Ve a Configuración para completar:\n${errors.join(', ')}`)
      return
    }

    // Confirmar deployment
    const confirm = window.confirm(
      `¿Crear deployment en CodebaseHQ?\n\n` +
      `Repositorio: ${release.repository}\n` +
      `Versión: ${release.version}\n` +
      `Environment: ${repository.codebase_environment}\n` +
      `Servers: ${repository.codebase_servers}`
    )

    if (!confirm) return

    // Obtener información del commit actual del repositorio
    const currentBranchResponse = await window.electronAPI.gitGetCurrentBranch(repository.path)
    const commitsResponse = await window.electronAPI.gitGetCommits(repository.path, 1)
    
    const currentBranch = currentBranchResponse.success ? currentBranchResponse.data : 'main'
    const lastCommit = commitsResponse.success && commitsResponse.data?.commits?.length > 0 
      ? commitsResponse.data.commits[0] : null

    // Crear deployment con la información disponible
    const deployment = {
      branch: currentBranch,
      revision: lastCommit?.hash || release.tag_name || release.version,
      environment: repository.codebase_environment || 'production',
      servers: (repository.codebase_servers || 'app.server.com').split(',').map(s => s.trim()),
      tagName: release.version,
      releaseNotes: release.content
    }

    console.log('📤 Creando deployment:', deployment)
    const deploymentResponse = await window.electronAPI.codebaseCreateDeployment(fullConfig, deployment)
    
    if (deploymentResponse.success) {
      alert(`✅ Deployment creado exitosamente en CodebaseHQ para ${release.version}`)
    } else {
      throw new Error(deploymentResponse.error)
    }
    
  } catch (error) {
    console.error('❌ Error creating deployment:', error)
    alert(`❌ Error creando deployment: ${error.message}`)
  }
}

const validateRepositoryForRelease = async () => {
  if (!selectedRepository.value) {
    repositoryValidation.value = {
      isValid: false,
      warnings: [],
      errors: ['No hay repositorio seleccionado'],
      status: null
    }
    return
  }

  try {
    console.log('🔍 Validando estado del repositorio:', selectedRepository.value.name)
    const response = await window.electronAPI.gitValidateForRelease(selectedRepository.value.path)
    
    if (response.success) {
      repositoryValidation.value = response.data
      console.log('✅ Validación completada:', response.data)
      
      // También validar repositorios secundarios si es un repo principal
      if (selectedRepository.value.is_main_repository) {
        try {
          const secondaryResponse = await window.electronAPI.dbGetSecondaryRepositories(selectedRepository.value.id)
          
          if (secondaryResponse.success && secondaryResponse.data.repositories.length > 0) {
            console.log('🔍 Validando repositorios secundarios...')
            
            for (const secondaryRepo of secondaryResponse.data.repositories) {
              try {
                const secondaryValidation = await window.electronAPI.gitValidateForRelease(secondaryRepo.path)
                
                if (secondaryValidation.success && !secondaryValidation.data.isValid) {
                  // Agregar errores/warnings del repositorio secundario
                  secondaryValidation.data.errors.forEach(error => {
                    repositoryValidation.value.errors.push(`${secondaryRepo.name}: ${error}`)
                  })
                  secondaryValidation.data.warnings.forEach(warning => {
                    repositoryValidation.value.warnings.push(`${secondaryRepo.name}: ${warning}`)
                  })
                  repositoryValidation.value.isValid = repositoryValidation.value.isValid && secondaryValidation.data.isValid
                }
              } catch (error) {
                console.warn(`⚠️ Error validando repositorio secundario ${secondaryRepo.name}:`, error)
                repositoryValidation.value.warnings.push(`${secondaryRepo.name}: No se pudo validar el estado`)
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo repositorios secundarios:', error)
        }
      }
    } else {
      repositoryValidation.value = {
        isValid: false,
        warnings: [],
        errors: [`Error validando repositorio: ${response.error}`],
        status: null
      }
    }
  } catch (error) {
    console.error('❌ Error en validación:', error)
    repositoryValidation.value = {
      isValid: false,
      warnings: [],
      errors: [`Error inesperado: ${error.message}`],
      status: null
    }
  }
}

const loadIntegrationsStatus = async () => {
  try {
    console.log('🔧 Cargando estado de integraciones...')
    console.log('🔧 selectedRepository.value:', selectedRepository.value)
    
    // Verificar JIRA (solo configuración global)
    const jiraEnabled = await window.electronAPI.dbGetConfig('jira_enabled')
    console.log('🔧 JIRA config response:', jiraEnabled)
    integrationsStatus.value.jira.enabled = jiraEnabled.success && (jiraEnabled.data === 'true' || jiraEnabled.data?.value === 'true')
    createJiraRelease.value = integrationsStatus.value.jira.enabled
    
    // Verificar CodebaseHQ (configuración global + del repositorio)
    const codebaseGlobalEnabled = await window.electronAPI.dbGetConfig('codebase_enabled')
    console.log('🔧 CodebaseHQ global config response:', codebaseGlobalEnabled)
    
    const isCodebaseGlobalEnabled = codebaseGlobalEnabled.success && (codebaseGlobalEnabled.data === 'true' || codebaseGlobalEnabled.data?.value === 'true')
    
    // Verificar si hay repositorio seleccionado
    if (!selectedRepository.value) {
      console.warn('⚠️ No hay repositorio seleccionado todavía')
      integrationsStatus.value.codebase.enabled = false
      createCodebaseDeployment.value = false
      return
    }
    
    // Verificar codebase_enabled del repositorio (puede ser 1, true, o "1")
    const repoCodebaseEnabled = selectedRepository.value.codebase_enabled
    const isCodebaseRepoEnabled = repoCodebaseEnabled === true || repoCodebaseEnabled === 1 || repoCodebaseEnabled === '1'
    
    console.log('🔧 CodebaseHQ checks:', {
      globalEnabled: isCodebaseGlobalEnabled,
      repoEnabled: isCodebaseRepoEnabled,
      selectedRepo: selectedRepository.value?.name,
      repoCodebaseValue: repoCodebaseEnabled,
      repoCodebaseType: typeof repoCodebaseEnabled
    })
    
    integrationsStatus.value.codebase.enabled = isCodebaseGlobalEnabled && isCodebaseRepoEnabled
    createCodebaseDeployment.value = integrationsStatus.value.codebase.enabled
    
    console.log('📋 Estado final de integraciones:', integrationsStatus.value)
    console.log('🔧 Checkboxes configurados:', {
      codebase: createCodebaseDeployment.value,
      jira: createJiraRelease.value
    })
  } catch (error) {
    console.error('Error cargando estado de integraciones:', error)
  }
}

const loadSecondaryReposInfo = async () => {
  if (!selectedRepository.value?.is_main_repository) {
    secondaryReposInfo.value = ''
    return
  }
  
  try {
    const response = await window.electronAPI.dbGetSecondaryRepositories(selectedRepository.value.id)
    if (response.success && response.data.repositories.length > 0) {
      const repoNames = response.data.repositories.map(repo => `<strong>${repo.name}</strong>`).join(', ')
      secondaryReposInfo.value = `📦 Se replicará en ${response.data.repositories.length} repositorio(s): ${repoNames}`
    } else {
      secondaryReposInfo.value = '⚠️ No hay repositorios secundarios configurados'
    }
  } catch (error) {
    console.error('Error loading secondary repos info:', error)
    secondaryReposInfo.value = ''
  }
}

const convertHtmlToMarkdown = (htmlContent) => {
  // Función para convertir HTML generado de vuelta a Markdown limpio
  let markdown = htmlContent
  
  // Remover el div wrapper
  markdown = markdown.replace(/<div class="space-y-4">([\s\S]*?)<\/div>$/, '$1')
  
  // Convertir headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1')
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1')
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
  
  // Convertir strong/bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
  
  // Convertir em/italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
  
  // Convertir listas
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1').trim()
    return items + '\n'
  })
  
  // Convertir párrafos 
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n')
  
  // Convertir horizontal rules
  markdown = markdown.replace(/<hr[^>]*\/?>/g, '---')
  
  // Limpiar break lines
  markdown = markdown.replace(/<br\s*\/?>/g, '\n')
  
  // Decodificar entidades HTML
  markdown = markdown.replace(/&nbsp;/g, ' ')
  markdown = markdown.replace(/&amp;/g, '&')
  markdown = markdown.replace(/&lt;/g, '<')
  markdown = markdown.replace(/&gt;/g, '>')
  markdown = markdown.replace(/&quot;/g, '"')
  
  // Remover cualquier HTML restante
  markdown = markdown.replace(/<[^>]*>/g, '')
  
  // Limpiar espacios extra y líneas vacías múltiples
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  
  return markdown
}

// Función para generar un mensaje de tag limpio y bien formateado
const generateCleanTagMessage = (version, htmlContent, suffix = '') => {
  // Convertir HTML a markdown limpio
  const cleanMarkdown = convertHtmlToMarkdown(htmlContent)
  
  // Crear mensaje del tag con formato mejorado
  const title = suffix ? `Release ${version} (${suffix})` : `Release ${version}`
  
  // Limpiar y formatear el contenido
  const cleanedContent = cleanMarkdown
    .replace(/^#{1,6}\s+/gm, '') // Remover headers markdown (ya tenemos el título)
    .replace(/^\s*[\*\-]\s*/gm, '• ') // Convertir bullets a símbolos más compatibles
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalizar espacios
    .replace(/^---+$/gm, '') // Remover separadores horizontales
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remover bold markdown (algunos sistemas no lo soportan bien)
    .replace(/^\s+|\s+$/g, '') // Trim general
    .substring(0, 1500) // Limitar longitud para evitar problemas con Git
  
  return `${title}\n\n${cleanedContent}`
}

// Función helper para obtener configuración
const getConfig = async (key) => {
  try {
    const response = await window.electronAPI.dbGetConfig(key)
    return response.success ? response.data.value : ''
  } catch (error) {
    console.warn(`⚠️ Error obteniendo configuración ${key}:`, error)
    return ''
  }
}


onMounted(async () => {
  // Cargar datos reales de los stores
  console.log('Loading releases data...')
  
  try {
    await Promise.all([
      repositoriesStore.loadRepositories(),
      templatesStore.loadTemplates(),
      releasesStore.loadReleases()
    ])
    
    console.log('Repositories loaded:', repositoriesStore.repositories)
    console.log('Templates loaded:', templatesStore.templates)
    console.log('Releases loaded:', releasesStore.releases)
  } catch (error) {
    console.error('Error loading releases data:', error)
  }
})
</script>