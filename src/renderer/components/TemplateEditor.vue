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
                  icon="pi pi-folder-open" 
                  size="small" 
                  outlined
                  v-tooltip="'Cargar template'"
                />
                <Button 
                  @click="saveTemplate" 
                  icon="pi pi-save" 
                  size="small" 
                  outlined
                  v-tooltip="'Guardar template'"
                />
              </div>
            </div>
          </div>
          
          <!-- Monaco Editor Container -->
          <div class="flex-1 relative">
            <div ref="editorContainer" class="h-full w-full"></div>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { Liquid } from 'liquidjs'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Button from 'primevue/button'

// Template por defecto con sintaxis Liquid
const DEFAULT_TEMPLATE = `# Release Notes v{{ version }}

**Fecha:** {{ date | date: "%B %d, %Y" }}
**Tipo:** {{ type }}

## 🚀 Nuevas Características
{% for commit in commits %}
{% if commit.type == 'feat' %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}
{% endfor %}

## 🐛 Correcciones
{% for commit in commits %}
{% if commit.type == 'fix' %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}
{% endfor %}

## 📝 Documentación
{% for commit in commits %}
{% if commit.type == 'docs' %}
- {{ commit.subject }} ({{ commit.hash | slice: 0, 7 }})
{% endif %}
{% endfor %}

---
**Commits incluidos:** {{ commits | size }}
**Generado automáticamente por ReleaseFlow**`

// Inicializar Liquid.js con filtros personalizados
const liquid = new Liquid()

// Datos de ejemplo más completos para el preview
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
    },
    {
      type: 'style',
      subject: 'Mejorar estilos del header',
      hash: 'd3e4f5g6h7i8901',
      author: 'Lucía Ruiz',
      scope: 'ui'
    },
    {
      type: 'perf',
      subject: 'Optimizar carga de imágenes',
      hash: 'e4f5g6h7i8j9012',
      author: 'Roberto Torres',
      scope: 'performance'
    }
  ]
}

const editorContainer = ref(null)
const previewContent = ref('')
let editor = null

const initializeEditor = async () => {
  if (!editorContainer.value) return

  // Configurar tema personalizado para modo oscuro
  monaco.editor.defineTheme('vs-dark-custom', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1f2937',
      'editor.foreground': '#f3f4f6',
    }
  })

  // Crear instancia del editor
  editor = monaco.editor.create(editorContainer.value, {
    value: DEFAULT_TEMPLATE,
    language: 'markdown',
    theme: 'vs-dark-custom',
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    folding: true,
    renderWhitespace: 'boundary',
    padding: { top: 10, bottom: 10 }
  })

  // Escuchar cambios en el contenido
  editor.onDidChangeModelContent(() => {
    refreshPreview()
  })

  // Preview inicial
  refreshPreview()
}

const refreshPreview = async () => {
  if (!editor) return

  try {
    const template = editor.getValue()
    
    // Usar LiquidJS para procesar el template
    const processedContent = await liquid.parseAndRender(template, sampleData)
    
    // Convertir Markdown a HTML para preview
    let htmlContent = processedContent
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">$1</h3>')
      .replace(/^\*\*(.+):\*\* (.+)$/gm, '<p class="mb-2"><strong class="text-gray-900 dark:text-white">$1:</strong> <span class="text-gray-700 dark:text-gray-300">$2</span></p>')
      .replace(/^- (.+)$/gm, '<li class="mb-1 ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>')
      .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
      .replace(/🚀|🐛|📝|✨|⚡|🎨|🔧/g, '<span class="text-xl">$&</span>')
    
    // Agrupar líneas en párrafos y listas
    const lines = htmlContent.split('\n')
    let result = []
    let inList = false
    let currentParagraph = []
    
    for (let line of lines) {
      line = line.trim()
      
      if (line.startsWith('<li')) {
        if (currentParagraph.length > 0) {
          result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
        if (!inList) {
          result.push('<ul class="mb-4">')
          inList = true
        }
        result.push(line)
      } else if (line.startsWith('<h') || line.startsWith('<hr') || line.startsWith('<p')) {
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
        if (inList) {
          result.push('</ul>')
          inList = false
        }
        if (currentParagraph.length > 0) {
          result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
      } else if (line.length > 0) {
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
    
    previewContent.value = `<div class="space-y-4">${result.join('\n')}</div>`
    
  } catch (error) {
    console.error('Error procesando template con Liquid.js:', error)
    previewContent.value = `
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 class="text-red-800 dark:text-red-200 font-medium mb-2">Error en el Template</h3>
        <p class="text-red-700 dark:text-red-300 text-sm">${error.message}</p>
        <p class="text-red-600 dark:text-red-400 text-xs mt-2">Revisa la sintaxis Liquid de tu template.</p>
      </div>
    `
  }
}

const loadTemplate = async () => {
  try {
    // Usar la API de Electron para abrir diálogo de archivo
    const result = await window.electronAPI?.openFileDialog?.({
      title: 'Cargar Template',
      filters: [
        { name: 'Templates Liquid', extensions: ['liquid', 'md', 'txt'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    })
    
    if (result && !result.canceled && result.filePaths?.length > 0) {
      const filePath = result.filePaths[0]
      console.log('Cargando template desde:', filePath)
      
      // Leer el contenido real del archivo
      const fileResult = await window.electronAPI?.readFile?.(filePath)
      
      if (fileResult?.success) {
        if (editor) {
          editor.setValue(fileResult.content)
        }
        console.log('Template cargado exitosamente')
      } else {
        console.error('Error leyendo archivo:', fileResult?.error)
        // Cargar template de ejemplo si hay error
        const exampleTemplate = `# Release Notes v{{ version }}

**Release Date:** {{ date | date: "%Y-%m-%d" }}
**Release Type:** {{ type }}

## ✨ What's New
{% for commit in commits %}
{% if commit.type == 'feat' %}
- {{ commit.subject }} by {{ commit.author }}
{% endif %}
{% endfor %}

## 🐛 Bug Fixes
{% for commit in commits %}
{% if commit.type == 'fix' %}
- {{ commit.subject }} ({{ commit.scope }})
{% endif %}
{% endfor %}

## Performance Improvements
{% for commit in commits %}
{% if commit.type == 'perf' %}
- {{ commit.subject }}
{% endif %}
{% endfor %}

---
Generated automatically by ReleaseFlow from {{ commits | size }} commits.`

        if (editor) {
          editor.setValue(exampleTemplate)
        }
      }
    }
  } catch (error) {
    console.error('Error loading template:', error)
    if (editor) {
      editor.setValue('# Error cargando template\n\n**Error:** No se pudo cargar el archivo seleccionado.')
    }
  }
}

const saveTemplate = async () => {
  if (!editor) return
  
  try {
    const content = editor.getValue()
    
    // Usar la API de Electron para guardar archivo
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
      console.log('Guardando template en:', dialogResult.filePath)
      
      // Escribir realmente el archivo al disco
      const writeResult = await window.electronAPI?.writeFile?.(dialogResult.filePath, content)
      
      if (writeResult?.success) {
        alert(`✅ Template guardado exitosamente en:\n${dialogResult.filePath}`)
        console.log('Archivo guardado correctamente')
      } else {
        console.error('Error escribiendo archivo:', writeResult?.error)
        alert(`❌ Error guardando el archivo:\n${writeResult?.error || 'Error desconocido'}`)
      }
    }
  } catch (error) {
    console.error('Error saving template:', error)
    alert(`❌ Error inesperado:\n${error.message}`)
  }
}

// Métodos expuestos para que el componente padre pueda interactuar
const setEditorContent = (content) => {
  if (editor) {
    editor.setValue(content)
    refreshPreview()
  }
}

const getEditorContent = () => {
  if (editor) {
    return editor.getValue()
  }
  return ''
}

// Exponer métodos al componente padre
defineExpose({
  setEditorContent,
  getEditorContent
})

onMounted(async () => {
  await nextTick()
  initializeEditor()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped>
.template-editor {
  @apply w-full h-full;
}

/* Asegurar que Monaco Editor respete el contenedor */
:deep(.monaco-editor) {
  border-radius: 0;
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