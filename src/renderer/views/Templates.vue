<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          Crea y edita templates personalizados para tus releases con preview en tiempo real
        </p>
      </div>
      <div class="flex space-x-3">
        <Button 
          @click="newTemplate" 
          icon="pi pi-plus" 
          label="Nuevo Template" 
          outlined
        />
        <Button 
          @click="loadPredefinedTemplate" 
          icon="pi pi-file" 
          label="Cargar Template" 
          outlined
        />
        <Button 
          @click="showNewTemplateDialog = true" 
          icon="pi pi-save" 
          label="Guardar" 
          outlined
        />
      </div>
    </div>

    <!-- Template Editor -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <TemplateEditor ref="templateEditorRef" />
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card class="text-center">
        <template #content>
          <div class="p-4">
            <i class="pi pi-code text-3xl text-blue-500 mb-3"></i>
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Sintaxis Liquid</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Usa variables como <code>{{ openBrace }}version{{ closeBrace }}</code>, <code>{{ openBrace }}commits{{ closeBrace }}</code> y filtros
            </p>
            <Button 
              label="Ver Documentación" 
              text 
              size="small" 
              @click="showLiquidDocs"
            />
          </div>
        </template>
      </Card>

      <Card class="text-center">
        <template #content>
          <div class="p-4">
            <i class="pi pi-eye text-3xl text-green-500 mb-3"></i>
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Preview en Tiempo Real</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Ve el resultado final mientras editas tu template
            </p>
            <Button 
              label="Datos de Ejemplo" 
              text 
              size="small" 
              @click="showSampleData"
            />
          </div>
        </template>
      </Card>

      <Card class="text-center">
        <template #content>
          <div class="p-4">
            <i class="pi pi-upload text-3xl text-purple-500 mb-3"></i>
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Exportar/Importar</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Guarda en archivo o carga templates desde archivo
            </p>
            <div class="flex gap-2 justify-center">
              <Button 
                label="Exportar" 
                icon="pi pi-download"
                text 
                size="small" 
                @click="exportTemplate"
              />
              <Button 
                label="Importar" 
                icon="pi pi-upload"
                text 
                size="small" 
                @click="importTemplate"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Diálogo de Templates Guardados -->
    <Dialog 
      v-model:visible="showPredefinedDialog" 
      modal 
      :header="'Seleccionar Template'" 
      :style="{ width: '50rem' }" 
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div class="space-y-4">
        <div v-if="allTemplates.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
          No hay templates guardados. Crea uno nuevo o importa desde archivo.
        </div>
        <div v-for="template in allTemplates" :key="template.id || template.name">
          <Card class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
                @click="selectTemplate(template)">
            <template #content>
              <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ template.name }}</h3>
                    <span v-if="template.category === 'predefined'" 
                          class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      Predefinido
                    </span>
                    <span v-else-if="template.category === 'custom'" 
                          class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      Personalizado
                    </span>
                  </div>
                  <div class="flex gap-1">
                    <Button 
                      v-if="template.category === 'custom'" 
                      icon="pi pi-trash" 
                      size="small" 
                      text 
                      severity="danger"
                      @click.stop="confirmDeleteTemplate(template)"
                      v-tooltip="'Eliminar template'"
                    />
                    <Button 
                      icon="pi pi-arrow-right" 
                      size="small" 
                      text 
                      @click.stop="selectTemplate(template)"
                      v-tooltip="'Usar template'"
                    />
                  </div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ template.description }}</p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </Dialog>

    <!-- Diálogo para Guardar Template -->
    <Dialog 
      v-model:visible="showNewTemplateDialog" 
      modal 
      header="Guardar Template Personalizado" 
      :style="{ width: '30rem' }" 
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Template
          </label>
          <input 
            v-model="newTemplateName" 
            type="text"
            placeholder="Ej: Mi Template Personalizado" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white !important"
            :disabled="false"
            style="pointer-events: auto !important; user-select: text !important;"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción (opcional)
          </label>
          <textarea 
            v-model="newTemplateDescription" 
            placeholder="Descripción del template..."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none !important"
            :disabled="false"
            style="pointer-events: auto !important; user-select: text !important;"
          />
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <Button 
            label="Cancelar" 
            text 
            @click="showNewTemplateDialog = false"
          />
          <Button 
            label="Guardar" 
            :disabled="!newTemplateName.trim()"
            @click="saveCustomTemplate"
          />
        </div>
      </div>
    </Dialog>

    <!-- Diálogo de Documentación Liquid -->
    <Dialog 
      v-model:visible="showLiquidDocsDialog" 
      modal 
      :header="'Sintaxis Liquid - Documentación'" 
      :style="{ width: '60rem' }" 
      :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
    >
      <div class="space-y-6">
        <!-- Variables Básicas -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            <i class="pi pi-code mr-2 text-blue-500"></i>
            Variables Disponibles
          </h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <code class="text-blue-600 dark:text-blue-400">{{ openBrace }}version{{ closeBrace }}</code>
                <p class="text-sm text-gray-600 dark:text-gray-400">Versión del release</p>
              </div>
              <div>
                <code class="text-blue-600 dark:text-blue-400">{{ openBrace }}date{{ closeBrace }}</code>
                <p class="text-sm text-gray-600 dark:text-gray-400">Fecha del release</p>
              </div>
              <div>
                <code class="text-blue-600 dark:text-blue-400">{{ openBrace }}type{{ closeBrace }}</code>
                <p class="text-sm text-gray-600 dark:text-gray-400">Tipo de release (major, minor, patch)</p>
              </div>
              <div>
                <code class="text-blue-600 dark:text-blue-400">{{ openBrace }}commits{{ closeBrace }}</code>
                <p class="text-sm text-gray-600 dark:text-gray-400">Array de commits incluidos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estructura de Commits -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            <i class="pi pi-git mr-2 text-green-500"></i>
            Estructura de Commits
          </h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Cada commit tiene las siguientes propiedades:</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><code class="text-sm">commit.type</code> - feat, fix, docs, style, refactor, perf, test</div>
              <div><code class="text-sm">commit.subject</code> - Descripción del commit</div>
              <div><code class="text-sm">commit.hash</code> - Hash completo del commit</div>
              <div><code class="text-sm">commit.author</code> - Autor del commit</div>
              <div><code class="text-sm">commit.scope</code> - Scope del commit (opcional)</div>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            <i class="pi pi-filter mr-2 text-purple-500"></i>
            Filtros Útiles
          </h3>
          <div class="space-y-3">
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <code class="text-purple-600 dark:text-purple-400">{{ openBrace }}date | date: "%Y-%m-%d"{{ closeBrace }}</code>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Formatear fechas</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <code class="text-purple-600 dark:text-purple-400">{{ openBrace }}commits | size{{ closeBrace }}</code>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Contar elementos en un array</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <code class="text-purple-600 dark:text-purple-400">{{ openBrace }}commit.hash | slice: 0, 7{{ closeBrace }}</code>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Tomar los primeros 7 caracteres</p>
            </div>
          </div>
        </div>

        <!-- Bucles y Condiciones -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            <i class="pi pi-replay mr-2 text-orange-500"></i>
            Bucles y Condiciones
          </h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <pre class="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto"><code>{% for commit in commits %}
{% if commit.type == 'feat' %}
- {{ openBrace }}commit.subject{{ closeBrace }} ({{ openBrace }}commit.hash | slice: 0, 7{{ closeBrace }})
{% endif %}
{% endfor %}</code></pre>
          </div>
        </div>

        <!-- Ejemplo Completo -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            <i class="pi pi-file-edit mr-2 text-red-500"></i>
            Ejemplo Completo
          </h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <pre class="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto"><code># Release Notes v{{ openBrace }}version{{ closeBrace }}

**Fecha:** {{ openBrace }}date | date: "%d de %B de %Y"{{ closeBrace }}
**Tipo:** {{ openBrace }}type{{ closeBrace }}

## 🚀 Nuevas Características
{% for commit in commits %}
{% if commit.type == 'feat' %}
- {{ openBrace }}commit.subject{{ closeBrace }} por {{ openBrace }}commit.author{{ closeBrace }}
{% endif %}
{% endfor %}

**Total de commits:** {{ openBrace }}commits | size{{ closeBrace }}</code></pre>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Diálogo de Datos de Ejemplo -->
    <Dialog 
      v-model:visible="showSampleDataDialog" 
      modal 
      :header="'Datos de Ejemplo - Vista Previa'" 
      :style="{ width: '50rem' }" 
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Datos que se usan en el preview:</h4>
          <pre class="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">{{ JSON.stringify(previewData, null, 2) }}</pre>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Nota:</strong> Estos son datos de ejemplo para probar tu template. En producción se usarán los datos reales del repositorio Git.</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
// Usar editor simple por defecto para evitar problemas de memoria
// Para Monaco Editor usar: '../components/TemplateEditorOptimized.vue'
import TemplateEditor from '../components/TemplateEditorSimple.vue'
import { useTemplatesStore } from '../store'

// Store
const templatesStore = useTemplatesStore()

// Variables para mostrar la sintaxis de Liquid sin confundir a Vue
const openBrace = '{{'
const closeBrace = '}}'

// Ref al componente editor
const templateEditorRef = ref(null)

// Computed properties para obtener datos del store
const templates = computed(() => templatesStore.templates)
const predefinedTemplates = computed(() => templatesStore.predefinedTemplates)
const isLoading = computed(() => templatesStore.loading)

// Usar solo templates ya que loadTemplates() carga todos (predefined + custom)
const allTemplates = computed(() => {
  return templates.value
})

// Control de los diálogos
const showPredefinedDialog = ref(false)
const showNewTemplateDialog = ref(false)
const newTemplateName = ref('')
const newTemplateDescription = ref('')
const showLiquidDocsDialog = ref(false)
const showSampleDataDialog = ref(false)

// Datos de ejemplo para mostrar al usuario
const previewData = {
  version: '1.2.0',
  date: new Date(),
  type: 'minor',
  commits: [
    {
      type: 'feat',
      subject: 'Agregar autenticación de usuario',
      hash: 'a1b2c3d4e5f6789',
      author: 'Juan Pérez',
      scope: 'auth'
    },
    {
      type: 'feat', 
      subject: 'Implementar dashboard de métricas',
      hash: 'b2c3d4e5f6a1234',
      author: 'María García',
      scope: 'dashboard'
    },
    {
      type: 'fix',
      subject: 'Corregir pérdida de memoria en componente',
      hash: 'f6e5d4c3b2a1567',
      author: 'Carlos López',
      scope: 'ui'
    },
    {
      type: 'fix',
      subject: 'Resolver problema de conexión a la base de datos',
      hash: 'c7d8e9f0a1b2345',
      author: 'Ana Martínez',
      scope: 'database'
    },
    {
      type: 'docs',
      subject: 'Actualizar documentación de la API',
      hash: 'b2c3d4e5f6a1890',
      author: 'Pedro Sánchez',
      scope: 'api'
    }
  ]
}

const newTemplate = () => {
  if (templateEditorRef.value && templateEditorRef.value.setEditorContent) {
    const emptyTemplate = `# Release Notes v${openBrace}version${closeBrace}

## Características

## Correcciones

## Cambios

---
_Generado el ${openBrace}date | date: "%Y-%m-%d"${closeBrace}_`
    
    templateEditorRef.value.setEditorContent(emptyTemplate)
  } else {
    console.warn('No se puede acceder al editor directamente')
  }
}

const loadPredefinedTemplate = () => {
  showPredefinedDialog.value = true
}

const selectTemplate = (template) => {
  if (templateEditorRef.value && templateEditorRef.value.setEditorContent) {
    templateEditorRef.value.setEditorContent(template.content)
  }
  showPredefinedDialog.value = false
}

const confirmDeleteTemplate = async (template) => {
  const confirmed = confirm(`¿Estás seguro de que quieres eliminar el template "${template.name}"?\n\nEsta acción no se puede deshacer.`)
  
  if (confirmed) {
    try {
      await templatesStore.deleteTemplate(template.id)
      await templatesStore.loadTemplates() // Recargar la lista
      alert(`✅ Template "${template.name}" eliminado exitosamente!`)
    } catch (error) {
      console.error('Error deleting template:', error)
      alert(`❌ Error eliminando template: ${error.message}`)
    }
  }
}

const showLiquidDocs = () => {
  showLiquidDocsDialog.value = true
}

const showSampleData = () => {
  showSampleDataDialog.value = true
}

const exportTemplate = async () => {
  if (!templateEditorRef.value || !templateEditorRef.value.getEditorContent) {
    alert('❌ No hay template para exportar')
    return
  }

  try {
    // Obtener el contenido del editor Monaco
    const content = templateEditorRef.value.getEditorContent()
    
    if (!content.trim()) {
      alert('❌ El template está vacío')
      return
    }

    // Usar la API de Electron para guardar archivo
    const dialogResult = await window.electronAPI?.saveFileDialog?.({
      title: 'Exportar Template',
      defaultPath: `release-template-${new Date().toISOString().slice(0,10)}.liquid`,
      filters: [
        { name: 'Templates Liquid', extensions: ['liquid'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    })
    
    if (dialogResult && !dialogResult.canceled && dialogResult.filePath) {
      // Escribir el archivo
      const writeResult = await window.electronAPI?.writeFile?.(dialogResult.filePath, content)
      
      if (writeResult?.success) {
        alert(`✅ Template exportado exitosamente en:\n${dialogResult.filePath}`)
      } else {
        alert(`❌ Error exportando el template:\n${writeResult?.error || 'Error desconocido'}`)
      }
    }
  } catch (error) {
    console.error('Error exporting template:', error)
    alert(`❌ Error inesperado:\n${error.message}`)
  }
}

const saveCustomTemplate = async () => {
  if (!templateEditorRef.value || !templateEditorRef.value.getEditorContent) {
    alert('❌ No hay template para guardar')
    return
  }

  try {
    const content = templateEditorRef.value.getEditorContent()
    
    if (!content.trim()) {
      alert('❌ El template está vacío')
      return
    }

    const templateData = {
      name: newTemplateName.value.trim(),
      description: newTemplateDescription.value.trim() || '',
      content: content,
      category: 'custom'
    }

    await templatesStore.saveTemplate(templateData)
    
    // Recargar templates para mostrar el nuevo inmediatamente
    await templatesStore.loadTemplates()
    
    // Cerrar diálogo y limpiar campos
    showNewTemplateDialog.value = false
    newTemplateName.value = ''
    newTemplateDescription.value = ''
    
    alert(`✅ Template "${templateData.name}" guardado exitosamente!`)
    
  } catch (error) {
    console.error('Error saving template:', error)
    alert(`❌ Error guardando template: ${error.message}`)
  }
}

const importTemplate = async () => {
  try {
    // Usar la API de Electron para abrir archivo
    const dialogResult = await window.electronAPI?.openFileDialog?.({
      title: 'Importar Template',
      filters: [
        { name: 'Templates Liquid', extensions: ['liquid'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    })

    if (dialogResult?.cancelled || !dialogResult?.filePaths?.length) {
      return
    }

    const filePath = dialogResult.filePaths[0]
    const content = await templatesStore.importTemplate(filePath)
    
    if (content && templateEditorRef.value && templateEditorRef.value.setEditorContent) {
      templateEditorRef.value.setEditorContent(content)
      alert('✅ Template importado exitosamente!')
    } else {
      alert('❌ No se pudo cargar el contenido del template')
    }
    
  } catch (error) {
    console.error('Error importing template:', error)
    alert(`❌ Error importando template: ${error.message}`)
  }
}

// Cargar datos cuando se monta el componente
onMounted(async () => {
  console.log('Loading templates...')
  await templatesStore.loadTemplates() // Esto ya carga todos los templates
  console.log('Templates loaded:', templatesStore.templates)
})
</script>