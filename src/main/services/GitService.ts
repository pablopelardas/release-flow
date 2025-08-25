import * as semver from 'semver'
import { type SimpleGit, simpleGit } from 'simple-git'

export interface GitValidationResult {
  isValid: boolean
  message: string
}

export interface GitStatus {
  currentBranch: string
  modifiedFiles: string[]
  untrackedFiles: string[]
  stagedFiles: string[]
  aheadBy: number
  behindBy: number
  isClean: boolean
}

export interface GitTagResult {
  success: boolean
  tagName?: string
  error?: string
}

export interface GitCommitResult {
  success: boolean
  commitHash?: string
  error?: string
}

export interface GitPushResult {
  success: boolean
  error?: string
}

export interface GitCommit {
  hash: string
  message: string
  subject: string
  type: string
  scope: string
  author: string
  date: string
  refs: string
}

export interface GitResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class GitService {
  private gitInstances: Map<string, SimpleGit> = new Map()

  /**
   * Obtiene una instancia de simple-git para el repositorio especificado
   */
  private getGitInstance(repoPath: string): SimpleGit {
    if (!this.gitInstances.has(repoPath)) {
      const git = simpleGit(repoPath)
      this.gitInstances.set(repoPath, git)
    }
    const instance = this.gitInstances.get(repoPath)
    if (!instance) {
      throw new Error(`Failed to get Git instance for ${repoPath}`)
    }
    return instance
  }

  /**
   * Valida si el directorio es un repositorio Git válido
   */
  async validateRepository(repoPath: string): Promise<GitValidationResult> {
    try {
      const git = this.getGitInstance(repoPath)
      const isRepo = await git.checkIsRepo()

      if (isRepo) {
        return {
          isValid: true,
          message: `Repositorio Git válido: ${repoPath}`,
        }
      } else {
        return {
          isValid: false,
          message: `El directorio ${repoPath} no es un repositorio Git válido`,
        }
      }
    } catch (error) {
      return {
        isValid: false,
        message: `Error al acceder al repositorio: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene el estado actual del repositorio
   */
  async getStatus(repoPath: string): Promise<GitStatus> {
    try {
      const git = this.getGitInstance(repoPath)
      const status = await git.status()

      return {
        currentBranch: status.current || 'unknown',
        modifiedFiles: status.modified || [],
        untrackedFiles: status.not_added || [],
        stagedFiles: status.staged || [],
        aheadBy: status.ahead || 0,
        behindBy: status.behind || 0,
        isClean:
          (status.modified?.length || 0) === 0 &&
          (status.not_added?.length || 0) === 0 &&
          (status.staged?.length || 0) === 0,
      }
    } catch (error) {
      throw new Error(`Error obteniendo estado: ${(error as Error).message}`)
    }
  }

  /**
   * Valida el formato de un tag (versionado semántico)
   */
  validateTagFormat(tagName: string): boolean {
    // Acepta formatos más flexibles: v1.0.0, 1.0.0, UtilitiesAPIv1.0.0, APIv2.3.1, etc.
    // Extraer la parte de versión removiendo prefijos comunes
    let cleanVersion = tagName
      .replace(/^v/, '') // v1.0.0 -> 1.0.0
      .replace(/^[A-Za-z]+v?/, '') // UtilitiesAPIv1.0.0 -> 1.0.0, APIv2.3.1 -> 2.3.1
      .replace(/^[^0-9]*/, '') // Cualquier otro prefijo no numérico
    
    console.log(`[GitService] validateTagFormat - Original: ${tagName}, Clean: ${cleanVersion}, Valid: ${semver.valid(cleanVersion) !== null}`)
    
    return semver.valid(cleanVersion) !== null
  }

  /**
   * Crea un tag anotado en el repositorio
   */
  async createTag(repoPath: string, tagName: string, message: string): Promise<GitTagResult> {
    try {
      // Validar formato del tag
      if (!this.validateTagFormat(tagName)) {
        return {
          success: false,
          error: `El tag '${tagName}' no tiene un formato válido. Use versionado semántico (ej: v1.0.0)`,
        }
      }

      const git = this.getGitInstance(repoPath)

      // Verificar si el tag ya existe y eliminarlo si es necesario
      const existingTags = await git.tags()
      if (existingTags.all.includes(tagName)) {
        console.log(`🏷️ Tag '${tagName}' ya existe, eliminando para sobrescribir...`)
        try {
          // Eliminar el tag local
          await git.tag(['-d', tagName])
          console.log(`✅ Tag local '${tagName}' eliminado`)
        } catch (deleteError) {
          console.warn(`⚠️ No se pudo eliminar el tag local '${tagName}':`, deleteError)
          // Continuar de todas formas, tal vez no existía localmente
        }
      }

      // Crear el tag anotado (usar -f para forzar sobrescritura si es necesario)
      await git.addAnnotatedTag(tagName, message)

      return {
        success: true,
        tagName: tagName,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error creando tag: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene lista de tags del repositorio
   */
  async getTags(repoPath: string, sortBySemver = false): Promise<string[]> {
    try {
      console.log(`[GitService] getTags called for path: ${repoPath}`)
      const git = this.getGitInstance(repoPath)
      const tags = await git.tags()
      
      console.log(`[GitService] Raw tags from git.tags():`, tags)
      console.log(`[GitService] tags.all:`, tags.all)

      if (!sortBySemver) {
        console.log(`[GitService] Returning unsorted tags:`, tags.all)
        return tags.all
      }

      // Ordenar por versionado semántico (descendente)
      const filteredTags = tags.all.filter((tag) => this.validateTagFormat(tag))
      console.log(`[GitService] Filtered tags:`, filteredTags)
      
      const sortedTags = filteredTags.sort((a, b) => {
        // Usar la misma lógica de limpieza que validateTagFormat
        const versionA = a
          .replace(/^v/, '')
          .replace(/^[A-Za-z]+v?/, '')
          .replace(/^[^0-9]*/, '')
        const versionB = b
          .replace(/^v/, '')
          .replace(/^[A-Za-z]+v?/, '')
          .replace(/^[^0-9]*/, '')
        return semver.rcompare(versionA, versionB)
      })
      
      console.log(`[GitService] Sorted tags:`, sortedTags)
      return sortedTags
    } catch (error) {
      console.error(`[GitService] Error in getTags:`, error)
      throw new Error(`Error obteniendo tags: ${(error as Error).message}`)
    }
  }

  /**
   * Realiza commit de cambios
   */
  async commitChanges(
    repoPath: string,
    message: string,
    files?: string[]
  ): Promise<GitCommitResult> {
    try {
      const git = this.getGitInstance(repoPath)

      // Agregar archivos al staging
      if (files && files.length > 0) {
        await git.add(files)
      } else {
        await git.add('.')
      }

      // Realizar commit
      const result = await git.commit(message)

      return {
        success: true,
        commitHash: result.commit,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error en commit: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Hace push de tags al repositorio remoto
   */
  async pushTags(repoPath: string, remote = 'origin'): Promise<GitPushResult> {
    try {
      const git = this.getGitInstance(repoPath)
      
      // Check if remote exists
      const remotes = await git.getRemotes(true)
      const remoteExists = remotes.some(r => r.name === remote)
      
      if (!remoteExists) {
        return {
          success: false,
          error: `El remote '${remote}' no existe en el repositorio. Remotos disponibles: ${remotes.map(r => r.name).join(', ') || 'ninguno'}`,
        }
      }
      
      // Check if remote has a valid URL
      const remoteInfo = remotes.find(r => r.name === remote)
      if (!remoteInfo?.refs?.push && !remoteInfo?.refs?.fetch) {
        return {
          success: false,
          error: `El remote '${remote}' no tiene una URL válida configurada`,
        }
      }

      await git.push(remote, '--tags')

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error haciendo push de tags: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene información de remotos configurados
   */
  async getRemotes(repoPath: string): Promise<Array<{name: string, url?: string}>> {
    try {
      const git = this.getGitInstance(repoPath)
      const remotes = await git.getRemotes(true)
      
      return remotes.map(remote => ({
        name: remote.name,
        url: remote.refs.push || remote.refs.fetch || undefined
      }))
    } catch (error) {
      throw new Error(`Error obteniendo remotos: ${(error as Error).message}`)
    }
  }

  /**
   * Obtiene commits entre dos tags
   */
  async getCommitsBetweenTags(
    repoPath: string,
    fromTag: string,
    toTag: string
  ): Promise<GitCommit[]> {
    try {
      const git = this.getGitInstance(repoPath)
      const log = await git.log({ from: fromTag, to: toTag })

      return log.all.map((commit) => {
        // Parsear mensaje de commit para obtener tipo y subject (estilo conventional commits)
        const message = commit.message.trim()
        const conventionalMatch = message.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/)
        
        let type = 'other'
        let scope = ''
        let subject = message

        if (conventionalMatch) {
          type = conventionalMatch[1]
          scope = conventionalMatch[2] || ''
          subject = conventionalMatch[3]
        } else {
          // Si no es conventional commit, intentar detectar el tipo por palabras clave
          const lowerMessage = message.toLowerCase()
          if (lowerMessage.includes('feat') || lowerMessage.includes('add')) type = 'feat'
          else if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) type = 'fix'
          else if (lowerMessage.includes('doc')) type = 'docs'
        }

        return {
          hash: commit.hash,
          message: commit.message,
          subject: subject,
          type: type,
          scope: scope,
          author: commit.author_name || 'Unknown',
          date: commit.date,
          refs: commit.refs || '',
        }
      })
    } catch (error) {
      throw new Error(`Error obteniendo commits: ${(error as Error).message}`)
    }
  }

  /**
   * Obtiene los últimos commits del repositorio
   */
  async getCommits(repoPath: string, limit: number = 50): Promise<GitResult<{ commits: GitCommit[] }>> {
    try {
      const git = this.getGitInstance(repoPath)
      const log = await git.log({ maxCount: limit })

      const commits = log.all.map((commit) => {
        // Parsear mensaje de commit para obtener tipo y subject (estilo conventional commits)
        const message = commit.message.trim()
        const conventionalMatch = message.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/)
        
        let type = 'other'
        let scope = ''
        let subject = message

        if (conventionalMatch) {
          type = conventionalMatch[1]
          scope = conventionalMatch[2] || ''
          subject = conventionalMatch[3]
        } else {
          // Si no es conventional commit, intentar detectar el tipo por palabras clave
          const lowerMessage = message.toLowerCase()
          if (lowerMessage.includes('feat') || lowerMessage.includes('add')) type = 'feat'
          else if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) type = 'fix'
          else if (lowerMessage.includes('doc')) type = 'docs'
        }

        return {
          hash: commit.hash,
          message: commit.message,
          subject: subject,
          type: type,
          scope: scope,
          author: commit.author_name || 'Unknown',
          date: commit.date,
          refs: commit.refs || '',
        }
      })

      return {
        success: true,
        data: { commits }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo commits: ${(error as Error).message}`
      }
    }
  }

  /**
   * Obtiene el tag base para comparación según el tipo de release
   */
  async getBaseTagForReleaseType(repoPath: string, currentVersion: string, releaseType: 'major' | 'minor' | 'patch'): Promise<string | null> {
    try {
      const tags = await this.getTags(repoPath, true) // Ordenados por semver desc
      
      if (tags.length === 0) return null
      
      // Convertir tags a versiones limpias para comparación
      const versionTags = tags.map(tag => {
        const cleanVersion = tag
          .replace(/^v/, '')
          .replace(/^[A-Za-z]+v?/, '')
          .replace(/^[^0-9]*/, '')
        return { tag, version: cleanVersion }
      })
      
      // Parsear versión actual
      const [currentMajor, currentMinor] = currentVersion.split('.').map(Number)
      
      let baseTag: string | null = null
      
      switch (releaseType) {
        case 'patch':
          // Para patch: desde la versión actual hasta HEAD
          // Buscar el tag exacto de la versión actual
          baseTag = versionTags.find(vt => vt.version === currentVersion)?.tag || null
          break
          
        case 'minor':
          // Para minor: desde el último minor (x.y.0) hasta HEAD
          // Ejemplo: si estamos en 1.1.0 → 1.2.0, comparar desde 1.1.0
          // Si estamos en 1.1.3 → 1.2.0, comparar desde 1.1.0 (inicio del minor actual)
          const [, currentMinorNum, currentPatch] = currentVersion.split('.').map(Number)
          
          // Buscar el tag base del minor actual (x.currentMinor.0)
          baseTag = versionTags.find(vt => {
            const [major, minor, patch] = vt.version.split('.').map(Number)
            return major === currentMajor && minor === currentMinorNum && patch === 0
          })?.tag || null
          
          // Si no encuentra x.y.0, buscar el primer tag del minor actual
          if (!baseTag) {
            baseTag = versionTags
              .filter(vt => {
                const [major, minor] = vt.version.split('.').map(Number)
                return major === currentMajor && minor === currentMinorNum
              })
              .pop()?.tag || null // El más viejo del minor actual
          }
          
          // Si aún no encuentra (raro caso), usar el tag actual
          if (!baseTag) {
            baseTag = versionTags.find(vt => vt.version === currentVersion)?.tag || null
          }
          break
          
        case 'major':
          // Para major: desde el último tag de la versión major anterior hasta HEAD
          baseTag = versionTags.find(vt => {
            const [major] = vt.version.split('.').map(Number)
            return major === currentMajor - 1
          })?.tag || null
          // Si no encuentra, buscar cualquier tag anterior
          if (!baseTag) {
            baseTag = versionTags
              .filter(vt => {
                const [major] = vt.version.split('.').map(Number)
                return major < currentMajor
              })[0]?.tag || null // El primero (más nuevo) anterior
          }
          break
      }
      
      console.log(`[GitService] Base tag for ${releaseType} release:`)
      console.log(`  Current version: ${currentVersion}`)
      console.log(`  Next version: ${releaseType === 'major' ? `${currentMajor + 1}.0.0` : 
                                   releaseType === 'minor' ? `${currentMajor}.${currentMinor + 1}.0` : 
                                   `${currentMajor}.${currentMinor}.${currentVersion.split('.')[2] ? parseInt(currentVersion.split('.')[2]) + 1 : 1}`}`)
      console.log(`  Base tag selected: ${baseTag}`)
      return baseTag
      
    } catch (error) {
      console.error(`[GitService] Error getting base tag:`, error)
      return null
    }
  }

  /**
   * Obtiene commits desde el último tag hasta HEAD
   */
  async getCommitsSinceLastTag(repoPath: string): Promise<GitResult<{ commits: GitCommit[], fromTag?: string }>> {
    try {
      const git = this.getGitInstance(repoPath)
      
      // Obtener el último tag
      const tags = await git.tag(['--sort=-version:refname'])
      const tagList = tags.split('\n').filter(tag => tag.trim())
      
      if (tagList.length === 0) {
        // Si no hay tags, obtener los últimos 20 commits
        return this.getCommits(repoPath, 20)
      }
      
      const lastTag = tagList[0].trim()
      console.log(`[Git] Getting commits since last tag: ${lastTag}`)
      
      // Obtener commits desde el último tag hasta HEAD
      const log = await git.log({ from: lastTag, to: 'HEAD' })
      
      const commits = log.all.map((commit) => {
        // Parsear mensaje de commit para obtener tipo y subject (estilo conventional commits)
        const message = commit.message.trim()
        const conventionalMatch = message.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/)
        
        let type = 'other'
        let scope = ''
        let subject = message

        if (conventionalMatch) {
          type = conventionalMatch[1]
          scope = conventionalMatch[2] || ''
          subject = conventionalMatch[3]
        } else {
          // Si no es conventional commit, intentar detectar el tipo por palabras clave
          const lowerMessage = message.toLowerCase()
          if (lowerMessage.includes('feat') || lowerMessage.includes('add')) type = 'feat'
          else if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) type = 'fix'
          else if (lowerMessage.includes('doc')) type = 'docs'
        }

        return {
          hash: commit.hash,
          message: commit.message,
          subject: subject,
          type: type,
          scope: scope,
          author: commit.author_name || 'Unknown',
          date: commit.date,
          refs: commit.refs || '',
        }
      })

      return {
        success: true,
        data: { commits, fromTag: lastTag }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo commits desde último tag: ${(error as Error).message}`
      }
    }
  }

  /**
   * Obtiene commits para un tipo específico de release
   */
  async getCommitsForReleaseType(
    repoPath: string, 
    currentVersion: string, 
    releaseType: 'major' | 'minor' | 'patch'
  ): Promise<GitResult<{ commits: GitCommit[], fromTag?: string, toTag: string }>> {
    try {
      const git = this.getGitInstance(repoPath)
      
      // Obtener el tag base según el tipo de release
      const baseTag = await this.getBaseTagForReleaseType(repoPath, currentVersion, releaseType)
      
      if (!baseTag) {
        // Si no hay tag base, obtener los últimos 20 commits
        console.log(`[GitService] No base tag found, getting recent commits`)
        const recentCommits = await this.getCommits(repoPath, 20)
        return {
          success: recentCommits.success,
          data: {
            commits: recentCommits.data?.commits || [],
            fromTag: 'inicio',
            toTag: 'HEAD'
          },
          error: recentCommits.error
        }
      }
      
      console.log(`[GitService] Getting commits from ${baseTag} to HEAD`)
      
      // Obtener commits desde el tag base hasta HEAD
      const log = await git.log({ from: baseTag, to: 'HEAD' })
      
      const commits = log.all.map((commit) => {
        // Parsear mensaje de commit para obtener tipo y subject (estilo conventional commits)
        const message = commit.message.trim()
        const conventionalMatch = message.match(/^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/)
        
        let type = 'other'
        let scope = ''
        let subject = message

        if (conventionalMatch) {
          type = conventionalMatch[1]
          scope = conventionalMatch[2] || ''
          subject = conventionalMatch[3]
        } else {
          // Si no es conventional commit, intentar detectar el tipo por palabras clave
          const lowerMessage = message.toLowerCase()
          if (lowerMessage.includes('feat') || lowerMessage.includes('add')) type = 'feat'
          else if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('hotfix')) type = 'fix'
          else if (lowerMessage.includes('doc')) type = 'docs'
        }

        return {
          hash: commit.hash,
          message: commit.message,
          subject: subject,
          type: type,
          scope: scope,
          author: commit.author_name || 'Unknown',
          date: commit.date,
          refs: commit.refs || '',
        }
      })

      console.log(`[GitService] Found ${commits.length} commits between ${baseTag} and HEAD`)

      return {
        success: true,
        data: { 
          commits, 
          fromTag: baseTag,
          toTag: 'HEAD'
        }
      }
    } catch (error) {
      console.error(`[GitService] Error in getCommitsForReleaseType:`, error)
      return {
        success: false,
        error: `Error obteniendo commits para release ${releaseType}: ${(error as Error).message}`
      }
    }
  }

  /**
   * Obtiene diferencias entre dos referencias (tags, commits, etc.)
   */
  async getDiff(repoPath: string, from: string, to: string): Promise<string> {
    try {
      const git = this.getGitInstance(repoPath)
      return await git.diff([from, to])
    } catch (error) {
      throw new Error(`Error obteniendo diff: ${(error as Error).message}`)
    }
  }

  /**
   * Obtiene la rama actual del repositorio
   */
  async getCurrentBranch(repoPath: string): Promise<string> {
    try {
      const git = this.getGitInstance(repoPath)
      const branch = await git.branch()
      return branch.current || 'unknown'
    } catch (error) {
      throw new Error(`Error obteniendo rama actual: ${(error as Error).message}`)
    }
  }

  /**
   * Verifica si hay cambios pendientes en el repositorio
   */
  async isClean(repoPath: string): Promise<boolean> {
    const status = await this.getStatus(repoPath)
    return status.isClean
  }

  /**
   * Valida el estado del repositorio antes de crear un release
   */
  async validateRepositoryForRelease(repoPath: string): Promise<{
    isValid: boolean
    warnings: string[]
    errors: string[]
    status: GitStatus
  }> {
    try {
      const status = await this.getStatus(repoPath)
      const warnings: string[] = []
      const errors: string[] = []

      // Verificar si el repositorio está sucio
      if (!status.isClean) {
        if (status.stagedFiles.length > 0) {
          errors.push(`Hay ${status.stagedFiles.length} archivo(s) en staging sin commitear`)
        }
        if (status.modifiedFiles.length > 0) {
          warnings.push(`Hay ${status.modifiedFiles.length} archivo(s) modificado(s) sin commitear`)
        }
        if (status.untrackedFiles.length > 0) {
          warnings.push(`Hay ${status.untrackedFiles.length} archivo(s) sin trackear`)
        }
      }

      // Verificar commits pendientes de push
      if (status.aheadBy > 0) {
        warnings.push(`Hay ${status.aheadBy} commit(s) pendiente(s) de push al remoto`)
      }

      // Verificar commits pendientes de pull
      if (status.behindBy > 0) {
        warnings.push(`El repositorio está ${status.behindBy} commit(s) atrás del remoto`)
      }

      // Verificar remotes disponibles
      try {
        const remotes = await this.getRemotes(repoPath)
        if (remotes.length === 0) {
          warnings.push('No hay remotos configurados - los tags no se podrán pushear automáticamente')
        }
      } catch (error) {
        warnings.push('No se pudo verificar la configuración de remotos')
      }

      const isValid = errors.length === 0

      return {
        isValid,
        warnings,
        errors,
        status
      }
    } catch (error) {
      return {
        isValid: false,
        warnings: [],
        errors: [`Error validando repositorio: ${(error as Error).message}`],
        status: {
          currentBranch: 'unknown',
          modifiedFiles: [],
          untrackedFiles: [],
          stagedFiles: [],
          aheadBy: 0,
          behindBy: 0,
          isClean: false
        }
      }
    }
  }

  /**
   * Limpia las instancias de git en caché
   */
  clearCache(): void {
    this.gitInstances.clear()
  }
}
