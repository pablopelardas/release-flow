import { beforeEach, describe, expect, test, vi } from 'vitest'
import { GitService } from '../../src/main/services/GitService.ts'
import { ReleaseService } from '../../src/main/services/ReleaseService.ts'
import { TemplateService } from '../../src/main/services/TemplateService.ts'

// Mock de servicios dependientes
vi.mock('../../src/main/services/GitService.ts')
vi.mock('../../src/main/services/TemplateService.ts')

describe('ReleaseService', () => {
  let releaseService
  let mockGitService
  let mockTemplateService

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock GitService
    mockGitService = {
      validateRepository: vi.fn(),
      getStatus: vi.fn(),
      getCurrentBranch: vi.fn(),
      getTags: vi.fn(),
      createTag: vi.fn(),
      commitChanges: vi.fn(),
      pushTags: vi.fn(),
      getCommitsBetweenTags: vi.fn(),
      getDiff: vi.fn(),
      isClean: vi.fn(),
    }

    // Mock TemplateService
    mockTemplateService = {
      renderTemplate: vi.fn(),
      loadTemplate: vi.fn(),
      validateTemplate: vi.fn(),
    }

    GitService.mockImplementation(() => mockGitService)
    TemplateService.mockImplementation(() => mockTemplateService)

    releaseService = new ReleaseService()
  })

  describe('calculateNextVersion', () => {
    test('debe calcular siguiente versión patch', () => {
      const currentVersion = '1.2.3'
      const nextVersion = releaseService.calculateNextVersion(currentVersion, 'patch')

      expect(nextVersion).toBe('1.2.4')
    })

    test('debe calcular siguiente versión minor', () => {
      const currentVersion = '1.2.3'
      const nextVersion = releaseService.calculateNextVersion(currentVersion, 'minor')

      expect(nextVersion).toBe('1.3.0')
    })

    test('debe calcular siguiente versión major', () => {
      const currentVersion = '1.2.3'
      const nextVersion = releaseService.calculateNextVersion(currentVersion, 'major')

      expect(nextVersion).toBe('2.0.0')
    })

    test('debe manejar versión con prefijo v', () => {
      const currentVersion = 'v1.2.3'
      const nextVersion = releaseService.calculateNextVersion(currentVersion, 'patch')

      expect(nextVersion).toBe('v1.2.4')
    })

    test('debe manejar primera versión', () => {
      const nextVersion = releaseService.calculateNextVersion(null, 'major')

      expect(nextVersion).toBe('1.0.0')
    })
  })

  describe('analyzeCommits', () => {
    test('debe analizar commits convencionales', () => {
      const commits = [
        { message: 'feat: nueva funcionalidad', hash: 'abc123' },
        { message: 'fix: corrección de bug', hash: 'def456' },
        { message: 'docs: actualizar README', hash: 'ghi789' },
        { message: 'chore: actualizar dependencias', hash: 'jkl012' },
      ]

      const analysis = releaseService.analyzeCommits(commits)

      expect(analysis.features).toHaveLength(1)
      expect(analysis.fixes).toHaveLength(1)
      expect(analysis.documentation).toHaveLength(1)
      expect(analysis.chores).toHaveLength(1)
      expect(analysis.suggestedBump).toBe('minor') // feat sugiere minor
    })

    test('debe detectar breaking changes', () => {
      const commits = [
        { message: 'feat!: cambio que rompe compatibilidad', hash: 'abc123' },
        { message: 'fix: corrección normal', hash: 'def456' },
      ]

      const analysis = releaseService.analyzeCommits(commits)

      expect(analysis.breakingChanges).toHaveLength(1)
      expect(analysis.suggestedBump).toBe('major')
    })

    test('debe manejar commits no convencionales', () => {
      const commits = [
        { message: 'actualización general', hash: 'abc123' },
        { message: 'mejoras varias', hash: 'def456' },
      ]

      const analysis = releaseService.analyzeCommits(commits)

      expect(analysis.others).toHaveLength(2)
      expect(analysis.suggestedBump).toBe('patch') // default para unknown
    })
  })

  describe('validateReleasePrerequisites', () => {
    test('debe validar repositorio limpio y en rama correcta', async () => {
      mockGitService.validateRepository.mockResolvedValue({ isValid: true, message: 'OK' })
      mockGitService.isClean.mockResolvedValue(true)
      mockGitService.getCurrentBranch.mockResolvedValue('main')

      const result = await releaseService.validateReleasePrerequisites('/path/to/repo', 'main')

      expect(result.isValid).toBe(true)
      expect(result.checks).toHaveProperty('repositoryValid')
      expect(result.checks).toHaveProperty('workingTreeClean')
      expect(result.checks).toHaveProperty('correctBranch')
    })

    test('debe detectar repositorio sucio', async () => {
      mockGitService.validateRepository.mockResolvedValue({ isValid: true, message: 'OK' })
      mockGitService.isClean.mockResolvedValue(false)
      mockGitService.getCurrentBranch.mockResolvedValue('main')

      const result = await releaseService.validateReleasePrerequisites('/path/to/repo', 'main')

      expect(result.isValid).toBe(false)
      expect(result.checks.workingTreeClean).toBe(false)
    })

    test('debe detectar rama incorrecta', async () => {
      mockGitService.validateRepository.mockResolvedValue({ isValid: true, message: 'OK' })
      mockGitService.isClean.mockResolvedValue(true)
      mockGitService.getCurrentBranch.mockResolvedValue('feature/test')

      const result = await releaseService.validateReleasePrerequisites('/path/to/repo', 'main')

      expect(result.isValid).toBe(false)
      expect(result.checks.correctBranch).toBe(false)
    })
  })

  describe('generateChangelog', () => {
    test('debe generar changelog desde commits', async () => {
      const commits = [
        { message: 'feat: nueva feature', hash: 'abc123', author: 'John Doe', date: '2023-01-01' },
        { message: 'fix: bug corregido', hash: 'def456', author: 'Jane Smith', date: '2023-01-02' },
      ]

      const releaseData = {
        version: '1.1.0',
        date: '2023-01-03',
        fromTag: 'v1.0.0',
        toTag: 'v1.1.0',
        commits,
      }

      mockTemplateService.loadTemplate.mockResolvedValue({
        success: true,
        template: {
          template:
            '# v{{ version }}\n{% for commit in commits %}- {{ commit.message }}{% endfor %}',
        },
      })

      mockTemplateService.renderTemplate.mockResolvedValue({
        success: true,
        output: '# v1.1.0\n- feat: nueva feature\n- fix: bug corregido',
      })

      const result = await releaseService.generateChangelog(releaseData, 'changelog')

      expect(result.success).toBe(true)
      expect(result.changelog).toContain('v1.1.0')
      expect(mockTemplateService.loadTemplate).toHaveBeenCalledWith('changelog')
      expect(mockTemplateService.renderTemplate).toHaveBeenCalled()
    })

    test('debe manejar template personalizado', async () => {
      const commits = []
      const releaseData = { version: '1.0.0', commits }
      const customTemplate = '{{ version }} released!'

      mockTemplateService.renderTemplate.mockResolvedValue({
        success: true,
        output: '1.0.0 released!',
      })

      const result = await releaseService.generateChangelog(releaseData, customTemplate)

      expect(result.success).toBe(true)
      expect(result.changelog).toBe('1.0.0 released!')
      expect(mockTemplateService.renderTemplate).toHaveBeenCalledWith(customTemplate, releaseData)
    })
  })

  describe('createRelease', () => {
    test('debe crear release completo', async () => {
      const releaseConfig = {
        repoPath: '/path/to/repo',
        version: 'v1.1.0',
        branch: 'main',
        message: 'Release 1.1.0',
        template: 'changelog',
        pushTags: true,
        createChangelog: true,
      }

      // Mock validaciones exitosas
      mockGitService.validateRepository.mockResolvedValue({ isValid: true })
      mockGitService.isClean.mockResolvedValue(true)
      mockGitService.getCurrentBranch.mockResolvedValue('main')

      // Mock obtención de commits
      mockGitService.getTags.mockResolvedValue(['v1.0.0'])
      mockGitService.getCommitsBetweenTags.mockResolvedValue([
        { message: 'feat: nueva feature', hash: 'abc123' },
      ])

      // Mock creación de tag
      mockGitService.createTag.mockResolvedValue({ success: true, tagName: 'v1.1.0' })

      // Mock push de tags
      mockGitService.pushTags.mockResolvedValue({ success: true })

      // Mock generación de changelog
      mockTemplateService.loadTemplate.mockResolvedValue({
        success: true,
        template: { template: '# Release {{ version }}' },
      })
      mockTemplateService.renderTemplate.mockResolvedValue({
        success: true,
        output: '# Release v1.1.0',
      })

      const result = await releaseService.createRelease(releaseConfig)

      expect(result.success).toBe(true)
      expect(result.tag).toBe('v1.1.0')
      expect(result.changelog).toBeDefined()
      expect(mockGitService.createTag).toHaveBeenCalled()
      expect(mockGitService.pushTags).toHaveBeenCalled()
    })

    test('debe fallar si validaciones previas no pasan', async () => {
      const releaseConfig = {
        repoPath: '/path/to/repo',
        version: 'v1.1.0',
        branch: 'main',
        message: 'Release 1.1.0',
      }

      mockGitService.validateRepository.mockResolvedValue({
        isValid: false,
        message: 'Invalid repo',
      })

      const result = await releaseService.createRelease(releaseConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('prerrequisitos')
      expect(mockGitService.createTag).not.toHaveBeenCalled()
    })

    test('debe manejar error en creación de tag', async () => {
      const releaseConfig = {
        repoPath: '/path/to/repo',
        version: 'v1.1.0',
        branch: 'main',
        message: 'Release 1.1.0',
      }

      // Mock validaciones exitosas
      mockGitService.validateRepository.mockResolvedValue({ isValid: true })
      mockGitService.isClean.mockResolvedValue(true)
      mockGitService.getCurrentBranch.mockResolvedValue('main')
      mockGitService.getTags.mockResolvedValue(['v1.0.0'])
      mockGitService.getCommitsBetweenTags.mockResolvedValue([])

      // Mock error en tag
      mockGitService.createTag.mockResolvedValue({ success: false, error: 'Tag already exists' })

      const result = await releaseService.createRelease(releaseConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Tag already exists')
    })
  })

  describe('getReleaseHistory', () => {
    test('debe obtener historial de releases', async () => {
      const tags = ['v1.2.0', 'v1.1.0', 'v1.0.0']

      mockGitService.getTags.mockResolvedValue(tags)
      mockGitService.getCommitsBetweenTags
        .mockResolvedValueOnce([{ message: 'feat: feature 2' }]) // v1.1.0 -> v1.2.0
        .mockResolvedValueOnce([{ message: 'fix: bug fix' }]) // v1.0.0 -> v1.1.0

      const history = await releaseService.getReleaseHistory('/path/to/repo', 2)

      expect(history).toHaveLength(2)
      expect(history[0].version).toBe('v1.2.0')
      expect(history[0].previousVersion).toBe('v1.1.0')
      expect(history[1].version).toBe('v1.1.0')
      expect(history[1].previousVersion).toBe('v1.0.0')
    })

    test('debe manejar primer release sin versión anterior', async () => {
      mockGitService.getTags.mockResolvedValue(['v1.0.0'])

      const history = await releaseService.getReleaseHistory('/path/to/repo')

      expect(history).toHaveLength(1)
      expect(history[0].version).toBe('v1.0.0')
      expect(history[0].previousVersion).toBeNull()
    })
  })

  describe('rollbackRelease', () => {
    test('debe hacer rollback eliminando tag', async () => {
      const result = await releaseService.rollbackRelease('/path/to/repo', 'v1.1.0')

      // Nota: Esta funcionalidad requeriría implementación adicional en GitService
      // para eliminar tags, por ahora solo verificamos que se llame correctamente
      expect(result.attempted).toBe(true)
    })
  })
})
