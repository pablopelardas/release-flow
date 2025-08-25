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
                  @click="toggleEditorMode" 
                  :icon="useMonaco ? 'pi pi-code' : 'pi pi-file-edit'" 
                  size="small" 
                  outlined
                  v-tooltip="useMonaco ? 'Cambiar a editor simple' : 'Cambiar a Monaco Editor'"
                />
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
          
          <!-- Editor Container -->
          <div class="flex-1 relative">
            <!-- Simple Textarea (default) -->
            <textarea
              v-if="!useMonaco"
              v-model="templateContent"
              @input="onContentChange"
              class="w-full h-full p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-0 resize-none focus:outline-none"
              placeholder="Escribe tu template aquí..."
            ></textarea>
            
            <!-- Monaco Editor (lazy loaded) -->
            <div v-else ref="editorContainer" class="h-full w-full"></div>
            
            <!-- Loading indicator -->
            <div v-if="loadingMonaco" class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
              <div class="text-center">
                <i class="pi pi-spin pi-spinner text-2xl text-primary-500 mb-2"></i>
                <p class="text-sm text-gray-600 dark:text-gray-400">Cargando editor avanzado...</p>
              </div>
            </div>
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Liquid } from 'liquidjs'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Button from 'primevue/button'

// Template por defecto
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

---
**Commits incluidos:** {{ commits | size }}
**Generado automáticamente por ReleaseFlow**`

// Estado del componente
const templateContent = ref(DEFAULT_TEMPLATE)
const previewContent = ref('')
const editorContainer = ref(null)
const useMonaco = ref(false)
const loadingMonaco = ref(false)
let editor = null
let monacoModule = null
let isDisposed = false

// Inicializar Liquid.js
const liquid = new Liquid()

// Datos de ejemplo
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
      type: 'fix',
      subject: 'Corregir pérdida de memoria',
      hash: 'f6e5d4c3b2a1567',
      author: 'Carlos López',
      scope: 'ui'
    },
    {
      type: 'docs',
      subject: 'Actualizar documentación',
      hash: 'b2c3d4e5f6a1890',
      author: 'Pedro Sánchez',
      scope: 'api'
    }
  ]
}

// Debounce timer
let debounceTimer = null

const onContentChange = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    refreshPreview()
  }, 500)
}

const toggleEditorMode = async () => {
  if (!useMonaco.value) {
    // Cambiar a Monaco
    useMonaco.value = true
    loadingMonaco.value = true
    await nextTick()
    await initializeMonaco()
    loadingMonaco.value = false
  } else {
    // Cambiar a textarea simple
    if (editor) {
      templateContent.value = editor.getValue()
      disposeMonaco()
    }
    useMonaco.value = false
  }
}

const initializeMonaco = async () => {
  if (!editorContainer.value || isDisposed) return
  
  try {
    // Cargar Monaco de forma lazy solo cuando se necesita
    if (!monacoModule) {
      monacoModule = await import('monaco-editor')
    }
    
    if (isDisposed) return // Verificar nuevamente después del import
    
    // Configurar tema
    monacoModule.editor.defineTheme('vs-dark-custom', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1f2937',
        'editor.foreground': '#f3f4f6',
      }
    })
    
    // Crear editor con configuración mínima
    editor = monacoModule.editor.create(editorContainer.value, {
      value: templateContent.value,
      language: 'markdown',
      theme: 'vs-dark-custom',
      automaticLayout: true,
      wordWrap: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      folding: false, // Desactivar folding para reducir memoria
      renderWhitespace: 'none', // Reducir renderizado
      padding: { top: 10, bottom: 10 },
      // Opciones de rendimiento
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      wordBasedSuggestions: false,
      contextmenu: false,
      renderLineHighlight: 'none',
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 2
    })
    
    // Escuchar cambios
    editor.onDidChangeModelContent(() => {
      if (!isDisposed) {
        templateContent.value = editor.getValue()
        onContentChange()
      }
    })
    
  } catch (error) {
    console.error('Error inicializando Monaco:', error)
    useMonaco.value = false
    loadingMonaco.value = false
  }
}

const disposeMonaco = () => {
  if (editor) {
    try {
      editor.dispose()
      editor = null
    } catch (error) {
      console.error('Error disposing Monaco:', error)
    }
  }
}

const refreshPreview = async () => {
  try {
    const processedContent = await liquid.parseAndRender(templateContent.value, sampleData)
    
    // Convertir Markdown a HTML con soporte dark mode
    let htmlContent = processedContent
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">$1</h2>')
      .replace(/^\*\*(.+):\*\* (.+)$/gm, '<p class="mb-2 text-gray-700 dark:text-gray-300"><strong class="text-gray-900 dark:text-white">$1:</strong> $2</p>')
      .replace(/^- (.+)$/gm, '<li class="mb-1 ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>')
      .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
      // Procesar negritas en línea
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
    
    // Procesar listas y párrafos
    const lines = htmlContent.split('\n')
    let result = []
    let inList = false
    let currentParagraph = []
    
    for (let line of lines) {
      line = line.trim()
      
      if (line.includes('<li')) {
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
        if (currentParagraph.length > 0) {
          result.push(`<p class="mb-2 text-gray-700 dark:text-gray-300">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
      } else if (line.length > 0) {
        currentParagraph.push(line)
      }
    }
    
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
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-700">${error.message}</p>
      </div>
    `
  }
}

const loadTemplate = async () => {
  try {
    const result = await window.electronAPI?.openFileDialog?.({
      title: 'Cargar Template',
      filters: [
        { name: 'Templates', extensions: ['liquid', 'md', 'txt'] }
      ]
    })
    
    if (result && !result.canceled && result.filePaths?.length > 0) {
      const fileResult = await window.electronAPI?.readFile?.(result.filePaths[0])
      
      if (fileResult?.success) {
        templateContent.value = fileResult.content
        if (editor) {
          editor.setValue(fileResult.content)
        }
        refreshPreview()
      }
    }
  } catch (error) {
    console.error('Error loading template:', error)
  }
}

const saveTemplate = async () => {
  try {
    const content = editor ? editor.getValue() : templateContent.value
    
    const dialogResult = await window.electronAPI?.saveFileDialog?.({
      title: 'Guardar Template',
      defaultPath: 'release-template.liquid',
      filters: [
        { name: 'Templates Liquid', extensions: ['liquid'] },
        { name: 'Markdown', extensions: ['md'] }
      ]
    })
    
    if (dialogResult && !dialogResult.canceled && dialogResult.filePath) {
      const writeResult = await window.electronAPI?.writeFile?.(dialogResult.filePath, content)
      
      if (writeResult?.success) {
        alert(`✅ Template guardado exitosamente`)
      }
    }
  } catch (error) {
    console.error('Error saving template:', error)
  }
}

// Métodos expuestos
const setEditorContent = (content) => {
  templateContent.value = content
  if (editor) {
    editor.setValue(content)
  }
  refreshPreview()
}

const getEditorContent = () => {
  if (editor) {
    return editor.getValue()
  }
  return templateContent.value
}

// Exponer métodos
defineExpose({
  setEditorContent,
  getEditorContent
})

// Lifecycle
onMounted(() => {
  refreshPreview()
})

onUnmounted(() => {
  isDisposed = true
  clearTimeout(debounceTimer)
  disposeMonaco()
})

// Watch para actualizar Monaco si está activo
watch(templateContent, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue)
  }
})
</script>

<style scoped>
.template-editor {
  @apply w-full h-full;
}

textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

:deep(.monaco-editor) {
  border-radius: 0;
}
</style>