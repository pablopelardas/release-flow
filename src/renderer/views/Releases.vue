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
                Selecciona el Repositorio
              </h3>
              
              <div v-if="!repositories.length" class="text-center py-8">
                <i class="pi pi-folder-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  No hay repositorios configurados
                </p>
                <Button 
                  @click="$router.push('/repositories')" 
                  label="Ir a Repositorios" 
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
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <i class="pi pi-tag mr-2 text-green-500"></i>
                Configuración de Versión
              </h3>

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
                      <div class="text-xs text-gray-500">
                        {{ currentVersion }} → {{ getVersionPreview('major') }}
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
                      <div class="text-xs text-gray-500">
                        {{ currentVersion }} → {{ getVersionPreview('minor') }}
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
                      <div class="text-xs text-gray-500">
                        {{ currentVersion }} → {{ getVersionPreview('patch') }}
                      </div>
                    </div>
                  </template>
                </Card>
              </div>

              <!-- Custom Version Input -->
              <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div class="flex items-center mb-3">
                  <Checkbox v-model="useCustomVersion" />
                  <label class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usar versión personalizada
                  </label>
                </div>
                <InputText 
                  v-if="useCustomVersion"
                  v-model="customVersion"
                  placeholder="e.g., 2.1.0-beta.1"
                  class="w-full"
                />
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
                  <p class="font-semibold text-gray-900 dark:text-white">{{ getFinalVersion() }}</p>
                </div>

                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div class="flex items-center mb-2">
                    <i class="pi pi-file-edit text-purple-500 mr-2"></i>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Template</span>
                  </div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ selectedTemplate?.name }}</p>
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

              <!-- Options -->
              <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <div class="flex items-center">
                  <Checkbox v-model="createTag" />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Crear tag de Git automáticamente
                  </label>
                </div>
                <div class="flex items-center">
                  <Checkbox v-model="saveToFile" />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
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
                    {{ release.date }} • {{ release.template }}
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

const router = useRouter()

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

// Step 1: Repository data
const repositories = ref([])
const selectedRepository = ref(null)

// Step 2: Version data
const versionType = ref('minor')
const useCustomVersion = ref(false)
const customVersion = ref('')
const currentVersion = ref('1.0.0')

// Step 3: Template data
const availableTemplates = ref([
  {
    id: 1,
    name: 'Release Notes Estándar',
    description: 'Template formal para release notes',
    content: `# Release Notes v{{version}}`
  },
  {
    id: 2,
    name: 'Changelog Técnico',
    description: 'Para desarrolladores y equipos técnicos',
    content: `# CHANGELOG v{{version}}`
  },
  {
    id: 3,
    name: 'Release Marketing',
    description: 'Para comunicación con clientes',
    content: `# 🎉 Nueva Versión {{version}} Disponible!`
  },
  {
    id: 4,
    name: 'Minimal',
    description: 'Template minimalista y limpio',
    content: `{{version}} ({{date}})`
  }
])
const selectedTemplate = ref(null)

// Step 4: Preview and options
const generatedPreview = ref('')
const createTag = ref(true)
const saveToFile = ref(true)

// Recent releases
const recentReleases = ref([])

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
      return true
    default:
      return false
  }
})

// Methods
const startNewRelease = () => {
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
  saveToFile.value = true
}

const nextStep = () => {
  if (currentStep.value < totalSteps.value && canProceed.value) {
    currentStep.value++
    
    // Generate preview when entering step 4
    if (currentStep.value === 4) {
      generatePreview()
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const selectRepository = (repo) => {
  selectedRepository.value = repo
  currentVersion.value = repo.currentVersion || '1.0.0'
}

const getVersionPreview = (type) => {
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
  return getVersionPreview(versionType.value)
}

const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const previewTemplate = (template) => {
  console.log('Preview template:', template.name)
}

const generatePreview = () => {
  if (!selectedTemplate.value || !selectedRepository.value) return
  
  const mockData = {
    version: getFinalVersion(),
    date: new Date().toLocaleDateString('es-ES'),
    type: versionType.value,
    commits: [
      { type: 'feat', subject: 'Nueva funcionalidad de ejemplo' },
      { type: 'fix', subject: 'Corrección de bugs varios' },
      { type: 'docs', subject: 'Actualización de documentación' }
    ]
  }
  
  let preview = selectedTemplate.value.content
    .replace(/\{\{version\}\}/g, mockData.version)
    .replace(/\{\{date\}\}/g, mockData.date)
    .replace(/\{\{type\}\}/g, mockData.type)
  
  // Simple HTML conversion
  preview = preview
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3">$2</h2>')
    .replace(/^- (.+)$/gm, '<li class="mb-1">$1</li>')
  
  generatedPreview.value = preview
}

const generateRelease = async () => {
  generatingRelease.value = true
  
  try {
    // Simulate release generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Add to recent releases
    recentReleases.value.unshift({
      id: Date.now(),
      version: getFinalVersion(),
      repository: selectedRepository.value.name,
      template: selectedTemplate.value.name,
      date: new Date().toLocaleDateString('es-ES'),
      content: generatedPreview.value
    })
    
    alert(`✅ Release ${getFinalVersion()} generado exitosamente!`)
    showWizard.value = false
    resetWizardData()
    
  } catch (error) {
    console.error('Error generating release:', error)
    alert('❌ Error generando el release')
  } finally {
    generatingRelease.value = false
  }
}

const showReleaseHistory = () => {
  console.log('Show release history')
}

const viewRelease = (release) => {
  console.log('View release:', release)
}

const downloadRelease = (release) => {
  console.log('Download release:', release)
}

onMounted(() => {
  // Load mock repositories
  repositories.value = [
    {
      id: 1,
      name: 'release-flow',
      path: 'D:/working/release-flow',
      branch: 'main',
      lastCommit: 'hace 2 horas',
      status: 'clean',
      currentVersion: '1.0.0'
    },
    {
      id: 2,
      name: 'project-demo',
      path: 'D:/projects/demo',
      branch: 'develop',
      lastCommit: 'hace 1 día',
      status: 'dirty',
      currentVersion: '0.5.2'
    }
  ]
})
</script>