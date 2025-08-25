import simpleGit from 'simple-git'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { GitService } from '../../src/main/services/GitService.ts'

// Mock de simple-git
vi.mock('simple-git')

describe('GitService', () => {
  let gitService
  let mockGit

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock del objeto git
    mockGit = {
      checkIsRepo: vi.fn(),
      status: vi.fn(),
      add: vi.fn(),
      commit: vi.fn(),
      addAnnotatedTag: vi.fn(),
      tags: vi.fn(),
      push: vi.fn(),
      log: vi.fn(),
      diff: vi.fn(),
      raw: vi.fn(),
      branch: vi.fn(),
      checkout: vi.fn(),
    }

    // Configurar mock de simple-git
    simpleGit.mockReturnValue(mockGit)

    gitService = new GitService()
  })

  describe('validateRepository', () => {
    test('debe validar repositorio Git válido', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)

      const result = await gitService.validateRepository('/path/to/repo')

      expect(result.isValid).toBe(true)
      expect(result.message).toContain('válido')
      expect(mockGit.checkIsRepo).toHaveBeenCalledWith()
    })

    test('debe rechazar directorio que no es repositorio Git', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      const result = await gitService.validateRepository('/path/to/nonrepo')

      expect(result.isValid).toBe(false)
      expect(result.message).toContain('no es un repositorio')
    })

    test('debe manejar errores de acceso al repositorio', async () => {
      mockGit.checkIsRepo.mockRejectedValue(new Error('Permission denied'))

      const result = await gitService.validateRepository('/path/to/restricted')

      expect(result.isValid).toBe(false)
      expect(result.message).toContain('Error')
    })
  })

  describe('getStatus', () => {
    test('debe obtener estado del repositorio', async () => {
      const mockStatus = {
        current: 'main',
        modified: ['file1.js', 'file2.js'],
        not_added: ['file3.js'],
        ahead: 2,
        behind: 0,
      }
      mockGit.status.mockResolvedValue(mockStatus)

      const status = await gitService.getStatus('/path/to/repo')

      expect(status.currentBranch).toBe('main')
      expect(status.modifiedFiles).toHaveLength(2)
      expect(status.untrackedFiles).toHaveLength(1)
      expect(status.aheadBy).toBe(2)
      expect(status.behindBy).toBe(0)
    })

    test('debe manejar repositorio sin cambios', async () => {
      const cleanStatus = {
        current: 'main',
        modified: [],
        not_added: [],
        ahead: 0,
        behind: 0,
      }
      mockGit.status.mockResolvedValue(cleanStatus)

      const status = await gitService.getStatus('/path/to/repo')

      expect(status.isClean).toBe(true)
      expect(status.modifiedFiles).toHaveLength(0)
    })
  })

  describe('createTag', () => {
    test('debe crear tag con mensaje', async () => {
      mockGit.tags.mockResolvedValue({ all: [] }) // No existing tags
      mockGit.addAnnotatedTag.mockResolvedValue('tag created')

      const result = await gitService.createTag('/path/to/repo', 'v1.0.0', 'Release version 1.0.0')

      expect(result.success).toBe(true)
      expect(result.tagName).toBe('v1.0.0')
      expect(mockGit.addAnnotatedTag).toHaveBeenCalledWith('v1.0.0', 'Release version 1.0.0')
    })

    test('debe validar formato de tag', async () => {
      const result = await gitService.createTag('/path/to/repo', 'invalid-tag', 'Message')

      expect(result.success).toBe(false)
      expect(result.error).toContain('formato')
    })

    test('debe verificar si tag ya existe', async () => {
      mockGit.tags.mockResolvedValue({ all: ['v1.0.0', 'v1.1.0'] })

      const result = await gitService.createTag('/path/to/repo', 'v1.0.0', 'Message')

      expect(result.success).toBe(false)
      expect(result.error).toContain('ya existe')
    })
  })

  describe('getTags', () => {
    test('debe listar todos los tags', async () => {
      const mockTags = {
        all: ['v1.0.0', 'v1.1.0', 'v2.0.0'],
        latest: 'v2.0.0',
      }
      mockGit.tags.mockResolvedValue(mockTags)

      const tags = await gitService.getTags('/path/to/repo')

      expect(tags).toHaveLength(3)
      expect(tags).toContain('v1.0.0')
      expect(tags).toContain('v2.0.0')
    })

    test('debe ordenar tags por versión semántica', async () => {
      const mockTags = {
        all: ['v2.0.0', 'v1.0.0', 'v1.10.0', 'v1.2.0'],
      }
      mockGit.tags.mockResolvedValue(mockTags)

      const tags = await gitService.getTags('/path/to/repo', true)

      expect(tags[0]).toBe('v2.0.0')
      expect(tags[1]).toBe('v1.10.0')
      expect(tags[2]).toBe('v1.2.0')
      expect(tags[3]).toBe('v1.0.0')
    })
  })

  describe('commitChanges', () => {
    test('debe realizar commit con archivos específicos', async () => {
      mockGit.add.mockResolvedValue('files added')
      mockGit.commit.mockResolvedValue({ commit: 'abc123' })

      const result = await gitService.commitChanges('/path/to/repo', 'feat: nueva funcionalidad', [
        'file1.js',
        'file2.js',
      ])

      expect(result.success).toBe(true)
      expect(result.commitHash).toBe('abc123')
      expect(mockGit.add).toHaveBeenCalledWith(['file1.js', 'file2.js'])
      expect(mockGit.commit).toHaveBeenCalledWith('feat: nueva funcionalidad')
    })

    test('debe agregar todos los archivos si no se especifican', async () => {
      mockGit.add.mockResolvedValue('all added')
      mockGit.commit.mockResolvedValue({ commit: 'def456' })

      const result = await gitService.commitChanges('/path/to/repo', 'fix: corrección')

      expect(result.success).toBe(true)
      expect(mockGit.add).toHaveBeenCalledWith('.')
    })
  })

  describe('pushTags', () => {
    test('debe hacer push de tags al remoto', async () => {
      mockGit.push.mockResolvedValue('pushed')

      const result = await gitService.pushTags('/path/to/repo', 'origin')

      expect(result.success).toBe(true)
      expect(mockGit.push).toHaveBeenCalledWith('origin', '--tags')
    })

    test('debe usar origin como remoto por defecto', async () => {
      mockGit.push.mockResolvedValue('pushed')

      await gitService.pushTags('/path/to/repo')

      expect(mockGit.push).toHaveBeenCalledWith('origin', '--tags')
    })
  })

  describe('getCommitsBetweenTags', () => {
    test('debe obtener commits entre dos tags', async () => {
      const mockLog = {
        all: [
          { hash: 'abc123', message: 'feat: nueva feature', date: '2023-01-01' },
          { hash: 'def456', message: 'fix: corrección bug', date: '2023-01-02' },
        ],
      }
      mockGit.log.mockResolvedValue(mockLog)

      const commits = await gitService.getCommitsBetweenTags('/path/to/repo', 'v1.0.0', 'v1.1.0')

      expect(commits).toHaveLength(2)
      expect(commits[0].hash).toBe('abc123')
      expect(commits[0].message).toBe('feat: nueva feature')
      expect(mockGit.log).toHaveBeenCalledWith({ from: 'v1.0.0', to: 'v1.1.0' })
    })
  })

  describe('getDiff', () => {
    test('debe obtener diferencias entre commits', async () => {
      mockGit.diff.mockResolvedValue('diff content')

      const diff = await gitService.getDiff('/path/to/repo', 'v1.0.0', 'v1.1.0')

      expect(diff).toBe('diff content')
      expect(mockGit.diff).toHaveBeenCalledWith(['v1.0.0', 'v1.1.0'])
    })
  })

  describe('getCurrentBranch', () => {
    test('debe obtener rama actual', async () => {
      mockGit.branch.mockResolvedValue({ current: 'feature/new-feature' })

      const branch = await gitService.getCurrentBranch('/path/to/repo')

      expect(branch).toBe('feature/new-feature')
    })
  })
})
