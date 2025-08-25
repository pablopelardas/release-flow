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
          label="Templates Predefinidos" 
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
            <i class="pi pi-download text-3xl text-purple-500 mb-3"></i>
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Exportar Template</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Guarda y comparte tus templates personalizados
            </p>
            <Button 
              label="Exportar" 
              text 
              size="small" 
              @click="exportTemplate"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Diálogo de Templates Predefinidos -->
    <Dialog 
      v-model:visible="showPredefinedDialog" 
      modal 
      :header="'Seleccionar Template Predefinido'" 
      :style="{ width: '50rem' }" 
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div class="space-y-4">
        <div v-for="template in predefinedTemplates" :key="template.name">
          <Card class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
                @click="selectTemplate(template)">
            <template #content>
              <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ template.name }}</h3>
                  <Button 
                    icon="pi pi-arrow-right" 
                    size="small" 
                    text 
                    @click.stop="selectTemplate(template)"
                  />
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ template.description }}</p>
              </div>
            </template>
          </Card>
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
import { ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
// Usar editor simple por defecto para evitar problemas de memoria
// Para Monaco Editor usar: '../components/TemplateEditorOptimized.vue'
import TemplateEditor from '../components/TemplateEditorSimple.vue'

// Variables para mostrar la sintaxis de Liquid sin confundir a Vue
const openBrace = '{{'
const closeBrace = '}}'

// Ref al componente editor
const templateEditorRef = ref(null)

// Control de los diálogos
const showPredefinedDialog = ref(false)
const showLiquidDocsDialog = ref(false)
const showSampleDataDialog = ref(false)

// Templates predefinidos
const predefinedTemplates = [
  {
    name: 'Release Notes Estándar',
    description: 'Template formal para release notes',
    content: `# Release Notes v{{ version }}

**Fecha de Lanzamiento:** {{ date | date: "%d de %B de %Y" }}
**Tipo de Release:** {{ type }}

## 🚀 Nuevas Características
{% for commit in commits %}
{% if commit.type == 'feat' %}
- {{ commit.subject }} (#{{ commit.hash | slice: 0, 7 }})
{% endif %}
{% endfor %}

## 🐛 Correcciones
{% for commit in commits %}
{% if commit.type == 'fix' %}
- {{ commit.subject }} (#{{ commit.hash | slice: 0, 7 }})
{% endif %}
{% endfor %}

## 📝 Documentación
{% for commit in commits %}
{% if commit.type == 'docs' %}
- {{ commit.subject }}
{% endif %}
{% endfor %}

---
_Generado automáticamente por ReleaseFlow_`
  },
  {
    name: 'Changelog Técnico',
    description: 'Para desarrolladores y equipos técnicos',
    content: `# CHANGELOG

## [{{ version }}] - {{ date | date: "%Y-%m-%d" }}

### Added
{% for commit in commits %}{% if commit.type == 'feat' %}
- {{ commit.subject }} ({{ commit.author }})
{% endif %}{% endfor %}

### Fixed
{% for commit in commits %}{% if commit.type == 'fix' %}
- [{{ commit.scope }}] {{ commit.subject }}
{% endif %}{% endfor %}

### Changed
{% for commit in commits %}{% if commit.type == 'refactor' %}
- {{ commit.subject }}
{% endif %}{% endfor %}

### Performance
{% for commit in commits %}{% if commit.type == 'perf' %}
- {{ commit.subject }}
{% endif %}{% endfor %}

Total commits: {{ commits | size }}`
  },
  {
    name: 'Release Marketing',
    description: 'Para comunicación con clientes',
    content: `# 🎉 Nueva Versión {{ version }} Disponible!

¡Nos complace anunciar el lanzamiento de la versión **{{ version }}** de nuestro producto!

## ✨ Lo Nuevo

{% for commit in commits %}
{% if commit.type == 'feat' %}
**{{ commit.subject }}**
Mejoramos la experiencia para que puedas trabajar de manera más eficiente.

{% endif %}
{% endfor %}

## 🔧 Mejoras y Correcciones

Hemos solucionado varios problemas reportados por nuestros usuarios:
{% for commit in commits %}
{% if commit.type == 'fix' %}
- {{ commit.subject }}
{% endif %}
{% endfor %}

## 📅 Fecha de Lanzamiento
{{ date | date: "%d de %B de %Y" }}

¡Gracias por tu continuo apoyo!`
  },
  {
    name: 'Minimal',
    description: 'Template minimalista y limpio',
    content: `{{ version }} ({{ date | date: "%Y-%m-%d" }})

{% for commit in commits %}
- {{ commit.type }}: {{ commit.subject }}
{% endfor %}`
  }
]

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
</script>