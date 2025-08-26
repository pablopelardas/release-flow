import type { DatabaseService } from './DatabaseService.js'

export interface JiraConfig {
  baseUrl: string
  username: string
  apiToken: string
  projectKey: string
  enabled: boolean
}

export interface JiraIssue {
  id: string
  key: string
  summary: string
  description?: string
  status: {
    name: string
    category: string
  }
  issueType: {
    name: string
    iconUrl?: string
  }
  priority: {
    name: string
  }
  assignee?: {
    displayName: string
    emailAddress: string
  }
  created: string
  updated: string
  fixVersions: Array<{
    id: string
    name: string
    released: boolean
  }>
  labels: string[]
}

export interface JiraVersion {
  id: string
  name: string
  description?: string
  archived: boolean
  released: boolean
  startDate?: string
  releaseDate?: string
  projectId: number
  userStartDate?: string
  userReleaseDate?: string
}

export interface JiraResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

export interface JiraSearchResult {
  issues: JiraIssue[]
  total: number
  maxResults: number
  startAt: number
}

export interface CreateVersionRequest {
  name: string
  description?: string
  projectId?: number
  projectKey?: string
  startDate?: string
  releaseDate?: string
  released?: boolean
}

export interface ADFNode {
  type: string
  attrs?: Record<string, unknown>
  content?: ADFNode[]
  text?: string
  marks?: Array<{ type: string }>
}

export interface ADFDocument {
  type: 'doc'
  version: number
  content: ADFNode[]
}

export interface CommentResult {
  total: number
  successes: number
  results: Array<{
    issueKey: string
    success: boolean
    error?: string
  }>
}

export interface FixVersionResult {
  total: number
  successes: number
  failures: number
  results: Array<{
    issueKey: string
    success: boolean
    error?: string
  }>
}

export class JiraService {
  private config: JiraConfig | null = null
  private dbService: DatabaseService

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
  }

  /**
   * Inicializa la configuración de JIRA desde la base de datos
   */
  async initialize(): Promise<JiraResult> {
    try {
      const configs = await this.dbService.getAllConfigs()
      if (!configs.success || !configs.data) {
        return {
          success: false,
          error: 'No se pudo obtener la configuración de la base de datos',
        }
      }

      const { configs: configData } = configs.data

      this.config = {
        baseUrl: configData.jira_base_url || '',
        username: configData.jira_username || '',
        apiToken: configData.jira_api_token || '',
        projectKey: configData.jira_project_key || '',
        enabled: configData.jira_enabled === 'true',
      }

      // Validar configuración mínima
      if (
        this.config.enabled &&
        (!this.config.baseUrl ||
          !this.config.username ||
          !this.config.apiToken ||
          !this.config.projectKey)
      ) {
        console.warn('🔧 JIRA está habilitado pero faltan configuraciones requeridas')
        return {
          success: false,
          error:
            'Configuración de JIRA incompleta. Verifica baseUrl, username, apiToken y projectKey.',
        }
      }

      console.log('🔧 JIRA Service initialized:', {
        enabled: this.config.enabled,
        baseUrl: this.config.baseUrl,
        username: this.config.username,
        projectKey: this.config.projectKey,
        hasApiToken: !!this.config.apiToken,
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing JIRA service:', error)
      return {
        success: false,
        error: `Error inicializando JIRA: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Verifica si JIRA está habilitado y configurado
   */
  isEnabled(): boolean {
    return this.config?.enabled === true
  }

  /**
   * Obtiene la configuración actual de JIRA
   */
  getConfig(): JiraConfig | null {
    return this.config
  }

  /**
   * Crea los headers de autenticación para las requests a JIRA
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.config) {
      throw new Error('JIRA no está configurado')
    }

    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')

    return {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'ReleaseFlow/1.0',
    }
  }

  /**
   * Realiza una request HTTP a la API de JIRA
   */
  private async makeRequest(
    endpoint: string,
    options: {
      method?: string
      body?: unknown
      params?: Record<string, string>
    } = {}
  ): Promise<JiraResult> {
    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado o configurado',
      }
    }

    try {
      const url = new URL(endpoint, this.config.baseUrl)

      // Agregar parámetros de query si existen
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })
      }

      console.log(`🌐 JIRA ${options.method || 'GET'} ${url.toString()}`)
      console.log('🔐 Auth:', this.config.username)

      const headers = this.getAuthHeaders()
      console.log(
        '📋 Headers:',
        Object.keys(headers).reduce(
          (acc, key) => {
            acc[key] = key === 'Authorization' ? 'Basic ***' : headers[key]
            return acc
          },
          {} as Record<string, string>
        )
      )

      const requestOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
      }

      if (options.body) {
        requestOptions.body = JSON.stringify(options.body)
        console.log('📤 Body:', JSON.stringify(options.body, null, 2))
      }

      const response = await fetch(url.toString(), requestOptions)
      const responseText = await response.text()

      console.log(`📥 JIRA Response (${response.status}):`, responseText.substring(0, 500))

      if (!response.ok) {
        let errorMessage = `JIRA API Error ${response.status}: ${response.statusText}`

        // Try to parse JIRA-specific error messages
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText)

            // Check for specific JIRA error formats
            if (errorData.errors && typeof errorData.errors === 'object') {
              // Format: {"errorMessages":[],"errors":{"name":"Ya existe una versión con este nombre en este proyecto."}}
              const errorFields = Object.values(errorData.errors)
              if (errorFields.length > 0) {
                errorMessage = errorFields[0] as string
              }
            } else if (
              errorData.errorMessages &&
              Array.isArray(errorData.errorMessages) &&
              errorData.errorMessages.length > 0
            ) {
              // Format: {"errorMessages":["Error message"]}
              errorMessage = errorData.errorMessages[0]
            } else if (errorData.message) {
              // Format: {"message":"Error message"}
              errorMessage = errorData.message
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, keep the original HTTP error message
          console.warn('Could not parse JIRA error response:', parseError)
        }

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
          data: responseText,
        }
      }

      let data: unknown
      try {
        data = responseText ? JSON.parse(responseText) : null
      } catch {
        data = responseText
      }

      return {
        success: true,
        data,
        statusCode: response.status,
      }
    } catch (error) {
      console.error('❌ JIRA API Error:', error)
      return {
        success: false,
        error: `Error en request a JIRA: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Prueba la conexión con JIRA
   */
  async testConnection(): Promise<JiraResult> {
    console.log('🔍 Testing JIRA connection...')

    // Reinicializar configuración desde la base de datos
    await this.initialize()

    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado o configurado',
      }
    }

    try {
      // Probar con un endpoint simple que requiere autenticación
      const result = await this.makeRequest('/rest/api/3/myself')

      if (result.success) {
        console.log('✅ JIRA connection successful')
        return {
          success: true,
          data: {
            message: 'Conexión exitosa con JIRA',
            user: result.data,
          },
        }
      } else {
        console.log('❌ JIRA connection failed:', result.error)
        return result
      }
    } catch (error) {
      console.error('❌ JIRA connection test failed:', error)
      return {
        success: false,
        error: `Error probando conexión: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Busca issues en JIRA que coincidan con los patrones de commit
   * Detecta patrones como: PROJ-123, #123, refs PROJ-456
   */
  async findIssuesFromCommits(
    commits: Array<{ subject: string; body?: string; hash: string }>
  ): Promise<JiraResult<JiraIssue[]>> {
    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado',
      }
    }

    try {
      console.log('🔍 Analyzing commits for JIRA issues...')
      console.log(`🔧 JIRA config - Project Key: ${this.config.projectKey}`)
      console.log(`🔧 Number of commits to analyze: ${commits.length}`)

      // Extraer referencias de JIRA de los commits
      const issueKeys = new Set<string>()

      // Patrones para detectar referencias a JIRA
      const patterns = [
        // PROJ-123 (formato estándar de JIRA)
        new RegExp(`${this.config.projectKey}-\\d+`, 'gi'),
        // #123 (solo números, asumiendo que son del proyecto actual)
        /#(\d+)/g,
      ]

      console.log(
        '🔧 Patterns generated:',
        patterns.map((p) => p.source)
      )

      commits.forEach((commit) => {
        const text = `${commit.subject} ${commit.body || ''}`
        console.log(`🔍 Analyzing commit: ${text}`)

        patterns.forEach((pattern, index) => {
          console.log(`🔍 Testing pattern ${index}: ${pattern.source}`)
          const matches = text.match(pattern)
          if (matches) {
            console.log(`✅ Found matches:`, matches)
            matches.forEach((match) => {
              if (match.startsWith('#')) {
                // Convertir #123 a PROJ-123
                const number = match.substring(1)
                const issueKey = `${this.config?.projectKey}-${number}`
                console.log(`🔗 Converting ${match} to ${issueKey}`)
                issueKeys.add(issueKey)
              } else {
                // Ya es formato PROJ-123
                const upperMatch = match.toUpperCase()
                console.log(`🔗 Adding issue key: ${upperMatch}`)
                issueKeys.add(upperMatch)
              }
            })
          } else {
            console.log(`❌ No matches for pattern ${index}`)
          }
        })
      })

      console.log('🎯 Found potential JIRA issues:', Array.from(issueKeys))

      if (issueKeys.size === 0) {
        return {
          success: true,
          data: [],
        }
      }

      // Buscar los issues en JIRA
      const jqlQuery = `key IN (${Array.from(issueKeys).join(', ')})`
      const searchResult = await this.searchIssues(jqlQuery)

      if (searchResult.success) {
        console.log(`✅ Found ${searchResult.data?.issues.length || 0} valid JIRA issues`)
        return {
          success: true,
          data: searchResult.data?.issues || [],
        }
      } else {
        return {
          success: false,
          error: searchResult.error || 'Unknown error',
        }
      }
    } catch (error) {
      console.error('❌ Error finding JIRA issues from commits:', error)
      return {
        success: false,
        error: `Error buscando issues: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Busca issues en JIRA usando JQL
   */
  async searchIssues(jql: string, maxResults = 50): Promise<JiraResult<JiraSearchResult>> {
    console.log('🔍 Searching JIRA issues with JQL:', jql)

    const result = await this.makeRequest('/rest/api/3/search', {
      method: 'POST',
      body: {
        jql,
        maxResults,
        startAt: 0,
        fields: [
          'summary',
          'description',
          'status',
          'issuetype',
          'priority',
          'assignee',
          'created',
          'updated',
          'fixVersions',
          'labels',
        ],
      },
    })

    if (result.success) {
      const searchData = result.data as {
        issues: unknown[]
        total: number
        maxResults: number
        startAt: number
      }

      const issues: JiraIssue[] = (searchData.issues as unknown[]).map(
        (issue: unknown): JiraIssue => {
          const issueObj = issue as Record<string, unknown>
          const fields = issueObj.fields as Record<string, unknown>
          const status = fields.status as Record<string, unknown>
          const statusCategory = status.statusCategory as Record<string, unknown>

          return {
            id: issueObj.id as string,
            key: issueObj.key as string,
            summary: fields.summary as string,
            description: fields.description as string,
            status: {
              name: status.name as string,
              category: statusCategory.name as string,
            },
            issueType: {
              name: (fields.issuetype as Record<string, unknown>).name as string,
              iconUrl: (fields.issuetype as Record<string, unknown>).iconUrl as string,
            },
            priority: {
              name: ((fields.priority as Record<string, unknown>)?.name as string) || 'None',
            },
            assignee: fields.assignee
              ? {
                  displayName: (fields.assignee as Record<string, unknown>).displayName as string,
                  emailAddress: (fields.assignee as Record<string, unknown>).emailAddress as string,
                }
              : undefined,
            created: fields.created as string,
            updated: fields.updated as string,
            fixVersions:
              (fields.fixVersions as Array<{ id: string; name: string; released: boolean }>) || [],
            labels: (fields.labels as string[]) || [],
          }
        }
      )

      return {
        success: true,
        data: {
          issues,
          total: searchData.total,
          maxResults: searchData.maxResults,
          startAt: searchData.startAt,
        },
      }
    }

    return {
      success: false,
      error: result.error || 'Unknown error',
    }
  }

  /**
   * Crea una nueva versión/release en JIRA
   */
  async createVersion(versionData: CreateVersionRequest): Promise<JiraResult<JiraVersion>> {
    console.log('📝 Creating JIRA version:', versionData)

    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado',
      }
    }

    try {
      // Obtener el ID del proyecto si no se proporciona
      let projectId: string = versionData.projectId?.toString() || ''
      if (!projectId) {
        const projectResult = await this.getProject(this.config.projectKey || '')
        if (!projectResult.success) {
          return {
            success: false,
            error: `No se pudo obtener el proyecto ${this.config.projectKey}: ${projectResult.error}`,
          }
        }
        projectId = (projectResult.data as { id: string }).id
      }

      const requestBody = {
        name: versionData.name,
        description:
          versionData.description || `Release ${versionData.name} created by ReleaseFlow`,
        projectId: Number.parseInt(projectId?.toString(), 10),
        startDate: versionData.startDate,
        releaseDate: versionData.releaseDate,
        released: versionData.released || false,
      }

      const result = await this.makeRequest('/rest/api/3/version', {
        method: 'POST',
        body: requestBody,
      })

      if (result.success) {
        const versionResponse = result.data as JiraVersion
        console.log('✅ JIRA version created successfully:', versionResponse.id)

        return {
          success: true,
          data: versionResponse,
        }
      }

      return {
        success: false,
        error: result.error || 'Unknown error',
      }
    } catch (error) {
      console.error('❌ Error creating JIRA version:', error)
      return {
        success: false,
        error: `Error creando versión: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene información del proyecto
   */
  async getProject(projectKey: string): Promise<JiraResult> {
    console.log('🔍 Getting JIRA project:', projectKey)

    return this.makeRequest(`/rest/api/3/project/${projectKey}`)
  }

  /**
   * Lista las versiones de un proyecto
   */
  async getProjectVersions(projectKey?: string): Promise<JiraResult<JiraVersion[]>> {
    const project = projectKey || this.config?.projectKey
    if (!project) {
      return {
        success: false,
        error: 'No se especificó clave de proyecto',
      }
    }

    console.log('📋 Getting JIRA project versions for:', project)

    const result = await this.makeRequest(`/rest/api/3/project/${project}/versions`)

    if (result.success) {
      return {
        success: true,
        data: result.data as JiraVersion[],
      }
    }

    return {
      success: false,
      error: result.error || 'Unknown error',
    }
  }

  /**
   * Asocia issues a una versión específica
   */
  async addIssuesFixVersion(
    issueKeys: string[],
    versionId: string
  ): Promise<JiraResult<FixVersionResult>> {
    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado',
      }
    }

    console.log('🔗 Adding fix version to issues:', { issueKeys, versionId })

    try {
      const results = []

      for (const issueKey of issueKeys) {
        const result = await this.makeRequest(`/rest/api/3/issue/${issueKey}`, {
          method: 'PUT',
          body: {
            fields: {
              fixVersions: [{ id: versionId }],
            },
          },
        })

        results.push({ issueKey, ...result })
      }

      const failures = results.filter((r) => !r.success)
      if (failures.length > 0) {
        console.warn('⚠️ Some issues failed to update:', failures)
      }

      const successes = results.filter((r) => r.success)
      console.log(`✅ Successfully updated ${successes.length}/${issueKeys.length} issues`)

      return {
        success: true,
        data: {
          total: issueKeys.length,
          successes: successes.length,
          failures: failures.length,
          results,
        } as FixVersionResult,
      }
    } catch (error) {
      console.error('❌ Error adding fix versions:', error)
      return {
        success: false,
        error: `Error asociando issues: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Convierte markdown a formato ADF (Atlassian Document Format)
   */
  private convertMarkdownToADF(markdown: string): ADFDocument {
    const content: ADFNode[] = []
    const lines = markdown.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (!line.trim()) {
        // Línea vacía - agregar párrafo vacío
        if (content.length > 0 && content[content.length - 1].type !== 'paragraph') {
          content.push({
            type: 'paragraph',
            content: [],
          })
        }
        continue
      }

      if (line.startsWith('# ')) {
        // Encabezado H1
        content.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [
            {
              type: 'text',
              text: line.substring(2),
            },
          ],
        })
      } else if (line.startsWith('## ')) {
        // Encabezado H2
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [
            {
              type: 'text',
              text: line.substring(3),
            },
          ],
        })
      } else if (line.startsWith('### ')) {
        // Encabezado H3
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [
            {
              type: 'text',
              text: line.substring(4),
            },
          ],
        })
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Lista con viñetas
        const listItems = []
        let j = i

        // Recoger todos los elementos de la lista consecutivos
        while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) {
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: lines[j].substring(2),
                  },
                ],
              },
            ],
          })
          j++
        }

        content.push({
          type: 'bulletList',
          content: listItems,
        })

        i = j - 1 // Ajustar el índice
      } else if (/^\d+\. /.test(line)) {
        // Lista numerada
        const listItems = []
        let j = i

        // Recoger todos los elementos de la lista numerada consecutivos
        while (j < lines.length && /^\d+\. /.test(lines[j])) {
          const itemText = lines[j].replace(/^\d+\. /, '')
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: itemText,
                  },
                ],
              },
            ],
          })
          j++
        }

        content.push({
          type: 'orderedList',
          content: listItems,
        })

        i = j - 1 // Ajustar el índice
      } else if (line.startsWith('---')) {
        // Línea horizontal
        content.push({
          type: 'rule',
        })
      } else {
        // Párrafo normal con texto formateado
        const paragraphContent = this.parseInlineFormatting(line)
        content.push({
          type: 'paragraph',
          content: paragraphContent,
        })
      }
    }

    return {
      type: 'doc',
      version: 1,
      content,
    }
  }

  /**
   * Parsea formato inline como **bold**, *italic*, `code`, etc.
   */
  private parseInlineFormatting(text: string): ADFNode[] {
    const content: ADFNode[] = []
    let processedText = text

    // Aplicar transformaciones de formato en orden específico para evitar conflicts
    // Primero procesamos **bold** antes de *italic* para evitar overlaps

    // 1. Procesar **bold**
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, (_match, boldText) => {
      content.push({
        type: 'text',
        text: boldText,
        marks: [{ type: 'strong' }],
      })
      return `__BOLD_${content.length - 1}__` // placeholder temporal
    })

    // 2. Procesar *italic* (solo si no está dentro de bold)
    processedText = processedText.replace(/\*([^*]+?)\*/g, (_match, italicText) => {
      content.push({
        type: 'text',
        text: italicText,
        marks: [{ type: 'em' }],
      })
      return `__ITALIC_${content.length - 1}__` // placeholder temporal
    })

    // 3. Procesar `code`
    processedText = processedText.replace(/`(.*?)`/g, (_match, codeText) => {
      content.push({
        type: 'text',
        text: codeText,
        marks: [{ type: 'code' }],
      })
      return `__CODE_${content.length - 1}__` // placeholder temporal
    })

    // 4. Procesar emojis
    processedText = processedText.replace(/🚀|📋|✅|⚠️|❌|💬|🔗|🎯/g, (match) => {
      content.push({
        type: 'text',
        text: match,
      })
      return `__EMOJI_${content.length - 1}__` // placeholder temporal
    })

    // Ahora procesar el texto restante y reconstruir en orden
    const finalContent: ADFNode[] = []
    const parts = processedText.split(/(__[A-Z_]+_\d+__)/g)

    for (const part of parts) {
      if (part.startsWith('__') && part.endsWith('__')) {
        // Es un placeholder, obtener el contenido formateado correspondiente
        const index = Number.parseInt(part.match(/_(\d+)__$/)?.[1] || '0', 10)
        if (content[index]) {
          finalContent.push(content[index])
        }
      } else if (part.trim()) {
        // Es texto normal
        finalContent.push({
          type: 'text',
          text: part,
        })
      }
    }

    // Si no hay contenido, devolver texto original
    if (finalContent.length === 0) {
      finalContent.push({
        type: 'text',
        text: text,
      })
    }

    return finalContent
  }

  /**
   * Agrega comentario a múltiples issues
   */
  async addCommentToIssues(
    issueKeys: string[],
    comment: string
  ): Promise<JiraResult<CommentResult>> {
    console.log(`💬 Adding comment to ${issueKeys.length} issues`)

    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado',
      }
    }

    try {
      const results = []

      // Convertir markdown a ADF
      const adfContent = this.convertMarkdownToADF(comment)
      console.log('🎨 Converted markdown to ADF:', JSON.stringify(adfContent, null, 2))

      for (const issueKey of issueKeys) {
        console.log(`💬 Adding comment to issue: ${issueKey}`)

        const result = await this.makeRequest(`/rest/api/3/issue/${issueKey}/comment`, {
          method: 'POST',
          body: {
            body: adfContent,
          },
        })

        results.push({
          issueKey,
          success: result.success,
          error: result.error,
        })

        if (result.success) {
          console.log(`✅ Comment added to ${issueKey}`)
        } else {
          console.warn(`⚠️ Failed to add comment to ${issueKey}:`, result.error)
        }
      }

      const successes = results.filter((r) => r.success)
      console.log(`✅ Added comments to ${successes.length}/${issueKeys.length} issues`)

      return {
        success: true,
        data: {
          total: issueKeys.length,
          successes: successes.length,
          results,
        } as CommentResult,
      }
    } catch (error) {
      console.error('❌ Error adding comments:', error)
      return {
        success: false,
        error: `Error agregando comentarios: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Proceso completo: crear release con issues asociados
   */
  async createReleaseWithIssues(
    versionName: string,
    commits: Array<{ subject: string; body?: string; hash: string }>,
    releaseNotes?: string,
    releaseDate?: string
  ): Promise<
    JiraResult<{
      version: JiraVersion
      issues: JiraIssue[]
      associatedIssues: number
    }>
  > {
    if (!this.config || !this.config.enabled) {
      return {
        success: false,
        error: 'JIRA no está habilitado',
      }
    }

    console.log('🚀 Creating complete JIRA release:', versionName)

    try {
      // 1. Encontrar issues relacionados en los commits
      const issuesResult = await this.findIssuesFromCommits(commits)
      if (!issuesResult.success) {
        return {
          success: false,
          error: issuesResult.error || 'Failed to find issues',
        }
      }

      const issues = issuesResult.data || []
      console.log(`📋 Found ${issues.length} related issues`)

      // 2. Crear la versión en JIRA
      console.log('📝 Creating JIRA version with data:', {
        name: versionName,
        description: releaseNotes || `Release ${versionName} - Generated by ReleaseFlow`,
        releaseDate,
        released: false,
        releaseNotesLength: releaseNotes ? releaseNotes.length : 0,
      })

      const versionResult = await this.createVersion({
        name: versionName,
        description: `Release generated automatically by ReleaseFlow`,
        releaseDate,
        released: false,
      })

      if (!versionResult.success) {
        return {
          success: false,
          error: versionResult.error || 'Failed to create version',
        }
      }

      const version = versionResult.data
      if (!version) {
        return {
          success: false,
          error: 'Failed to create version: version data is null',
        }
      }

      // 3. Asociar issues a la versión (si hay issues)
      let associatedCount = 0
      if (issues.length > 0) {
        const issueKeys = issues.map((issue) => issue.key)
        const associationResult = await this.addIssuesFixVersion(issueKeys, version.id)

        if (associationResult.success) {
          associatedCount = (associationResult.data as FixVersionResult)?.successes || 0

          // 4. Agregar release notes como comentarios a los issues (si hay release notes)
          if (releaseNotes?.trim()) {
            console.log('💬 Adding release notes as comments to issues...')
            const releaseNotesComment = releaseNotes

            const commentResult = await this.addCommentToIssues(issueKeys, releaseNotesComment)
            if (commentResult.success) {
              console.log(
                `✅ Added release notes comments to ${commentResult.data.successes} issues`
              )
            } else {
              console.warn('⚠️ Failed to add release notes comments, but release was created')
            }
          }
        } else {
          console.warn('⚠️ Failed to associate some issues, but version was created')
        }
      }

      console.log('✅ JIRA release created successfully:', {
        version: version.name,
        issuesFound: issues.length,
        issuesAssociated: associatedCount,
      })

      return {
        success: true,
        data: {
          version,
          issues,
          associatedIssues: associatedCount,
        },
      }
    } catch (error) {
      console.error('❌ Error creating JIRA release:', error)
      return {
        success: false,
        error: `Error creando release completo: ${(error as Error).message}`,
      }
    }
  }
}
