import { defineStore } from 'pinia'

export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    templates: [],
    currentTemplate: null,
    predefinedTemplates: [],
    loading: false,
    error: null,
    previewData: {
      version: '1.0.0',
      date: new Date().toLocaleDateString('es-ES'),
      author: 'Usuario',
      repository: 'mi-proyecto',
      changes: [
        'Nueva funcionalidad importante',
        'Corrección de bugs críticos',
        'Mejoras en rendimiento',
      ],
      features: ['Feature 1', 'Feature 2'],
      fixes: ['Bug fix 1', 'Bug fix 2'],
      breaking: [],
    },
  }),

  getters: {
    templatesCount: (state) => state.templates.length,
    getTemplateById: (state) => (id) => state.templates.find(template => template.id === id),
    getTemplatesByCategory: (state) => (category) => 
      state.templates.filter(template => template.category === category),
    hasTemplates: (state) => state.templates.length > 0,
    activeTemplates: (state) => state.templates.filter(template => template.active),
  },

  actions: {
    setLoading(loading) {
      this.loading = loading
    },

    setError(error) {
      this.error = error
    },

    clearError() {
      this.error = null
    },

    async loadTemplates(category = null) {
      this.setLoading(true)
      this.clearError()
      
      try {
        const response = await window.electronAPI.dbGetTemplates(category)
        
        if (response.success) {
          this.templates = response.data.templates || []
        } else {
          throw new Error(response.error || 'Error loading templates')
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        this.setError(error.message)
      } finally {
        this.setLoading(false)
      }
    },

    async loadPredefinedTemplates() {
      this.clearError()
      
      try {
        // Cargar templates predefinidos desde el servicio
        const response = await window.electronAPI.templateLoad('predefined')
        
        if (response.success && response.data.templates) {
          this.predefinedTemplates = response.data.templates
        }
      } catch (error) {
        console.error('Error loading predefined templates:', error)
        // No es crítico si fallan los predefinidos
      }
    },

    async saveTemplate(templateData) {
      this.setLoading(true)
      this.clearError()
      
      try {
        // Validar template primero
        const validationResponse = await window.electronAPI.templateValidate(templateData.content)
        
        if (!validationResponse.success || !validationResponse.data.isValid) {
          throw new Error(
            validationResponse.data?.message || 
            validationResponse.data?.error || 
            'Template inválido'
          )
        }

        // Guardar en base de datos
        const response = await window.electronAPI.dbSaveTemplate({
          ...templateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          active: 1,
        })
        
        if (response.success) {
          const newTemplate = { ...templateData, id: response.data.id }
          
          // Añadir o actualizar en la lista local
          const existingIndex = this.templates.findIndex(t => t.id === newTemplate.id)
          if (existingIndex !== -1) {
            this.templates[existingIndex] = newTemplate
          } else {
            this.templates.push(newTemplate)
          }
          
          return newTemplate
        } else {
          throw new Error(response.error || 'Error saving template')
        }
      } catch (error) {
        console.error('Error saving template:', error)
        this.setError(error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async loadTemplate(templateId) {
      this.clearError()
      
      try {
        const response = await window.electronAPI.templateLoad(templateId)
        
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Error loading template')
        }
      } catch (error) {
        console.error('Error loading template:', error)
        this.setError(error.message)
        throw error
      }
    },

    async renderTemplate(templateContent, data = null) {
      this.clearError()
      
      try {
        const renderData = data || this.previewData
        const response = await window.electronAPI.templateRender(templateContent, renderData)
        
        if (response.success) {
          return response.data.output || response.data
        } else {
          throw new Error(response.error || 'Error rendering template')
        }
      } catch (error) {
        console.error('Error rendering template:', error)
        this.setError(error.message)
        throw error
      }
    },

    async validateTemplate(templateContent) {
      this.clearError()
      
      try {
        const response = await window.electronAPI.templateValidate(templateContent)
        
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Error validating template')
        }
      } catch (error) {
        console.error('Error validating template:', error)
        this.setError(error.message)
        throw error
      }
    },

    async previewTemplate(templateContent, data = null) {
      this.clearError()
      
      try {
        const previewData = data || this.previewData
        const response = await window.electronAPI.templatePreview(templateContent, previewData)
        
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Error previewing template')
        }
      } catch (error) {
        console.error('Error previewing template:', error)
        this.setError(error.message)
        throw error
      }
    },

    setCurrentTemplate(template) {
      this.currentTemplate = template
    },

    clearCurrentTemplate() {
      this.currentTemplate = null
    },

    updatePreviewData(newData) {
      this.previewData = { ...this.previewData, ...newData }
    },

    async exportTemplate(template, filePath) {
      this.clearError()
      
      try {
        const response = await window.electronAPI.writeFile(filePath, template.content)
        
        if (!response.success) {
          throw new Error(response.error || 'Error exporting template')
        }
        
        return true
      } catch (error) {
        console.error('Error exporting template:', error)
        this.setError(error.message)
        throw error
      }
    },

    async importTemplate(filePath) {
      this.clearError()
      
      try {
        const response = await window.electronAPI.readFile(filePath)
        
        if (response.success) {
          return response.content
        } else {
          throw new Error(response.error || 'Error importing template')
        }
      } catch (error) {
        console.error('Error importing template:', error)
        this.setError(error.message)
        throw error
      }
    },

    getBuiltinTemplates() {
      return [
        {
          id: 'basic-release',
          name: 'Release Básico',
          category: 'release',
          description: 'Template básico para releases',
          content: `# Release {{ version }}

{{ date }}

## Cambios
{% for change in changes %}
- {{ change }}
{% endfor %}

## Instalación
\`\`\`bash
npm install {{ repository }}@{{ version }}
\`\`\``,
        },
        {
          id: 'full-release',
          name: 'Release Completo',
          category: 'release',
          description: 'Template completo con todas las secciones',
          content: `# 🚀 {{ repository }} v{{ version }}

*Publicado el {{ date }} por {{ author }}*

{% if features.size > 0 %}
## ✨ Nuevas Funcionalidades
{% for feature in features %}
- {{ feature }}
{% endfor %}
{% endif %}

{% if fixes.size > 0 %}
## 🐛 Correcciones
{% for fix in fixes %}
- {{ fix }}
{% endfor %}
{% endif %}

{% if breaking.size > 0 %}
## ⚠️ Cambios que Rompen Compatibilidad
{% for breaking_change in breaking %}
- {{ breaking_change }}
{% endfor %}
{% endif %}

## 📦 Instalación

\`\`\`bash
npm install {{ repository }}@{{ version }}
\`\`\`

## 🤝 Contribuciones

Gracias a todos los que contribuyeron a esta versión.`,
        },
        {
          id: 'changelog',
          name: 'Changelog',
          category: 'changelog',
          description: 'Template para CHANGELOG.md',
          content: `# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [{{ version }}] - {{ date }}

{% if features.size > 0 %}
### Added
{% for feature in features %}
- {{ feature }}
{% endfor %}
{% endif %}

{% if fixes.size > 0 %}
### Fixed
{% for fix in fixes %}
- {{ fix }}
{% endfor %}
{% endif %}

{% if breaking.size > 0 %}
### Breaking Changes
{% for breaking_change in breaking %}
- {{ breaking_change }}
{% endfor %}
{% endif %}`,
        },
      ]
    },
  },
})