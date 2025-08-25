import { Liquid } from 'liquidjs'

export interface TemplateRenderResult {
  success: boolean
  output?: string
  error?: string
}

export interface TemplateValidationResult {
  isValid: boolean
  message?: string
  error?: string
  missingVariables?: string[]
}

export interface TemplatePreviewResult {
  success: boolean
  preview?: string
  variables?: string[]
  error?: string
}

export interface TemplateDefinition {
  name: string
  description: string
  template: string
  variables: string[]
  category?: string
}

export interface TemplateSaveResult {
  success: boolean
  templateId?: string
  error?: string
}

export interface TemplateLoadResult {
  success: boolean
  template?: TemplateDefinition
  error?: string
}

export class TemplateService {
  private liquid: Liquid
  private customTemplates: Map<string, TemplateDefinition> = new Map()

  constructor() {
    // Configurar Liquid con opciones específicas
    this.liquid = new Liquid({
      cache: true,
      strictFilters: false,
      strictVariables: false,
      trimTagLeft: false,
      trimTagRight: false,
      trimOutputLeft: false,
      trimOutputRight: false,
    })

    this.registerCustomFilters()
  }

  /**
   * Registra filtros personalizados para templates
   */
  private registerCustomFilters(): void {
    // Filtro para formatear fechas
    this.liquid.registerFilter('formatDate', (date: string | Date, format = 'YYYY-MM-DD') => {
      if (!date) return ''
      const dateObj = typeof date === 'string' ? new Date(date) : date

      // Formateo básico - en producción usar librería como date-fns
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')

      return format.replace('YYYY', year.toString()).replace('MM', month).replace('DD', day)
    })

    // Filtro para capitalizar texto
    this.liquid.registerFilter('capitalize', (text: string) => {
      if (!text) return ''
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    })

    // Filtro para markdown básico (negrita, cursiva)
    this.liquid.registerFilter('markdown', (text: string) => {
      if (!text) return ''
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    })

    // Filtro para truncar texto
    this.liquid.registerFilter('truncate', (text: string, length = 100, suffix = '...') => {
      if (!text || text.length <= length) return text || ''
      return text.substring(0, length) + suffix
    })

    // Filtro para pluralización
    this.liquid.registerFilter('pluralize', (count: number, singular: string, plural?: string) => {
      if (count === 1) return singular
      return plural || `${singular}s`
    })
  }

  /**
   * Renderiza un template con los datos proporcionados
   */
  async renderTemplate(
    template: string,
    data: Record<string, unknown>
  ): Promise<TemplateRenderResult> {
    try {
      const output = await this.liquid.parseAndRender(template, data)
      return {
        success: true,
        output,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error renderizando template: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Valida la sintaxis de un template
   */
  async validateTemplate(
    template: string,
    requiredVariables?: string[]
  ): Promise<TemplateValidationResult> {
    try {
      // Validar sintaxis parseando el template
      this.liquid.parse(template)

      if (requiredVariables && requiredVariables.length > 0) {
        // Extraer variables del template
        const templateVariables = this.extractVariables(template)
        const missingVariables = requiredVariables.filter(
          (variable) => !templateVariables.includes(variable)
        )

        if (missingVariables.length > 0) {
          return {
            isValid: false,
            error: `Variables requeridas faltantes: ${missingVariables.join(', ')}`,
            missingVariables,
          }
        }
      }

      return {
        isValid: true,
        message: 'Template válido',
      }
    } catch (error) {
      return {
        isValid: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Extrae variables utilizadas en un template
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>()

    // Regex para variables {{ variable }} y {{ object.property }}
    const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g
    // Regex para variables en loops {% for item in items %}
    const loopRegex = /\{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%\}/g
    // Regex para variables en loops {{ item.property }}
    const loopItemRegex = /\{\{\s*(\w+\.\w+(?:\.\w+)*)\s*\}\}/g

    let match: RegExpExecArray | null = null

    // Extraer variables simples
    match = variableRegex.exec(template)
    while (match !== null) {
      const variable = match[1].trim()
      // Ignorar filtros y expresiones complejas, solo tomar el nombre de variable
      const cleanVariable = variable.split('|')[0].trim()
      if (!cleanVariable.includes(' ') && !cleanVariable.includes('(')) {
        variables.add(cleanVariable)
      }
      match = variableRegex.exec(template)
    }

    // Extraer variables de loops
    match = loopRegex.exec(template)
    while (match !== null) {
      const arrayVariable = match[2].trim()
      variables.add(arrayVariable)
      match = loopRegex.exec(template)
    }

    // Extraer propiedades de items en loops
    match = loopItemRegex.exec(template)
    while (match !== null) {
      const itemProperty = match[1].trim()
      variables.add(itemProperty)
      match = loopItemRegex.exec(template)
    }

    return Array.from(variables).sort()
  }

  /**
   * Genera un preview del template con datos de ejemplo
   */
  async previewTemplate(
    template: string,
    sampleData?: Record<string, unknown>
  ): Promise<TemplatePreviewResult> {
    try {
      const variables = this.extractVariables(template)

      // Si no se proporcionan datos de ejemplo, generar algunos básicos
      const data = sampleData || this.generateSampleData(variables)

      const preview = await this.liquid.parseAndRender(template, data)

      return {
        success: true,
        preview,
        variables,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error generando preview: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Genera datos de ejemplo basados en las variables del template
   */
  private generateSampleData(variables: string[]): Record<string, unknown> {
    const sampleData: Record<string, unknown> = {}

    variables.forEach((variable) => {
      if (variable.includes('.')) {
        // Variable anidada
        const parts = variable.split('.')
        let current = sampleData

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {}
          }
          current = current[parts[i]] as Record<string, unknown>
        }

        const lastPart = parts[parts.length - 1]
        current[lastPart] = this.getSampleValue(lastPart)
      } else {
        // Variable simple
        sampleData[variable] = this.getSampleValue(variable)
      }
    })

    return sampleData
  }

  /**
   * Obtiene un valor de ejemplo basado en el nombre de la variable
   */
  private getSampleValue(variableName: string): unknown {
    const name = variableName.toLowerCase()

    if (name.includes('version')) return '1.0.0'
    if (name.includes('date')) return new Date().toISOString().split('T')[0]
    if (name.includes('author') || name.includes('user')) return 'John Doe'
    if (name.includes('message')) return 'Ejemplo de mensaje'
    if (name.includes('commit'))
      return [
        { hash: 'abc123', message: 'feat: nueva funcionalidad' },
        { hash: 'def456', message: 'fix: corrección de bug' },
      ]
    if (name.includes('name')) return 'Ejemplo'
    if (name.includes('count') || name.includes('length')) return 5
    if (name.includes('url')) return 'https://ejemplo.com'
    if (name.includes('email')) return 'ejemplo@correo.com'

    return 'Valor de ejemplo'
  }

  /**
   * Obtiene templates predefinidos
   */
  getPredefinedTemplates(): Record<string, TemplateDefinition> {
    return {
      changelog: {
        name: 'Changelog Básico',
        description: 'Template básico para generar changelog',
        template: `# Changelog

## [{{ version }}] - {{ date | formatDate }}

### Añadido
{% for commit in commits %}{% if commit.type == 'feat' %}- {{ commit.message }}
{% endif %}{% endfor %}

### Corregido
{% for commit in commits %}{% if commit.type == 'fix' %}- {{ commit.message }}
{% endif %}{% endfor %}

### Cambiado
{% for commit in commits %}{% if commit.type == 'change' %}- {{ commit.message }}
{% endif %}{% endfor %}`,
        variables: ['version', 'date', 'commits'],
        category: 'release',
      },

      'release-notes': {
        name: 'Release Notes',
        description: 'Template para notas de release completas',
        template: `# {{ project.name }} v{{ version }}

**Fecha de Release:** {{ date | formatDate }}
**Autor:** {{ author }}

## Resumen

{{ summary | default: "Nueva versión con mejoras y correcciones." }}

## Cambios ({{ commits.length }} {{ commits.length | pluralize: "commit", "commits" }})

{% for commit in commits %}
- **{{ commit.type | capitalize }}:** {{ commit.message }} ({{ commit.hash | truncate: 7, "" }})
{% endfor %}

## Instalación

\`\`\`bash
npm install {{ project.name }}@{{ version }}
\`\`\`

---
Generado automáticamente por ReleaseFlow`,
        variables: ['project.name', 'version', 'date', 'author', 'summary', 'commits'],
        category: 'release',
      },

      'tag-message': {
        name: 'Tag Message',
        description: 'Mensaje para tags de Git',
        template: `Release {{ version }}

{% if summary %}{{ summary }}

{% endif %}Cambios:
{% for commit in commits limit: 10 %}- {{ commit.message }}
{% endfor %}{% if commits.length > 10 %}
... y {{ commits.length | minus: 10 }} cambios más{% endif %}`,
        variables: ['version', 'summary', 'commits'],
        category: 'git',
      },

      'commit-summary': {
        name: 'Resumen de Commits',
        description: 'Resumen de commits entre versiones',
        template: `## Commits desde {{ from_version }} hasta {{ to_version }}

**Total:** {{ commits.length }} {{ commits.length | pluralize: "commit", "commits" }}
**Período:** {{ start_date | formatDate }} - {{ end_date | formatDate }}

### Por tipo:
- Features: {{ feat_count | default: 0 }}
- Fixes: {{ fix_count | default: 0 }}
- Refactor: {{ refactor_count | default: 0 }}
- Documentación: {{ docs_count | default: 0 }}

### Lista completa:
{% for commit in commits %}
{{ forloop.index }}. {{ commit.message }} - *{{ commit.author }}* ({{ commit.date | formatDate }})
{% endfor %}`,
        variables: [
          'from_version',
          'to_version',
          'commits',
          'start_date',
          'end_date',
          'feat_count',
          'fix_count',
          'refactor_count',
          'docs_count',
        ],
        category: 'analysis',
      },
    }
  }

  /**
   * Guarda un template personalizado
   */
  async saveTemplate(
    templateId: string,
    templateData: TemplateDefinition
  ): Promise<TemplateSaveResult> {
    try {
      // Validar template antes de guardar
      const validation = await this.validateTemplate(templateData.template)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        }
      }

      // Guardar en memoria (en producción sería en base de datos)
      this.customTemplates.set(templateId, {
        ...templateData,
        variables: templateData.variables || this.extractVariables(templateData.template),
      })

      return {
        success: true,
        templateId,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error guardando template: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Carga un template por ID
   */
  async loadTemplate(templateId: string): Promise<TemplateLoadResult> {
    try {
      // Buscar en templates predefinidos
      const predefined = this.getPredefinedTemplates()
      if (predefined[templateId]) {
        return {
          success: true,
          template: predefined[templateId],
        }
      }

      // Buscar en templates personalizados
      const custom = this.customTemplates.get(templateId)
      if (custom) {
        return {
          success: true,
          template: custom,
        }
      }

      return {
        success: false,
        error: `Template '${templateId}' no encontrado`,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error cargando template: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Lista todos los templates disponibles
   */
  listTemplates(): {
    predefined: Record<string, TemplateDefinition>
    custom: Record<string, TemplateDefinition>
  } {
    const predefined = this.getPredefinedTemplates()
    const custom = Object.fromEntries(this.customTemplates)

    return { predefined, custom }
  }

  /**
   * Elimina un template personalizado
   */
  deleteTemplate(templateId: string): boolean {
    return this.customTemplates.delete(templateId)
  }
}
