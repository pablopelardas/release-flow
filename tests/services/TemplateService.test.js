import { Liquid } from 'liquidjs'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { TemplateService } from '../../src/main/services/TemplateService.ts'

// Mock de liquidjs
vi.mock('liquidjs')

describe('TemplateService', () => {
  let templateService
  let mockLiquid

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock del motor Liquid
    mockLiquid = {
      parseAndRender: vi.fn(),
      parse: vi.fn(),
      render: vi.fn(),
      registerFilter: vi.fn(),
      registerTag: vi.fn(),
    }

    // Configurar mock de Liquid constructor
    Liquid.mockReturnValue(mockLiquid)

    templateService = new TemplateService()
  })

  describe('renderTemplate', () => {
    test('debe renderizar template con datos simples', async () => {
      const template = 'Hola {{ nombre }}, versión {{ version }}'
      const data = { nombre: 'ReleaseFlow', version: '1.0.0' }
      const expected = 'Hola ReleaseFlow, versión 1.0.0'

      mockLiquid.parseAndRender.mockResolvedValue(expected)

      const result = await templateService.renderTemplate(template, data)

      expect(result.success).toBe(true)
      expect(result.output).toBe(expected)
      expect(mockLiquid.parseAndRender).toHaveBeenCalledWith(template, data)
    })

    test('debe manejar templates con loops', async () => {
      const template = '{% for commit in commits %}{{ commit.message }}\\n{% endfor %}'
      const data = {
        commits: [{ message: 'feat: nueva funcionalidad' }, { message: 'fix: corrección de bug' }],
      }
      const expected = 'feat: nueva funcionalidad\\nfix: corrección de bug\\n'

      mockLiquid.parseAndRender.mockResolvedValue(expected)

      const result = await templateService.renderTemplate(template, data)

      expect(result.success).toBe(true)
      expect(result.output).toBe(expected)
    })

    test('debe manejar templates con condicionales', async () => {
      const template =
        '{% if breaking_changes %}BREAKING CHANGES:\\n{{ breaking_changes }}{% endif %}'
      const data = { breaking_changes: 'API cambió completamente' }
      const expected = 'BREAKING CHANGES:\\nAPI cambió completamente'

      mockLiquid.parseAndRender.mockResolvedValue(expected)

      const result = await templateService.renderTemplate(template, data)

      expect(result.success).toBe(true)
      expect(result.output).toBe(expected)
    })

    test('debe manejar errores de sintaxis en template', async () => {
      const invalidTemplate = '{{ unclosed_tag'
      const data = {}

      mockLiquid.parseAndRender.mockRejectedValue(new Error('Syntax error'))

      const result = await templateService.renderTemplate(invalidTemplate, data)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error')
    })
  })

  describe('validateTemplate', () => {
    test('debe validar template válido', async () => {
      const validTemplate = 'Release {{ version }} - {{ date }}'

      mockLiquid.parse.mockReturnValue({}) // Parse exitoso

      const result = await templateService.validateTemplate(validTemplate)

      expect(result.isValid).toBe(true)
      expect(result.message).toContain('válido')
      expect(mockLiquid.parse).toHaveBeenCalledWith(validTemplate)
    })

    test('debe detectar sintaxis inválida', async () => {
      const invalidTemplate = '{{ unclosed'

      mockLiquid.parse.mockImplementation(() => {
        throw new Error('Syntax error: unclosed tag')
      })

      const result = await templateService.validateTemplate(invalidTemplate)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Syntax error')
    })

    test('debe validar variables requeridas', async () => {
      const template = 'Version {{ version }}, Released by {{ author }}'
      const requiredVars = ['version', 'author', 'date'] // date no está en template

      mockLiquid.parse.mockReturnValue({}) // Parse exitoso

      const result = await templateService.validateTemplate(template, requiredVars)

      expect(result.isValid).toBe(false)
      expect(result.missingVariables).toContain('date')
    })
  })

  describe('extractVariables', () => {
    test('debe extraer variables simples del template', () => {
      const template = 'Release {{ version }} by {{ author }} on {{ date }}'

      const variables = templateService.extractVariables(template)

      expect(variables).toHaveLength(3)
      expect(variables).toContain('version')
      expect(variables).toContain('author')
      expect(variables).toContain('date')
    })

    test('debe extraer variables de objetos anidados', () => {
      const template = '{{ project.name }} v{{ project.version }} by {{ team.lead }}'

      const variables = templateService.extractVariables(template)

      expect(variables).toContain('project.name')
      expect(variables).toContain('project.version')
      expect(variables).toContain('team.lead')
    })

    test('debe extraer variables de loops', () => {
      const template =
        '{% for commit in commits %}{{ commit.hash }}: {{ commit.message }}{% endfor %}'

      const variables = templateService.extractVariables(template)

      expect(variables).toContain('commits')
      expect(variables).toContain('commit.hash')
      expect(variables).toContain('commit.message')
    })

    test('debe manejar template sin variables', () => {
      const template = 'Release Notes - Fixed Version'

      const variables = templateService.extractVariables(template)

      expect(variables).toHaveLength(0)
    })
  })

  describe('previewTemplate', () => {
    test('debe generar preview con datos de ejemplo', async () => {
      const template = 'Release {{ version }} - {{ commits.length }} commits'
      const sampleData = {
        version: '1.0.0',
        commits: [{ message: 'feat: nueva feature' }, { message: 'fix: bug corregido' }],
      }
      const expected = 'Release 1.0.0 - 2 commits'

      mockLiquid.parseAndRender.mockResolvedValue(expected)

      const result = await templateService.previewTemplate(template, sampleData)

      expect(result.success).toBe(true)
      expect(result.preview).toBe(expected)
      expect(result.variables).toContain('version')
      expect(result.variables).toContain('commits.length')
      expect(result.variables).toHaveLength(2)
    })
  })

  describe('predefined templates', () => {
    test('debe tener template de changelog básico', () => {
      const templates = templateService.getPredefinedTemplates()

      expect(templates).toHaveProperty('changelog')
      expect(templates.changelog.name).toBe('Changelog Básico')
      expect(templates.changelog.template).toContain('{{ version }}')
    })

    test('debe tener template de release notes', () => {
      const templates = templateService.getPredefinedTemplates()

      expect(templates).toHaveProperty('release-notes')
      expect(templates['release-notes'].name).toBe('Release Notes')
      expect(templates['release-notes'].template).toContain('commits')
    })

    test('debe tener template de tag message', () => {
      const templates = templateService.getPredefinedTemplates()

      expect(templates).toHaveProperty('tag-message')
      expect(templates['tag-message'].name).toBe('Tag Message')
      expect(templates['tag-message'].template).toContain('{{ version }}')
    })
  })

  describe('custom filters', () => {
    test('debe registrar filtro de formateo de fecha', () => {
      expect(mockLiquid.registerFilter).toHaveBeenCalledWith('formatDate', expect.any(Function))
    })

    test('debe registrar filtro de capitalización', () => {
      expect(mockLiquid.registerFilter).toHaveBeenCalledWith('capitalize', expect.any(Function))
    })

    test('debe registrar filtro de markdown', () => {
      expect(mockLiquid.registerFilter).toHaveBeenCalledWith('markdown', expect.any(Function))
    })
  })

  describe('saveTemplate', () => {
    test('debe guardar template personalizado', async () => {
      const templateData = {
        name: 'Mi Template',
        description: 'Template personalizado',
        template: 'Release {{ version }}',
        variables: ['version'],
      }

      const result = await templateService.saveTemplate('custom-1', templateData)

      expect(result.success).toBe(true)
      expect(result.templateId).toBe('custom-1')
    })

    test('debe validar template antes de guardar', async () => {
      const invalidTemplateData = {
        name: 'Template Inválido',
        template: '{{ unclosed',
        variables: ['version'],
      }

      mockLiquid.parse.mockImplementation(() => {
        throw new Error('Syntax error')
      })

      const result = await templateService.saveTemplate('invalid', invalidTemplateData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Syntax error')
    })
  })

  describe('loadTemplate', () => {
    test('debe cargar template predefinido', async () => {
      const result = await templateService.loadTemplate('changelog')

      expect(result.success).toBe(true)
      expect(result.template.name).toBe('Changelog Básico')
      expect(result.template.template).toBeDefined()
    })

    test('debe manejar template no encontrado', async () => {
      const result = await templateService.loadTemplate('inexistente')

      expect(result.success).toBe(false)
      expect(result.error).toContain('no encontrado')
    })
  })
})
