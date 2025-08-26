export interface CodebaseHQConfig {
  accountName: string
  username: string
  apiKey: string
  projectPermalink: string
  repositoryPermalink: string
}

export interface DeploymentData {
  branch: string
  revision: string
  environment: string
  servers: string[]
  tagName?: string
  releaseNotes?: string
}

export interface CodebaseHQResult {
  success: boolean
  data?: unknown
  error?: string
  statusCode?: number
}

export class CodebaseHQService {
  private baseUrl = 'https://api3.codebasehq.com'

  /**
   * Crea un deployment en CodebaseHQ
   */
  async createDeployment(
    config: CodebaseHQConfig,
    deployment: DeploymentData
  ): Promise<CodebaseHQResult> {
    try {
      // Validar configuración requerida
      const validation = this.validateConfig(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Configuración inválida: ${validation.errors.join(', ')}`,
        }
      }

      // Construir XML del deployment
      const deploymentXml = this.buildDeploymentXml(deployment)
      console.log('📤 Enviando deployment a CodebaseHQ:', deploymentXml)

      // URL del endpoint - formato correcto: /PROJECT/REPOSITORY/deployments
      const url = `${this.baseUrl}/${config.projectPermalink}/${config.repositoryPermalink}/deployments`

      // Configurar autenticación básica - formato: account/username:apiKey
      const authString = `${config.accountName}/${config.username}:${config.apiKey}`
      const auth = Buffer.from(authString).toString('base64')

      // Headers requeridos
      const headers = {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/xml',
        Accept: 'application/xml',
        'User-Agent': 'ReleaseFlow/1.0',
      }

      console.log(`🌐 POST ${url}`)
      console.log(
        `🔐 Auth: ${config.accountName}/${config.username}:${config.apiKey.substring(0, 8)}...`
      )
      console.log('📋 Headers:', headers)

      // Realizar petición HTTP
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: deploymentXml,
      })

      const responseText = await response.text()
      console.log(`📥 CodebaseHQ Response (${response.status}):`, responseText)

      if (response.ok) {
        return {
          success: true,
          data: responseText,
          statusCode: response.status,
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}. ${responseText}`,
          statusCode: response.status,
        }
      }
    } catch (error) {
      console.error('❌ Error creating deployment:', error)
      return {
        success: false,
        error: `Error de conexión: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Construye el XML requerido para el deployment
   */
  private buildDeploymentXml(deployment: DeploymentData): string {
    const servers = deployment.servers.join(', ')

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<deployment>\n'
    xml += `  <branch>${this.escapeXml(deployment.branch)}</branch>\n`
    xml += `  <revision>${this.escapeXml(deployment.revision)}</revision>\n`
    xml += `  <environment>${this.escapeXml(deployment.environment)}</environment>\n`
    xml += `  <servers>${this.escapeXml(servers)}</servers>\n`

    // Agregar información adicional si está disponible
    if (deployment.tagName) {
      xml += `  <notes>Release ${this.escapeXml(deployment.tagName)}</notes>\n`
    }

    xml += '</deployment>'

    return xml
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Valida la configuración de CodebaseHQ
   */
  validateConfig(config: CodebaseHQConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.accountName?.trim()) {
      errors.push('accountName es requerido')
    }

    if (!config.username?.trim()) {
      errors.push('username es requerido')
    }

    if (!config.apiKey?.trim()) {
      errors.push('apiKey es requerido')
    }

    if (!config.projectPermalink?.trim()) {
      errors.push('projectPermalink es requerido')
    }

    if (!config.repositoryPermalink?.trim()) {
      errors.push('repositoryPermalink es requerido')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valida los datos del deployment
   */
  validateDeployment(deployment: DeploymentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!deployment.branch?.trim()) {
      errors.push('branch es requerido')
    }

    if (!deployment.revision?.trim()) {
      errors.push('revision es requerido')
    } else if (deployment.revision.length < 7) {
      errors.push('revision debe tener al menos 7 caracteres')
    }

    if (!deployment.environment?.trim()) {
      errors.push('environment es requerido')
    }

    if (!deployment.servers?.length) {
      errors.push('al menos un servidor es requerido')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Prueba la conexión con CodebaseHQ usando el endpoint de actividad
   */
  async testConnection(config: CodebaseHQConfig): Promise<CodebaseHQResult> {
    try {
      // Solo validar campos necesarios para la conexión
      if (!config.accountName?.trim()) {
        return { success: false, error: 'accountName es requerido' }
      }
      if (!config.username?.trim()) {
        return { success: false, error: 'username es requerido' }
      }
      if (!config.apiKey?.trim()) {
        return { success: false, error: 'apiKey es requerido' }
      }
      if (!config.projectPermalink?.trim()) {
        return { success: false, error: 'projectPermalink es requerido' }
      }

      // URL del endpoint de actividad
      const url = `${this.baseUrl}/${config.projectPermalink}/activity?page=1`

      const authString = `${config.accountName}/${config.username}:${config.apiKey}`
      const auth = Buffer.from(authString).toString('base64')

      const headers = {
        Authorization: `Basic ${auth}`,
        Accept: 'application/xml',
        'User-Agent': 'ReleaseFlow/1.0',
      }

      console.log(`🔍 Testing connection: GET ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      const responseText = await response.text()

      if (response.ok) {
        return {
          success: true,
          data: responseText,
          statusCode: response.status,
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}. ${responseText}`,
          statusCode: response.status,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error de conexión: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene información del repositorio desde CodebaseHQ
   */
  async getRepositoryInfo(config: CodebaseHQConfig): Promise<CodebaseHQResult> {
    return this.testConnection(config)
  }

  /**
   * Obtiene la actividad del proyecto
   */
  async getActivity(config: CodebaseHQConfig, page = 1): Promise<CodebaseHQResult> {
    try {
      // Solo validar campos necesarios
      if (!config.accountName?.trim()) {
        return { success: false, error: 'accountName es requerido' }
      }
      if (!config.username?.trim()) {
        return { success: false, error: 'username es requerido' }
      }
      if (!config.apiKey?.trim()) {
        return { success: false, error: 'apiKey es requerido' }
      }
      if (!config.projectPermalink?.trim()) {
        return { success: false, error: 'projectPermalink es requerido' }
      }

      const url = `${this.baseUrl}/${config.projectPermalink}/activity?page=${page}`

      const authString = `${config.accountName}/${config.username}:${config.apiKey}`
      const auth = Buffer.from(authString).toString('base64')

      const headers = {
        Authorization: `Basic ${auth}`,
        Accept: 'application/xml',
        'User-Agent': 'ReleaseFlow/1.0',
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      const responseText = await response.text()

      if (response.ok) {
        return {
          success: true,
          data: responseText,
          statusCode: response.status,
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}. ${responseText}`,
          statusCode: response.status,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo actividad: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Lista deployments existentes
   */
  async getDeployments(config: CodebaseHQConfig): Promise<CodebaseHQResult> {
    try {
      const validation = this.validateConfig(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Configuración inválida: ${validation.errors.join(', ')}`,
        }
      }

      const url = `${this.baseUrl}/${config.projectPermalink}/${config.repositoryPermalink}/deployments`

      const authString = `${config.accountName}/${config.username}:${config.apiKey}`
      const auth = Buffer.from(authString).toString('base64')

      const headers = {
        Authorization: `Basic ${auth}`,
        Accept: 'application/xml',
        'User-Agent': 'ReleaseFlow/1.0',
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      const responseText = await response.text()

      if (response.ok) {
        return {
          success: true,
          data: responseText,
          statusCode: response.status,
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}. ${responseText}`,
          statusCode: response.status,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo deployments: ${(error as Error).message}`,
      }
    }
  }
}
