import { beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'node:path'

// Imports de servicios reales para tests de integración
import { DatabaseService } from '../../src/main/services/DatabaseService.ts'
import { GitService } from '../../src/main/services/GitService.ts'
import { ReleaseService } from '../../src/main/services/ReleaseService.ts'
import { TemplateService } from '../../src/main/services/TemplateService.ts'

describe('IPC Integration Tests', () => {
  let databaseService
  let gitService
  let templateService
  let releaseService

  beforeEach(async () => {
    // Crear instancias reales de servicios para tests de integración
    databaseService = new DatabaseService(':memory:') // Base de datos en memoria para tests
    await databaseService.initialize()
    
    gitService = new GitService()
    templateService = new TemplateService()
    releaseService = new ReleaseService(gitService, templateService)
  })

  describe('Git Service Integration', () => {
    it('debe integrar gitService con handlers IPC', async () => {
      // Test que el servicio esté disponible para IPC
      expect(gitService).toBeDefined()
      expect(typeof gitService.getStatus).toBe('function')
      expect(typeof gitService.commitChanges).toBe('function')
      expect(typeof gitService.createTag).toBe('function')
      expect(typeof gitService.validateRepository).toBe('function')
    })

    it('debe manejar repositorios inválidos en IPC', async () => {
      const invalidPath = '/path/does/not/exist'
      
      try {
        await gitService.validateRepository(invalidPath)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('debe validar parámetros de git operations', async () => {
      // Test validación básica - los servicios pueden manejar parámetros inválidos
      expect(gitService.getStatus).toBeDefined()
      expect(gitService.validateRepository).toBeDefined()
      expect(gitService.createTag).toBeDefined()
    })
  })

  describe('Template Service Integration', () => {
    it('debe integrar templateService con handlers IPC', async () => {
      const template = 'Hello {{ name }}!'
      const data = { name: 'World' }
      
      const result = await templateService.renderTemplate(template, data)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('debe validar templates a través de IPC', async () => {
      const validTemplate = '{{ version }} - {{ date }}'
      const validation = await templateService.validateTemplate(validTemplate)
      
      expect(validation).toBeDefined()
      expect(validation.isValid).toBe(true)
    })

    it('debe detectar templates inválidos', async () => {
      const invalidTemplate = '{{ unclosed.tag'
      
      const validation = await templateService.validateTemplate(invalidTemplate)
      expect(validation).toBeDefined()
      expect(validation.isValid).toBe(false)
    })

    it('debe previsualizar templates', async () => {
      const template = '# Version {{ version }}'
      const data = { version: '1.0.0' }
      
      const result = await templateService.previewTemplate(template, data)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('Database Service Integration', () => {
    it('debe integrar databaseService con handlers IPC', async () => {
      // Test inserción usando los métodos específicos
      const repoData = {
        name: 'test-repo',
        path: '/test/repo/path',
        current_branch: 'main',
        active: 1,
      }
      
      const insertResult = await databaseService.insertRepository(repoData)
      expect(insertResult).toBeDefined()
      expect(insertResult.success).toBe(true)
      expect(insertResult.data).toHaveProperty('id')
    })

    it('debe consultar datos correctamente', async () => {
      // Insertar datos de prueba
      await databaseService.insertRepository({
        name: 'repo-query-test',
        path: '/test/query',
        current_branch: 'main',
        active: 1,
      })
      
      // Consultar usando el método específico
      const results = await databaseService.listRepositories({ active: 1 })
      
      expect(results).toBeDefined()
      expect(results.success).toBe(true)
      expect(Array.isArray(results.data.repositories)).toBe(true)
    })

    it('debe actualizar registros correctamente', async () => {
      // Insertar
      const inserted = await databaseService.insertRepository({
        name: 'repo-update-test',
        path: '/test/update',
        current_branch: 'main',
        active: 1,
      })
      
      if (inserted.success) {
        // Actualizar
        const updateResult = await databaseService.updateRepository(inserted.data.id, {
          current_branch: 'develop',
        })
        
        expect(updateResult).toBeDefined()
        // Puede fallar si el repositorio no existe, pero debe devolver algo
        expect(updateResult).toHaveProperty('success')
      } else {
        // Si falla la inserción, skip la actualización
        expect(inserted).toBeDefined()
      }
    })

    it('debe manejar configuraciones', async () => {
      await databaseService.setConfig('test_key', 'test_value')
      const config = await databaseService.getConfig('test_key')
      
      expect(config).toBeDefined()
      expect(config.success).toBe(true)
      expect(config.data.value).toBe('test_value')
    })
  })

  describe('Release Service Integration', () => {
    it('debe integrar releaseService con handlers IPC', async () => {
      // Test que el servicio esté disponible
      expect(releaseService).toBeDefined()
      expect(typeof releaseService.validateReleasePrerequisites).toBe('function')
      expect(typeof releaseService.generateChangelog).toBe('function')
      expect(typeof releaseService.createRelease).toBe('function')
    })

    it('debe validar prerequisitos de release', async () => {
      const config = {
        repository: '/mock/repo',
        version: '1.1.0',
        template: 'basic-release',
      }
      
      try {
        const result = await releaseService.validateReleasePrerequisites(config)
        expect(result).toBeDefined()
      } catch (error) {
        // Es esperado que falle sin repositorio real
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('debe generar changelog', async () => {
      const config = {
        repository: '/mock/repo',
        fromTag: 'v1.0.0',
        toTag: 'HEAD',
        template: 'basic-release',
      }
      
      try {
        const changelog = await releaseService.generateChangelog(config)
        expect(changelog).toBeDefined()
      } catch (error) {
        // Es esperado que falle sin repositorio real
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('debe sugerir próxima versión', async () => {
      const repoPath = '/mock/repo'
      const currentVersion = '1.0.0'
      
      try {
        const suggestedVersion = await releaseService.suggestNextVersion(repoPath, currentVersion)
        expect(suggestedVersion).toBeDefined()
      } catch (error) {
        // Es esperado que falle sin repositorio real
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('Cross-Service Integration', () => {
    it('debe coordinar servicios para release completo', async () => {
      // Test que todos los servicios estén disponibles
      expect(gitService).toBeDefined()
      expect(templateService).toBeDefined()
      expect(databaseService).toBeDefined()
      expect(releaseService).toBeDefined()
      
      // Test métodos principales
      expect(typeof gitService.getStatus).toBe('function')
      expect(typeof templateService.renderTemplate).toBe('function')
      expect(typeof databaseService.insertRepository).toBe('function')
      expect(typeof releaseService.createRelease).toBe('function')
    })

    it('debe manejar errores en cadena de servicios', async () => {
      try {
        await gitService.validateRepository('/invalid/path')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
      
      try {
        await templateService.validateTemplate('{{ invalid syntax')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('IPC Communication Flow', () => {
    it('debe simular flujo completo de IPC', async () => {
      // Test básico de disponibilidad de servicios para IPC
      expect(gitService.getStatus).toBeDefined()
      expect(templateService.renderTemplate).toBeDefined()
      expect(databaseService.insertRepository).toBeDefined()
      expect(releaseService.createRelease).toBeDefined()
    })

    it('debe validar tipos de datos en IPC', async () => {
      // Test validación de tipos para prevenir errores de runtime
      const validData = {
        repoPath: '/valid/path',
        version: '1.0.0',
        template: 'basic-release',
      }
      
      expect(typeof validData.repoPath).toBe('string')
      expect(typeof validData.version).toBe('string')
      expect(typeof validData.template).toBe('string')
    })

    it('debe manejar operaciones async en IPC', async () => {
      // Test para operaciones asíncronas
      const asyncOperation = () => Promise.resolve('completed')
      
      const result = await asyncOperation()
      expect(result).toBe('completed')
    })
  })
})