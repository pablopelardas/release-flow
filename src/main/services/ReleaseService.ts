import * as semver from 'semver'
import { type GitCommit, GitService } from './GitService'
import { TemplateService } from './TemplateService'

export interface ReleaseConfig {
  repoPath: string
  version: string
  branch: string
  message: string
  template?: string
  pushTags?: boolean
  createChangelog?: boolean
  fromTag?: string
}

export interface ReleaseResult {
  success: boolean
  tag?: string
  changelog?: string
  commitAnalysis?: CommitAnalysis
  error?: string
}

export interface ReleasePrerequisites {
  isValid: boolean
  message?: string
  checks: {
    repositoryValid: boolean
    workingTreeClean: boolean
    correctBranch: boolean
  }
}

export interface CommitAnalysis {
  features: GitCommit[]
  fixes: GitCommit[]
  documentation: GitCommit[]
  chores: GitCommit[]
  breakingChanges: GitCommit[]
  others: GitCommit[]
  suggestedBump: 'major' | 'minor' | 'patch'
  totalCommits: number
}

export interface ChangelogResult {
  success: boolean
  changelog?: string
  error?: string
}

export interface ReleaseHistoryItem {
  version: string
  previousVersion: string | null
  date: string
  commits: GitCommit[]
  commitCount: number
  analysis: CommitAnalysis
}

export interface RollbackResult {
  success: boolean
  attempted: boolean
  error?: string
}

export type VersionBump = 'major' | 'minor' | 'patch'

export class ReleaseService {
  private gitService: GitService
  private templateService: TemplateService

  constructor() {
    this.gitService = new GitService()
    this.templateService = new TemplateService()
  }

  /**
   * Calcula la siguiente versión basada en el tipo de bump
   */
  calculateNextVersion(currentVersion: string | undefined, bumpType: VersionBump): string {
    if (!currentVersion) {
      return '1.0.0'
    }

    // Detectar si tiene prefijo 'v'
    const hasVPrefix = currentVersion.startsWith('v')
    const cleanVersion = hasVPrefix ? currentVersion.substring(1) : currentVersion

    let nextVersion: string

    switch (bumpType) {
      case 'major':
        nextVersion = semver.inc(cleanVersion, 'major') || '1.0.0'
        break
      case 'minor':
        nextVersion = semver.inc(cleanVersion, 'minor') || '0.1.0'
        break
      case 'patch':
        nextVersion = semver.inc(cleanVersion, 'patch') || '0.0.1'
        break
      default:
        nextVersion = semver.inc(cleanVersion, 'patch') || '0.0.1'
    }

    return hasVPrefix ? `v${nextVersion}` : nextVersion
  }

  /**
   * Analiza commits usando convención de commits convencionales
   */
  analyzeCommits(commits: GitCommit[]): CommitAnalysis {
    const analysis: CommitAnalysis = {
      features: [],
      fixes: [],
      documentation: [],
      chores: [],
      breakingChanges: [],
      others: [],
      suggestedBump: 'patch',
      totalCommits: commits.length,
    }

    let hasMajorChanges = false
    let hasMinorChanges = false

    for (const commit of commits) {
      const message = commit.message.toLowerCase()

      // Detectar breaking changes (! después del tipo o BREAKING CHANGE en el cuerpo)
      if (message.includes('!:') || message.includes('breaking change')) {
        analysis.breakingChanges.push(commit)
        hasMajorChanges = true
        continue
      }

      // Clasificar por tipo de commit convencional
      if (message.startsWith('feat:') || message.startsWith('feature:')) {
        analysis.features.push(commit)
        hasMinorChanges = true
      } else if (message.startsWith('fix:') || message.startsWith('bugfix:')) {
        analysis.fixes.push(commit)
      } else if (message.startsWith('docs:') || message.startsWith('doc:')) {
        analysis.documentation.push(commit)
      } else if (
        message.startsWith('chore:') ||
        message.startsWith('build:') ||
        message.startsWith('ci:') ||
        message.startsWith('test:')
      ) {
        analysis.chores.push(commit)
      } else {
        analysis.others.push(commit)
      }
    }

    // Determinar bump sugerido
    if (hasMajorChanges) {
      analysis.suggestedBump = 'major'
    } else if (hasMinorChanges) {
      analysis.suggestedBump = 'minor'
    } else {
      analysis.suggestedBump = 'patch'
    }

    return analysis
  }

  /**
   * Valida prerrequisitos para crear un release
   */
  async validateReleasePrerequisites(
    repoPath: string,
    expectedBranch: string
  ): Promise<ReleasePrerequisites> {
    const checks = {
      repositoryValid: false,
      workingTreeClean: false,
      correctBranch: false,
    }

    try {
      // Validar que es un repositorio Git válido
      const repoValidation = await this.gitService.validateRepository(repoPath)
      checks.repositoryValid = repoValidation.isValid

      if (!checks.repositoryValid) {
        return {
          isValid: false,
          message: `Repositorio inválido: ${repoValidation.message}`,
          checks,
        }
      }

      // Verificar que el working tree esté limpio
      checks.workingTreeClean = await this.gitService.isClean(repoPath)

      // Verificar que estemos en la rama correcta
      const currentBranch = await this.gitService.getCurrentBranch(repoPath)
      checks.correctBranch = currentBranch === expectedBranch

      const isValid = checks.repositoryValid && checks.workingTreeClean && checks.correctBranch

      return {
        isValid,
        message: isValid
          ? 'Todos los prerrequisitos cumplidos'
          : 'Algunos prerrequisitos no se cumplen',
        checks,
      }
    } catch (error) {
      return {
        isValid: false,
        message: `Error validando prerrequisitos: ${(error as Error).message}`,
        checks,
      }
    }
  }

  /**
   * Genera un changelog basado en commits y template
   */
  async generateChangelog(
    releaseData: Record<string, unknown>,
    templateOrId: string
  ): Promise<ChangelogResult> {
    try {
      let template: string

      // Determinar si es un ID de template o un template directo
      if (templateOrId.includes('{{') || templateOrId.includes('{%')) {
        // Es un template directo
        template = templateOrId
      } else {
        // Es un ID de template, cargarlo
        const templateResult = await this.templateService.loadTemplate(templateOrId)
        if (!templateResult.success || !templateResult.template) {
          return {
            success: false,
            error: `Error cargando template: ${templateResult.error}`,
          }
        }
        template = templateResult.template.template
      }

      // Renderizar el template
      const renderResult = await this.templateService.renderTemplate(template, releaseData)

      if (!renderResult.success) {
        return {
          success: false,
          error: `Error renderizando changelog: ${renderResult.error}`,
        }
      }

      return {
        success: true,
        changelog: renderResult.output,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error generando changelog: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Crea un release completo
   */
  async createRelease(config: ReleaseConfig): Promise<ReleaseResult> {
    try {
      // Validar prerrequisitos
      const prerequisites = await this.validateReleasePrerequisites(config.repoPath, config.branch)
      if (!prerequisites.isValid) {
        return {
          success: false,
          error: `No se cumplen los prerrequisitos para el release: ${prerequisites.message}`,
        }
      }

      // Obtener tags existentes para determinar el rango de commits
      const existingTags = await this.gitService.getTags(config.repoPath, true)
      const lastTag = existingTags.length > 0 ? existingTags[0] : null

      // Obtener commits desde el último tag
      let commits: GitCommit[] = []
      if (lastTag) {
        commits = await this.gitService.getCommitsBetweenTags(config.repoPath, lastTag, 'HEAD')
      }

      // Analizar commits
      const commitAnalysis = this.analyzeCommits(commits)

      // Preparar datos para el changelog
      const releaseData = {
        version: config.version,
        previousVersion: lastTag,
        date: new Date().toISOString().split('T')[0],
        author: 'ReleaseFlow',
        commits,
        analysis: commitAnalysis,
        project: {
          name: 'ReleaseFlow', // TODO: Obtener del package.json o configuración
        },
      }

      // Generar changelog si se solicita
      let changelog: string | undefined
      if (config.createChangelog && config.template) {
        const changelogResult = await this.generateChangelog(releaseData, config.template)
        if (changelogResult.success) {
          changelog = changelogResult.changelog
        }
      }

      // Crear el tag
      const tagResult = await this.gitService.createTag(
        config.repoPath,
        config.version,
        config.message
      )

      if (!tagResult.success) {
        return {
          success: false,
          error: tagResult.error,
        }
      }

      // Hacer push del tag si se solicita
      if (config.pushTags) {
        const pushResult = await this.gitService.pushTags(config.repoPath)
        if (!pushResult.success) {
          return {
            success: false,
            error: `Tag creado pero falló el push: ${pushResult.error}`,
          }
        }
      }

      return {
        success: true,
        tag: config.version,
        changelog,
        commitAnalysis,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error creando release: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene el historial de releases
   */
  async getReleaseHistory(repoPath: string, limit?: number): Promise<ReleaseHistoryItem[]> {
    try {
      const tags = await this.gitService.getTags(repoPath, true)
      const history: ReleaseHistoryItem[] = []

      const tagsToProcess = limit ? tags.slice(0, limit) : tags

      for (let i = 0; i < tagsToProcess.length; i++) {
        const currentTag = tagsToProcess[i]
        const previousTag = i < tags.length - 1 ? tags[i + 1] : null

        // Obtener commits entre tags
        let commits: GitCommit[] = []
        if (previousTag) {
          commits = await this.gitService.getCommitsBetweenTags(repoPath, previousTag, currentTag)
        }

        const analysis = this.analyzeCommits(commits)

        history.push({
          version: currentTag,
          previousVersion: previousTag,
          date: new Date().toISOString().split('T')[0], // TODO: Obtener fecha real del tag
          commits,
          commitCount: commits.length,
          analysis,
        })
      }

      return history
    } catch (error) {
      throw new Error(`Error obteniendo historial de releases: ${(error as Error).message}`)
    }
  }

  /**
   * Realiza rollback de un release (elimina tag)
   */
  async rollbackRelease(_repoPath: string, _tagName: string): Promise<RollbackResult> {
    try {
      // TODO: Implementar eliminación de tag en GitService
      // Por ahora solo retornamos que se intentó
      return {
        success: false,
        attempted: true,
        error: 'Funcionalidad de rollback no implementada completamente',
      }
    } catch (error) {
      return {
        success: false,
        attempted: true,
        error: `Error en rollback: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Sugiere la próxima versión basada en commits
   */
  async suggestNextVersion(repoPath: string, currentVersion?: string): Promise<string> {
    try {
      // Si no se proporciona versión actual, obtener del último tag
      if (!currentVersion) {
        const tags = await this.gitService.getTags(repoPath, true)
        currentVersion = tags.length > 0 ? tags[0] : undefined
      }

      // Obtener commits desde la última versión
      let commits: GitCommit[] = []
      if (currentVersion) {
        commits = await this.gitService.getCommitsBetweenTags(repoPath, currentVersion, 'HEAD')
      }

      const analysis = this.analyzeCommits(commits)
      return this.calculateNextVersion(currentVersion, analysis.suggestedBump)
    } catch (error) {
      throw new Error(`Error sugiriendo próxima versión: ${(error as Error).message}`)
    }
  }

  /**
   * Obtiene estadísticas de releases
   */
  async getReleaseStatistics(repoPath: string): Promise<{
    totalReleases: number
    averageCommitsPerRelease: number
    mostActiveType: string
    releaseFrequency: string
  }> {
    try {
      const history = await this.getReleaseHistory(repoPath)

      const totalReleases = history.length
      const totalCommits = history.reduce((sum, release) => sum + release.commitCount, 0)
      const averageCommitsPerRelease =
        totalReleases > 0 ? Math.round(totalCommits / totalReleases) : 0

      // Contar tipos de commits más frecuentes
      const typeCounts = {
        features: 0,
        fixes: 0,
        chores: 0,
        docs: 0,
      }

      history.forEach((release) => {
        typeCounts.features += release.analysis.features.length
        typeCounts.fixes += release.analysis.fixes.length
        typeCounts.chores += release.analysis.chores.length
        typeCounts.docs += release.analysis.documentation.length
      })

      const mostActiveType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0][0]

      return {
        totalReleases,
        averageCommitsPerRelease,
        mostActiveType,
        releaseFrequency: 'N/A', // TODO: Calcular basado en fechas reales
      }
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${(error as Error).message}`)
    }
  }
}
