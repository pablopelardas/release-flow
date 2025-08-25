<template>
  <div class="template-editor h-full">
    <Splitter style="height: 600px" class="rounded-lg border border-gray-200 dark:border-gray-700">
      <SplitterPanel :size="50" :minSize="30">
        <div class="h-full flex flex-col">
          <!-- Editor Header -->
          <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Editor de Templates</h3>
              <div class="flex space-x-2">
                <Button 
                  @click="loadTemplate" 
                  icon="pi pi-upload" 
                  size="small" 
                  outlined
                  v-tooltip="'Importar template'"
                />
                <Button 
                  @click="saveTemplate" 
                  icon="pi pi-download" 
                  size="small" 
                  outlined
                  v-tooltip="'Exportar template'"
                />
              </div>
            </div>
          </div>
          
          <!-- Simple Textarea Editor (reemplaza Monaco temporalmente) -->
          <div class="flex-1 relative p-4 bg-white dark:bg-gray-900">
            <textarea
              v-model="templateContent"
              @input="onContentChange"
              class="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Escribe tu template aquí...

Usa sintaxis Liquid:
{{ version }} - Versión del release
{{ date | date: '%Y-%m-%d' }} - Fecha formateada
{% for commit in commits %}
  - {{ commit.subject }}
{% endfor %}"
            ></textarea>
          </div>
        </div>
      </SplitterPanel>
      
      <SplitterPanel :size="50" :minSize="30">
        <div class="h-full flex flex-col">
          <!-- Preview Header -->
          <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Preview</h3>
              <Button 
                @click="refreshPreview" 
                icon="pi pi-refresh" 
                size="small" 
                outlined
                v-tooltip="'Actualizar preview'"
              />
            </div>
          </div>
          
          <!-- Preview Content -->
          <div class="flex-1 p-4 bg-white dark:bg-gray-900 overflow-auto">
            <div 
              v-if="previewContent" 
              class="prose prose-sm dark:prose-invert max-w-none"
              v-html="previewContent"
            ></div>
            <div 
              v-else 
              class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
            >
              <div class="text-center">
                <i class="pi pi-file-edit text-4xl mb-3"></i>
                <p>El preview aparecerá aquí</p>
              </div>
            </div>
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Liquid } from 'liquidjs'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Button from 'primevue/button'

// Template por defecto con sintaxis Liquid
const DEFAULT_TEMPLATE = `# Release Notes v{{ version }}

**Fecha:** {{ date | date: "%B %d, %Y" }}
**Tipo:** {{ type }}

{% assign has_feat = false %}
{% assign has_fix = false %}
{% assign has_docs = false %}
{% assign has_chore = false %}
{% assign has_other = false %}

{% for commit in commits %}
  {% if commit.type == "feat" %}{% assign has_feat = true %}{% endif %}
  {% if commit.type == "fix" %}{% assign has_fix = true %}{% endif %}
  {% if commit.type == "docs" %}{% assign has_docs = true %}{% endif %}
  {% if commit.type == "chore" %}{% assign has_chore = true %}{% endif %}
  {% unless commit.type == "feat" or commit.type == "fix" or commit.type == "docs" or commit.type == "chore" %}{% assign has_other = true %}{% endunless %}
{% endfor %}

{% if has_feat %}
## 🚀 Nuevas Características
{% for commit in commits %}{% if commit.type == "feat" %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}{% endfor %}

{% endif %}
{% if has_fix %}
## 🐛 Correcciones
{% for commit in commits %}{% if commit.type == "fix" %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}{% endfor %}

{% endif %}
{% if has_docs %}
## 📝 Documentación
{% for commit in commits %}{% if commit.type == "docs" %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}{% endfor %}

{% endif %}
{% if has_chore %}
## 🔧 Mantenimiento
{% for commit in commits %}{% if commit.type == "chore" %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}{% endfor %}

{% endif %}
{% if has_other %}
## 📝 Otros Cambios
{% for commit in commits %}{% unless commit.type == "feat" or commit.type == "fix" or commit.type == "docs" or commit.type == "chore" %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endunless %}{% endfor %}

{% endif %}
---
**Commits incluidos:** {{ commits | size }}
**Generado automáticamente por ReleaseFlow**`

// Inicializar Liquid.js
const liquid = new Liquid()

// Datos de ejemplo para el preview
const sampleData = {
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

// Estado del componente
const templateContent = ref(DEFAULT_TEMPLATE)
const previewContent = ref('')

// Debounce timer para evitar demasiadas actualizaciones
let debounceTimer = null

const onContentChange = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    refreshPreview()
  }, 500) // Actualizar preview después de 500ms sin escribir
}

const refreshPreview = async () => {
  try {
    const processedContent = await liquid.parseAndRender(templateContent.value, sampleData)
    
    // Convertir Markdown a HTML con soporte completo para dark mode
    let htmlContent = processedContent
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">$1</h3>')
      .replace(/^\*\*(.+):\*\* (.+)$/gm, '<p class="mb-2 text-gray-700 dark:text-gray-300"><strong class="text-gray-900 dark:text-white">$1:</strong> <span class="text-gray-700 dark:text-gray-300">$2</span></p>')
      .replace(/^- (.+)$/gm, '<li class="mb-1 ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>')
      .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
      .replace(/🚀|🐛|📝|✨|⚡|🎨|🔧|🎉|📅|🔧/g, '<span class="text-xl">$&</span>')
      // Procesar negritas en línea
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
      // Procesar itálicas
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
    
    // Procesar listas y párrafos
    const lines = htmlContent.split('\n')
    let result = []
    let inList = false
    let currentParagraph = []
    
    for (let line of lines) {
      line = line.trim()
      
      if (line.startsWith('<li')) {
        // Procesar elementos de lista
        if (currentParagraph.length > 0) {
          result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
        if (!inList) {
          result.push('<ul class="mb-4 text-gray-700 dark:text-gray-300">')
          inList = true
        }
        result.push(line)
      } else if (line.startsWith('<h') || line.startsWith('<hr') || line.startsWith('<p')) {
        // Elementos que ya tienen formato
        if (inList) {
          result.push('</ul>')
          inList = false
        }
        if (currentParagraph.length > 0) {
          result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
        result.push(line)
      } else if (line === '') {
        // Línea vacía - cerrar párrafo actual
        if (inList) {
          result.push('</ul>')
          inList = false
        }
        if (currentParagraph.length > 0) {
          result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
      } else if (line.length > 0) {
        // Texto normal - agregar al párrafo actual
        currentParagraph.push(line)
      }
    }
    
    // Cerrar elementos pendientes
    if (inList) {
      result.push('</ul>')
    }
    if (currentParagraph.length > 0) {
      result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
    }
    
    previewContent.value = `<div class="space-y-4 text-gray-700 dark:text-gray-300">${result.join('\n')}</div>`
    
  } catch (error) {
    console.error('Error procesando template:', error)
    previewContent.value = `
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 class="text-red-800 dark:text-red-200 font-medium mb-2">Error en el Template</h3>
        <p class="text-red-700 dark:text-red-300 text-sm">${error.message}</p>
      </div>
    `
  }
}

const loadTemplate = async () => {
  try {
    const result = await window.electronAPI?.openFileDialog?.({
      title: 'Cargar Template',
      filters: [
        { name: 'Templates', extensions: ['liquid', 'md', 'txt'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    })
    
    if (result && !result.canceled && result.filePaths?.length > 0) {
      const filePath = result.filePaths[0]
      const fileResult = await window.electronAPI?.readFile?.(filePath)
      
      if (fileResult?.success) {
        templateContent.value = fileResult.content
        refreshPreview()
      }
    }
  } catch (error) {
    console.error('Error loading template:', error)
  }
}

const saveTemplate = async () => {
  try {
    const dialogResult = await window.electronAPI?.saveFileDialog?.({
      title: 'Guardar Template',
      defaultPath: 'release-template.liquid',
      filters: [
        { name: 'Templates Liquid', extensions: ['liquid'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    })
    
    if (dialogResult && !dialogResult.canceled && dialogResult.filePath) {
      const writeResult = await window.electronAPI?.writeFile?.(dialogResult.filePath, templateContent.value)
      
      if (writeResult?.success) {
        alert(`✅ Template guardado exitosamente en:\n${dialogResult.filePath}`)
      }
    }
  } catch (error) {
    console.error('Error saving template:', error)
  }
}

// Métodos expuestos
const setEditorContent = (content) => {
  templateContent.value = content
  refreshPreview()
}

const getEditorContent = () => {
  return templateContent.value
}

// Exponer métodos al componente padre
defineExpose({
  setEditorContent,
  getEditorContent
})

// Inicializar
onMounted(() => {
  refreshPreview()
})
</script>

<style scoped>
.template-editor {
  @apply w-full h-full;
}

/* Estilos para el textarea */
textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* Estilos para el preview */
:deep(.prose) {
  color: inherit;
}

:deep(.prose h1) {
  @apply text-gray-900 dark:text-white;
}

:deep(.prose h2) {
  @apply text-gray-800 dark:text-gray-100;
}

:deep(.prose p) {
  @apply text-gray-700 dark:text-gray-300;
}

:deep(.prose li) {
  @apply text-gray-700 dark:text-gray-300;
}

:deep(.prose strong) {
  @apply text-gray-900 dark:text-white;
}
</style>