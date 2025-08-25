import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { DatabaseService } from '../../src/main/services/DatabaseService.ts'

// Mock de better-sqlite3
vi.mock('better-sqlite3')

describe('DatabaseService', () => {
  let databaseService
  let mockDb

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock del objeto Database
    mockDb = {
      close: vi.fn(),
      prepare: vi.fn(),
      exec: vi.fn(),
      transaction: vi.fn(),
      pragma: vi.fn(),
      backup: vi.fn(),
    }

    // Mock de prepared statements
    const mockStatement = {
      run: vi.fn(),
      get: vi.fn().mockReturnValue({ count: 0 }), // Mock para seedData
      all: vi.fn(),
      bind: vi.fn(),
      finalize: vi.fn(),
    }

    mockDb.prepare.mockReturnValue(mockStatement)
    mockDb.transaction.mockReturnValue(() => ({}))

    // Configurar mock de Database constructor
    Database.mockReturnValue(mockDb)

    databaseService = new DatabaseService(':memory:')
  })

  afterEach(() => {
    if (databaseService) {
      databaseService.close()
    }
  })

  describe('initialization', () => {
    test('debe inicializar base de datos correctamente', () => {
      expect(Database).toHaveBeenCalledWith(':memory:')
      expect(mockDb.pragma).toHaveBeenCalledWith('foreign_keys = ON')
      expect(mockDb.pragma).toHaveBeenCalledWith('journal_mode = WAL')
    })

    test('debe crear tablas al inicializar', () => {
      expect(mockDb.exec).toHaveBeenCalled()
      const createTableCall = mockDb.exec.mock.calls.find((call) =>
        call[0].includes('CREATE TABLE')
      )
      expect(createTableCall).toBeDefined()
    })
  })

  describe('repositories', () => {
    test('debe insertar nuevo repositorio', async () => {
      const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 1 })
      mockDb.prepare().run = mockRun

      const repoData = {
        name: 'test-repo',
        path: '/path/to/repo',
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        active: true,
      }

      const result = await databaseService.insertRepository(repoData)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe(1)
      expect(mockRun).toHaveBeenCalled()
    })

    test('debe obtener repositorio por ID', async () => {
      const mockGet = vi.fn().mockReturnValue({
        id: 1,
        name: 'test-repo',
        path: '/path/to/repo',
        active: 1,
      })
      mockDb.prepare().get = mockGet

      const result = await databaseService.getRepository(1)

      expect(result.success).toBe(true)
      expect(result.data.repository.id).toBe(1)
      expect(result.data.repository.name).toBe('test-repo')
      expect(mockGet).toHaveBeenCalledWith(1)
    })

    test('debe listar todos los repositorios activos', async () => {
      const mockAll = vi.fn().mockReturnValue([
        { id: 1, name: 'repo1', active: 1 },
        { id: 2, name: 'repo2', active: 1 },
      ])
      mockDb.prepare().all = mockAll

      const result = await databaseService.listRepositories(true)

      expect(result.success).toBe(true)
      expect(result.data.repositories).toHaveLength(2)
      expect(mockAll).toHaveBeenCalled()
    })

    test('debe actualizar repositorio existente', async () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 1 })
      mockDb.prepare().run = mockRun

      const updates = { name: 'updated-repo', active: false }

      const result = await databaseService.updateRepository(1, updates)

      expect(result.success).toBe(true)
      expect(mockRun).toHaveBeenCalled()
    })

    test('debe eliminar repositorio', async () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 1 })
      mockDb.prepare().run = mockRun

      const result = await databaseService.deleteRepository(1)

      expect(result.success).toBe(true)
      expect(mockRun).toHaveBeenCalledWith(1)
    })
  })

  describe('releases', () => {
    test('debe insertar nuevo release', async () => {
      const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 1 })
      mockDb.prepare().run = mockRun

      const releaseData = {
        repository_id: 1,
        version: 'v1.0.0',
        tag_name: 'v1.0.0',
        release_notes: '# Release v1.0.0',
        commit_count: 10,
        created_at: new Date().toISOString(),
      }

      const result = await databaseService.insertRelease(releaseData)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe(1)
      expect(mockRun).toHaveBeenCalled()
    })

    test('debe obtener releases por repositorio', async () => {
      const mockAll = vi.fn().mockReturnValue([
        { id: 1, version: 'v1.0.0', repository_id: 1 },
        { id: 2, version: 'v1.1.0', repository_id: 1 },
      ])
      mockDb.prepare().all = mockAll

      const result = await databaseService.getReleasesByRepository(1)

      expect(result.success).toBe(true)
      expect(result.data.releases).toHaveLength(2)
      expect(mockAll).toHaveBeenCalledWith(1)
    })

    test('debe obtener último release de repositorio', async () => {
      const mockGet = vi.fn().mockReturnValue({
        id: 2,
        version: 'v1.1.0',
        repository_id: 1,
      })
      mockDb.prepare().get = mockGet

      const result = await databaseService.getLatestRelease(1)

      expect(result.success).toBe(true)
      expect(result.data.release.version).toBe('v1.1.0')
      expect(mockGet).toHaveBeenCalledWith(1)
    })
  })

  describe('templates', () => {
    test('debe guardar template personalizado', async () => {
      const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 1 })
      mockDb.prepare().run = mockRun

      const templateData = {
        name: 'Mi Template',
        description: 'Template personalizado',
        content: '# Release {{ version }}',
        category: 'release',
        variables: JSON.stringify(['version']),
        created_by: 'user',
      }

      const result = await databaseService.saveTemplate(templateData)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe(1)
      expect(mockRun).toHaveBeenCalled()
    })

    test('debe obtener templates por categoría', async () => {
      const mockAll = vi.fn().mockReturnValue([
        { id: 1, name: 'Template 1', category: 'release' },
        { id: 2, name: 'Template 2', category: 'release' },
      ])
      mockDb.prepare().all = mockAll

      const result = await databaseService.getTemplatesByCategory('release')

      expect(result.success).toBe(true)
      expect(result.data.templates).toHaveLength(2)
      expect(mockAll).toHaveBeenCalledWith('release')
    })

    test('debe actualizar template existente', async () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 1 })
      mockDb.prepare().run = mockRun

      const updates = {
        name: 'Template Actualizado',
        content: '# Updated {{ version }}',
      }

      const result = await databaseService.updateTemplate(1, updates)

      expect(result.success).toBe(true)
      expect(mockRun).toHaveBeenCalled()
    })
  })

  describe('configurations', () => {
    test('debe guardar configuración', async () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 1 })
      mockDb.prepare().run = mockRun

      const result = await databaseService.setConfig('theme', 'dark')

      expect(result.success).toBe(true)
      expect(mockRun).toHaveBeenCalledWith('theme', 'dark')
    })

    test('debe obtener configuración', async () => {
      const mockGet = vi.fn().mockReturnValue({ value: 'dark' })
      mockDb.prepare().get = mockGet

      const result = await databaseService.getConfig('theme')

      expect(result.success).toBe(true)
      expect(result.data.value).toBe('dark')
      expect(mockGet).toHaveBeenCalledWith('theme')
    })

    test('debe obtener todas las configuraciones', async () => {
      const mockAll = vi.fn().mockReturnValue([
        { key: 'theme', value: 'dark' },
        { key: 'auto_push', value: 'true' },
      ])
      mockDb.prepare().all = mockAll

      const result = await databaseService.getAllConfigs()

      expect(result.success).toBe(true)
      expect(result.data.configs).toHaveProperty('theme', 'dark')
      expect(result.data.configs).toHaveProperty('auto_push', 'true')
    })
  })

  describe('statistics', () => {
    test('debe obtener estadísticas de repositorio', async () => {
      const mockGet = vi.fn().mockReturnValue({
        total_releases: 5,
        total_commits: 50,
        last_release_date: '2023-01-01',
      })
      mockDb.prepare().get = mockGet

      const result = await databaseService.getRepositoryStats(1)

      expect(result.success).toBe(true)
      expect(result.data.stats.total_releases).toBe(5)
      expect(result.data.stats.total_commits).toBe(50)
      expect(mockGet).toHaveBeenCalledWith(1)
    })

    test('debe obtener estadísticas globales', async () => {
      const mockGet = vi
        .fn()
        .mockReturnValueOnce({ count: 3 }) // repositorios
        .mockReturnValueOnce({ count: 15 }) // releases
        .mockReturnValueOnce({ count: 5 }) // templates
        .mockReturnValueOnce({ avg_commits: 10 }) // promedio commits

      mockDb.prepare().get = mockGet

      const result = await databaseService.getGlobalStats()

      expect(result.success).toBe(true)
      expect(result.data.stats.total_repositories).toBe(3)
      expect(result.data.stats.total_releases).toBe(15)
      expect(result.data.stats.avg_commits_per_release).toBe(10)
    })
  })

  describe('backup and migration', () => {
    test('debe crear backup de base de datos', async () => {
      const mockTransfer = vi.fn().mockReturnValue(100)
      const mockClose = vi.fn()
      const mockBackupInstance = {
        transfer: mockTransfer,
        close: mockClose,
      }
      const mockBackup = vi.fn().mockReturnValue(mockBackupInstance)
      mockDb.backup = mockBackup

      const result = await databaseService.backup('/path/to/backup.db')

      expect(result.success).toBe(true)
      expect(result.pages).toBe(100)
      expect(mockBackup).toHaveBeenCalledWith('/path/to/backup.db')
    })

    test('debe ejecutar migración de esquema', async () => {
      const mockExec = vi.fn()
      mockDb.exec = mockExec

      const result = await databaseService.migrate()

      expect(result.success).toBe(true)
      expect(mockExec).toHaveBeenCalled()
    })

    test('debe manejar errores en migración', async () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error('Migration failed')
      })
      mockDb.exec = mockExec

      const result = await databaseService.migrate()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Migration failed')
    })
  })

  describe('transactions', () => {
    test('debe ejecutar transacción exitosamente', async () => {
      const mockTransaction = vi.fn().mockReturnValue(() => ({ result: 'success' }))
      mockDb.transaction = mockTransaction

      const operations = [() => ({ success: true }), () => ({ success: true })]

      const result = await databaseService.executeTransaction(operations)

      expect(result.success).toBe(true)
      expect(mockTransaction).toHaveBeenCalled()
    })

    test('debe manejar errores en transacción', async () => {
      const mockTransaction = vi.fn().mockImplementation(() => {
        throw new Error('Transaction failed')
      })
      mockDb.transaction = mockTransaction

      const operations = [() => ({})]

      const result = await databaseService.executeTransaction(operations)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Transaction failed')
    })
  })

  describe('cleanup', () => {
    test('debe cerrar conexión correctamente', () => {
      databaseService.close()
      expect(mockDb.close).toHaveBeenCalled()
    })

    test('debe limpiar datos antiguos', async () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 5 })
      mockDb.prepare().run = mockRun

      const result = await databaseService.cleanup(30) // 30 días

      expect(result.success).toBe(true)
      expect(result.data.deletedRows).toBe(5)
      expect(mockRun).toHaveBeenCalled()
    })
  })
})
