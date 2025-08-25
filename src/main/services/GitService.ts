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
  author: string
  date: string
  refs: string
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
    // Acepta formatos: v1.0.0, 1.0.0
    const cleanVersion = tagName.startsWith('v') ? tagName.substring(1) : tagName
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

      // Verificar si el tag ya existe
      const existingTags = await git.tags()
      if (existingTags.all.includes(tagName)) {
        return {
          success: false,
          error: `El tag '${tagName}' ya existe en el repositorio`,
        }
      }

      // Crear el tag anotado
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
      const git = this.getGitInstance(repoPath)
      const tags = await git.tags()

      if (!sortBySemver) {
        return tags.all
      }

      // Ordenar por versionado semántico (descendente)
      return tags.all
        .filter((tag) => this.validateTagFormat(tag))
        .sort((a, b) => {
          const versionA = a.startsWith('v') ? a.substring(1) : a
          const versionB = b.startsWith('v') ? b.substring(1) : b
          return semver.rcompare(versionA, versionB)
        })
    } catch (error) {
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

      return log.all.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name || 'Unknown',
        date: commit.date,
        refs: commit.refs || '',
      }))
    } catch (error) {
      throw new Error(`Error obteniendo commits: ${(error as Error).message}`)
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
   * Limpia las instancias de git en caché
   */
  clearCache(): void {
    this.gitInstances.clear()
  }
}
