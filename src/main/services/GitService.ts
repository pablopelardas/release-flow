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

export interface GitResult<T = unknown> {
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
    // También acepta versiones de 4 números: 1.0.1.187, v1.0.6.267, etc.
    
    // Extraer la parte de versión removiendo prefijos comunes
    const cleanVersion = tagName
      .replace(/^v/, '') // v1.0.0 -> 1.0.0
      .replace(/^[A-Za-z]+v?/, '') // UtilitiesAPIv1.0.0 -> 1.0.0, APIv2.3.1 -> 2.3.1
      .replace(/^[^0-9]*/, '') // Cualquier otro prefijo no numérico

    // Verificar si es semver estándar (3 números)
    const isSemver = semver.valid(cleanVersion) !== null
    
    // Verificar si es versión de 4 números (ej: 1.0.1.187)
    const fourNumberPattern = /^\d+\.\d+\.\d+\.\d+$/
    const isFourNumber = fourNumberPattern.test(cleanVersion)

    const isValid = isSemver || isFourNumber


    return isValid
  }

  /**
   * Compara dos versiones (semver de 3 números o versiones de 4 números)
   * Retorna: -1 si a < b, 0 si a === b, 1 si a > b
   */
  private compareVersions(versionA: string, versionB: string): number {
    // Intentar comparar con semver primero
    try {
      if (semver.valid(versionA) && semver.valid(versionB)) {
        return semver.compare(versionA, versionB)
      }
    } catch (err) {
      // Si falla semver, usar comparación manual
    }

    // Comparación manual para versiones de 4 números o mixtas
    const partsA = versionA.split('.').map(n => parseInt(n, 10) || 0)
    const partsB = versionB.split('.').map(n => parseInt(n, 10) || 0)
    
    // Hacer que ambos arrays tengan la misma longitud
    const maxLength = Math.max(partsA.length, partsB.length)
    while (partsA.length < maxLength) partsA.push(0)
    while (partsB.length < maxLength) partsB.push(0)
    
    for (let i = 0; i < maxLength; i++) {
      if (partsA[i] < partsB[i]) return -1
      if (partsA[i] > partsB[i]) return 1
    }
    
    return 0
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
   * Obtiene el último tag del repositorio (más reciente por fecha)
   */
  async getLatestTag(repoPath: string, tagPrefix?: string): Promise<string | null> {
    try {
      const git = this.getGitInstance(repoPath)

      // Siempre usar comandos Git directos para evitar cache
      let result: string
      
      if (tagPrefix && tagPrefix.trim()) {
        // Con prefijo: obtener todos los tags que coincidan con el prefijo y ordenar por fecha
        result = await git.raw([
          'for-each-ref',
          '--sort=-committerdate',
          '--format=%(refname:short)',
          'refs/tags',
          `--merged=HEAD`
        ])
        
        const allTags = result.trim().split('\n').filter(tag => tag && tag.startsWith(tagPrefix.trim()))
        const latestTag = allTags.length > 0 ? allTags[0] : null
        return latestTag
      } else {
        // Sin prefijo: obtener el último tag por fecha
        result = await git.raw([
          'for-each-ref',
          '--sort=-committerdate',
          '--format=%(refname:short)',
          'refs/tags',
          '--count=1',
        ])

        const latestTag = result.trim()
        return latestTag || null
      }
    } catch (error) {
      console.error(`[GitService] Error getting latest tag:`, error)
      return null
    }
  }

  /**
   * Obtiene lista de tags del repositorio
   */
  async getTags(repoPath: string, sortBySemver = false, tagPrefix?: string): Promise<string[]> {
    try {
      const git = this.getGitInstance(repoPath)
      const tags = await git.tags()

      // Filtrar por prefijo si se proporciona
      let allTags = tags.all
      if (tagPrefix && tagPrefix.trim()) {
        allTags = tags.all.filter(tag => tag.startsWith(tagPrefix.trim()))
      }

      if (!sortBySemver) {
        return allTags
      }

      // Ordenar por versionado semántico (descendente)
      const filteredTags = allTags.filter((tag) => this.validateTagFormat(tag))

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
        // Orden descendente (más reciente primero)
        return this.compareVersions(versionB, versionA)
      })

      return sortedTags
    } catch (error) {
      console.error(`[GitService] Error in getTags:`, error)
      throw new Error(`Error obteniendo tags: ${(error as Error).message}`)
    }
  }

  /**
   * Obtiene información detallada de todos los tags
   */
  async getTagsWithDetails(repoPath: string, sortBySemver = false, tagPrefix?: string): Promise<Array<{name: string, date: string, message: string}>> {
    try {
      const git = this.getGitInstance(repoPath)
      const tags = await git.tags()

      // Filtrar por prefijo si se proporciona
      let allTags = tags.all
      if (tagPrefix && tagPrefix.trim()) {
        allTags = tags.all.filter(tag => tag.startsWith(tagPrefix.trim()))
      }

      const tagDetails = []
      
      for (const tagName of allTags) {
        try {
          // Get tag details including date and message
          const tagInfo = await git.show([tagName, '--format=%ai|%s', '--no-patch'])
          const [date, ...messageParts] = tagInfo.split('|')
          const message = messageParts.join('|') || 'Sin mensaje'
          
          tagDetails.push({
            name: tagName,
            date: date.trim(),
            message: message.trim()
          })
        } catch (tagError) {
          console.warn(`[GitService] Could not get details for tag ${tagName}:`, tagError)
          tagDetails.push({
            name: tagName,
            date: new Date().toISOString(),
            message: 'Sin mensaje'
          })
        }
      }

      if (!sortBySemver) {
        return tagDetails
      }

      // Filter and sort by semver
      const filteredTags = tagDetails.filter(tag => this.validateTagFormat(tag.name))
      
      const sortedTags = filteredTags.sort((a, b) => {
        const versionA = a.name
          .replace(/^v/, '')
          .replace(/^[A-Za-z]+v?/, '')
          .replace(/^[^0-9]*/, '')
        const versionB = b.name
          .replace(/^v/, '')
          .replace(/^[A-Za-z]+v?/, '')
          .replace(/^[^0-9]*/, '')
        // Orden descendente (más reciente primero)
        return this.compareVersions(versionB, versionA)
      })

      return sortedTags
    } catch (error) {
      console.error(`[GitService] Error in getTagsWithDetails:`, error)
      throw new Error(`Error obteniendo detalles de tags: ${(error as Error).message}`)
    }
  }

  /**
   * Extrae el tipo de commit del mensaje
   */
  private extractCommitType(message: string): string {
    if (!message) return 'other'
    
    const lowerMessage = message.toLowerCase()
    const conventionalCommitMatch = message.match(
      /^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/
    )
    
    if (conventionalCommitMatch) {
      return conventionalCommitMatch[1]
    }
    
    // Fallback to keyword detection
    if (lowerMessage.includes('feat') || lowerMessage.includes('add')) return 'feat'
    else if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) return 'fix'
    else if (lowerMessage.includes('doc')) return 'docs'
    else if (lowerMessage.includes('refactor')) return 'refactor'
    else if (lowerMessage.includes('test')) return 'test'
    else if (lowerMessage.includes('chore')) return 'chore'
    else if (lowerMessage.includes('style')) return 'style'
    else if (lowerMessage.includes('perf')) return 'perf'
    
    return 'other'
  }

  /**
   * Extrae el scope del mensaje de commit
   */
  private extractCommitScope(message: string): string {
    if (!message) return ''
    
    const conventionalCommitMatch = message.match(
      /^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/
    )
    
    return conventionalCommitMatch?.[2] || ''
  }

  /**
   * Obtiene commits entre dos tags o desde un tag hasta HEAD
   */
  async getCommitsBetweenTags(repoPath: string, fromTag?: string, toTag?: string): Promise<GitCommit[]> {
    try {
      const git = this.getGitInstance(repoPath)
      
      let gitCommand: string[]
      let debugMessage = ''
      
      if (!fromTag && !toTag) {
        gitCommand = ['log', '--pretty=format:%H|%ai|%s|%an|%ae']
        debugMessage = 'Obteniendo todos los commits'
      } else if (!fromTag && toTag) {
        gitCommand = ['log', `${toTag}`, '--pretty=format:%H|%ai|%s|%an|%ae']
        debugMessage = `Obteniendo commits desde el inicio hasta ${toTag}`
      } else if (fromTag && !toTag) {
        gitCommand = ['log', `${fromTag}..HEAD`, '--pretty=format:%H|%ai|%s|%an|%ae']
        debugMessage = `Obteniendo commits desde ${fromTag} hasta HEAD`
      } else {
        gitCommand = ['log', `${fromTag}..${toTag}`, '--pretty=format:%H|%ai|%s|%an|%ae']
        debugMessage = `Obteniendo commits entre ${fromTag} y ${toTag}`
      }
      
      // DEBUG: Primero verificar el conteo con rev-list
      if (fromTag && !toTag) {
        const countResult = await git.raw(['rev-list', '--count', `${fromTag}..HEAD`])
        const expectedCount = parseInt(countResult.trim(), 10)
        console.log(`🔍 [DEBUG] ${debugMessage} - Conteo esperado: ${expectedCount}`)
        
        if (expectedCount === 0) {
          console.log(`✅ [DEBUG] No hay commits desde ${fromTag}, retornando array vacío`)
          return []
        }
      }
      
      const result = await git.raw(gitCommand)
      
      // DEBUG: Mostrar el resultado raw
      if (result.trim().length > 0) {
        const lines = result.trim().split('\n')
        console.log(`🔍 [DEBUG] Comando ejecutado: git ${gitCommand.join(' ')}`)
        console.log(`🔍 [DEBUG] Resultado raw tiene ${lines.length} líneas`)
        if (lines.length <= 3) {
          console.log(`🔍 [DEBUG] Líneas del resultado:`, lines)
        }
      } else {
        console.log(`✅ [DEBUG] ${debugMessage} - No hay commits, resultado vacío`)
        return []
      }
      
      const lines = result.trim().split('\n').filter(line => line.trim())
      
      const commits = lines.map((line): GitCommit => {
        const [hash, date, message, author, email] = line.split('|')
        return {
          hash: hash,
          message: message,
          subject: message,
          author: author,
          date: date,
          type: this.extractCommitType(message),
          scope: this.extractCommitScope(message),
          refs: '',
        }
      })
      
      console.log(`📊 [RESULT] ${debugMessage} - Encontrados ${commits.length} commits`)
      return commits
      
    } catch (error) {
      console.error(`[GitService] Error in getCommitsBetweenTags:`, error)
      throw new Error(`Error obteniendo commits entre tags: ${(error as Error).message}`)
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
      const remoteExists = remotes.some((r) => r.name === remote)

      if (!remoteExists) {
        return {
          success: false,
          error: `El remote '${remote}' no existe en el repositorio. Remotos disponibles: ${remotes.map((r) => r.name).join(', ') || 'ninguno'}`,
        }
      }

      // Check if remote has a valid URL
      const remoteInfo = remotes.find((r) => r.name === remote)
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
  async getRemotes(repoPath: string): Promise<Array<{ name: string; url?: string }>> {
    try {
      const git = this.getGitInstance(repoPath)
      const remotes = await git.getRemotes(true)

      return remotes.map((remote) => ({
        name: remote.name,
        url: remote.refs.push || remote.refs.fetch || undefined,
      }))
    } catch (error) {
      throw new Error(`Error obteniendo remotos: ${(error as Error).message}`)
    }
  }


  /**
   * Obtiene los últimos commits del repositorio
   */
  async getCommits(
    repoPath: string,
    limit: number = 50
  ): Promise<GitResult<{ commits: GitCommit[] }>> {
    try {
      const git = this.getGitInstance(repoPath)
      const log = await git.log({ maxCount: limit })

      const commits = log.all.map((commit) => {
        // Parsear mensaje de commit para obtener tipo y subject (estilo conventional commits)
        const message = commit.message.trim()
        const conventionalMatch = message.match(
          /^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/
        )

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
          refs: '',
        }
      })

      return {
        success: true,
        data: { commits },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo commits: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene el tag base para comparación según el tipo de release
   */
  async getBaseTagForReleaseType(
    repoPath: string,
    currentVersion: string,
    releaseType: 'major' | 'minor' | 'patch',
    tagPrefix?: string
  ): Promise<string | null> {
    try {
      const tags = await this.getTags(repoPath, true, tagPrefix) // Ordenados por semver desc y filtrados por prefijo

      if (tags.length === 0) return null

      // Convertir tags a versiones limpias para comparación
      const versionTags = tags.map((tag) => {
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
        case 'patch': {
          // Para patch: buscar el último patch del minor actual
          const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number)
          
          // Primero buscar el tag exacto de la versión anterior (patch - 1)
          const previousPatchVersion = `${currentMajor}.${currentMinor}.${Math.max(0, currentPatch - 1)}`
          baseTag = versionTags.find((vt) => vt.version === previousPatchVersion)?.tag || null
          
          // Si no encuentra, buscar cualquier tag del mismo major.minor pero menor patch
          if (!baseTag) {
            baseTag = versionTags.find((vt) => {
              const [major, minor, patch] = vt.version.split('.').map(Number)
              return major === currentMajor && minor === currentMinor && patch < currentPatch
            })?.tag || null
          }
          
          // Como último recurso, usar el último tag disponible del prefijo
          if (!baseTag) {
            baseTag = versionTags[0]?.tag || null
          }
          break
        }

        case 'minor': {
          // Para minor: incluir todos los patches del minor anterior
          // Ejemplo: 1.0.x → 1.1.0, buscar el primer tag 1.0.0 (inicio del minor actual)
          const [currentMajor, currentMinor] = currentVersion.split('.').map(Number)
          
          // Buscar el primer tag del minor actual (major.currentMinor.0)
          baseTag = versionTags.find((vt) => {
            const [major, minor, patch] = vt.version.split('.').map(Number)
            return major === currentMajor && minor === currentMinor && patch === 0
          })?.tag || null
          
          // Si no encuentra x.y.0, buscar el primer tag del minor actual (el más viejo)
          if (!baseTag) {
            const minorTags = versionTags.filter((vt) => {
              const [major, minor] = vt.version.split('.').map(Number)
              return major === currentMajor && minor === currentMinor
            })
            baseTag = minorTags[minorTags.length - 1]?.tag || null // El último en el array = el más viejo
          }
          
          // Como último recurso, usar el último tag disponible
          if (!baseTag) {
            baseTag = versionTags[versionTags.length - 1]?.tag || null // El más viejo de todos
          }
          break
        }

        case 'major': {
          // Para major: incluir todos los minors y patches del major anterior
          // Ejemplo: 1.x.x → 2.0.0, buscar el primer tag 1.0.0 (inicio del major actual)
          const [currentMajor] = currentVersion.split('.').map(Number)
          
          // Buscar el primer tag del major actual (major.0.0)
          baseTag = versionTags.find((vt) => {
            const [major, minor, patch] = vt.version.split('.').map(Number)
            return major === currentMajor && minor === 0 && patch === 0
          })?.tag || null
          
          // Si no encuentra x.0.0, buscar el primer tag del major actual (el más viejo)
          if (!baseTag) {
            const majorTags = versionTags.filter((vt) => {
              const [major] = vt.version.split('.').map(Number)
              return major === currentMajor
            })
            baseTag = majorTags[majorTags.length - 1]?.tag || null // El último en el array = el más viejo
          }
          
          // Como último recurso, usar el último tag disponible
          if (!baseTag) {
            baseTag = versionTags[versionTags.length - 1]?.tag || null // El más viejo de todos
          }
          break
        }
      }

      return baseTag
    } catch (error) {
      console.error(`[GitService] Error getting base tag:`, error)
      return null
    }
  }

  /**
   * Obtiene commits desde el último tag hasta HEAD
   */
  async getCommitsSinceLastTag(
    repoPath: string,
    tagPrefix?: string
  ): Promise<GitResult<{ commits: GitCommit[]; fromTag?: string }>> {
    try {
      const git = this.getGitInstance(repoPath)

      // Obtener el último tag (con filtro por prefijo si se especifica)
      const lastTag = await this.getLatestTag(repoPath, tagPrefix)

      if (!lastTag) {
        // Si no hay tags, obtener los últimos 20 commits
        return this.getCommits(repoPath, 20)
      }

      // Usar getCommitsBetweenTags que ya está optimizado
      const commitsBetween = await this.getCommitsBetweenTags(repoPath, lastTag)
      const relevantCommits = commitsBetween.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author,
        author_email: commit.author
      }))

      const commits = relevantCommits.map((commit) => {
        // Parsear mensaje de commit para obtener tipo y subject (estilo conventional commits)
        const message = commit.message.trim()
        const conventionalMatch = message.match(
          /^(feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?\s*:\s*(.+)/
        )

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
          refs: '',
        }
      })

      return {
        success: true,
        data: { commits, fromTag: lastTag },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo commits desde último tag: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene commits para un tipo específico de release
   */
  async getCommitsForReleaseType(
    repoPath: string,
    currentVersion: string,
    releaseType: 'major' | 'minor' | 'patch',
    tagPrefix?: string
  ): Promise<GitResult<{ commits: GitCommit[]; fromTag?: string; toTag: string }>> {
    try {
      const git = this.getGitInstance(repoPath)

      // Obtener el tag base según el tipo de release
      const baseTag = await this.getBaseTagForReleaseType(repoPath, currentVersion, releaseType, tagPrefix)

      if (!baseTag) {
        // Si no hay tag base, obtener los últimos 20 commits
          const recentCommits = await this.getCommits(repoPath, 20)
        return {
          success: recentCommits.success,
          data: {
            commits: recentCommits.data?.commits || [],
            fromTag: 'inicio',
            toTag: 'HEAD',
          },
          error: recentCommits.error,
        }
      }


      // Usar getCommitsBetweenTags que ya tiene el debugging optimizado
      const commits = await this.getCommitsBetweenTags(repoPath, baseTag)


      return {
        success: true,
        data: {
          commits,
          fromTag: baseTag,
          toTag: 'HEAD',
        },
      }
    } catch (error) {
      console.error(`[GitService] Error in getCommitsForReleaseType:`, error)
      return {
        success: false,
        error: `Error obteniendo commits para release ${releaseType}: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Extrae colaboradores únicos de una lista de commits
   */
  extractCollaborators(commits: GitCommit[]): string[] {
    const authors = new Set<string>()

    commits.forEach((commit) => {
      if (commit.author && commit.author !== 'Unknown' && commit.author.trim()) {
        // Normalizar nombres de autores (algunos pueden venir con formato "Name <email>")
        const cleanAuthor = commit.author.replace(/<[^>]*>/g, '').trim()
        if (cleanAuthor) {
          authors.add(cleanAuthor)
        }
      }
    })

    return Array.from(authors).sort()
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
          warnings.push(
            'No hay remotos configurados - los tags no se podrán pushear automáticamente'
          )
        }
      } catch (_error) {
        warnings.push('No se pudo verificar la configuración de remotos')
      }

      const isValid = errors.length === 0

      return {
        isValid,
        warnings,
        errors,
        status,
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
          isClean: false,
        },
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
