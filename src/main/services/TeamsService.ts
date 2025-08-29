export interface TeamsConfig {
  webhookUrl: string // Power Automate workflow URL
  enabled: boolean
}

export interface ReleaseNotification {
  repositoryName: string
  version: string
  tagName: string
  releaseNotes: string
  author?: string
  collaborators?: string[]
  commitCount?: number
  repositoryUrl?: string
}

export interface TeamsResult {
  success: boolean
  data?: unknown
  error?: string
  statusCode?: number
}

export class TeamsService {
  /**
   * Sends a release notification to Microsoft Teams via Power Automate workflow
   */
  async sendReleaseNotification(
    config: TeamsConfig,
    notification: ReleaseNotification
  ): Promise<TeamsResult> {
    try {
      // Validate configuration
      const validation = this.validateConfig(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Configuración inválida: ${validation.errors.join(', ')}`,
        }
      }

      // Build workflow payload (Custom format for Power Automate workflow)
      const workflowPayload = this.buildPowerAutomatePayload(notification)
      console.log(
        '📤 Enviando notificación de release a Teams workflow:',
        JSON.stringify(workflowPayload, null, 2)
      )

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReleaseFlow/1.0',
        },
        body: JSON.stringify(workflowPayload),
      })

      const responseText = await response.text()

      if (response.ok) {
        console.log('📥 Teams Response:', responseText)
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
      console.error('❌ Error enviando notificación a Teams:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Tests the connection to Microsoft Teams webhook
   */
  async testConnection(config: TeamsConfig): Promise<TeamsResult> {
    try {
      const validation = this.validateConfig(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Configuración inválida: ${validation.errors.join(', ')}`,
        }
      }

      // Send test message (with required contentType and content properties)
      const testCardContent = {
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
          {
            type: 'TextBlock',
            text: '✅ Test de Conexión - ReleaseFlow',
            weight: 'bolder',
            size: 'large',
            color: 'good',
          },
          {
            type: 'FactSet',
            facts: [
              {
                title: '📦 Sistema:',
                value: 'ReleaseFlow',
              },
              {
                title: '📊 Estado:',
                value: 'Conectado correctamente',
              },
              {
                title: '📅 Fecha:',
                value: new Date().toLocaleString('es-ES'),
              },
            ],
          },
          {
            type: 'TextBlock',
            text: 'La integración con Teams está funcionando correctamente.',
            wrap: true,
            spacing: 'medium',
          },
        ],
      }

      const testMessage = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: testCardContent,
            name: 'Test Card',
          },
        ],
        text: 'Test de conexión exitoso. La integración con Teams está funcionando correctamente.',
        summary: 'Test de conexión ReleaseFlow',
      }

      console.log('🔍 Testing Teams webhook connection...')

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReleaseFlow/1.0',
        },
        body: JSON.stringify(testMessage),
      })

      const responseText = await response.text()

      if (response.ok) {
        return {
          success: true,
          data: 'Conexión exitosa',
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
      console.error('❌ Error testing Teams connection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      }
    }
  }

  /**
   * Validates Teams configuration
   */
  validateConfig(config: TeamsConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.webhookUrl?.trim()) {
      errors.push('webhookUrl es requerido')
    } else {
      try {
        const url = new URL(config.webhookUrl)
        // Accept traditional Teams webhooks AND Power Automate/Logic App URLs
        const validHosts = [
          'outlook.com',
          'office.com',
          'logic.azure.com',
          'prod-01.brazilsouth.logic.azure.com', // Brazil South region
          'prod-01.westus.logic.azure.com', // West US region
          'prod-01.eastus.logic.azure.com', // East US region
          'prod-01.westeurope.logic.azure.com', // West Europe region
          'prod-01.centralus.logic.azure.com', // Central US region
        ]

        const isValidHost =
          validHosts.some((host) => url.hostname.includes(host)) ||
          url.hostname.includes('logic.azure.com') // Accept any Azure Logic Apps region

        if (!isValidHost) {
          errors.push('webhookUrl debe ser una URL válida de Microsoft Teams o Power Automate')
        }
      } catch {
        errors.push('webhookUrl debe ser una URL válida')
      }
    }

    if (config.enabled === undefined || config.enabled === null) {
      errors.push('enabled es requerido')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Builds a payload specifically for Power Automate workflows with Foreach attachments
   */
  private buildPowerAutomatePayload(notification: ReleaseNotification) {
    // Build the main Adaptive Card content (without release notes)
    const mainCardContent = {
      type: 'AdaptiveCard',
      version: '1.2',
      body: [
        {
          type: 'TextBlock',
          text: `🚀 Nueva Release: ${notification.version}`,
          weight: 'bolder',
          size: 'large',
          color: 'good',
        },
        {
          type: 'TextBlock',
          text: notification.repositoryName,
          weight: 'bolder',
          size: 'medium',
          spacing: 'small',
        },
        {
          type: 'FactSet',
          facts: [
            {
              title: '📦 Repositorio:',
              value: notification.repositoryName,
            },
            {
              title: '🏷️ Versión:',
              value: notification.version,
            },
            {
              title: '🔖 Tag:',
              value: notification.tagName,
            },
            {
              title: '👥 Colaboradores:',
              value:
                notification.collaborators && notification.collaborators.length > 0
                  ? notification.collaborators.join(', ')
                  : notification.author || 'ReleaseFlow',
            },
            {
              title: '📊 Commits:',
              value: notification.commitCount?.toString() || '0',
            },
            {
              title: '📅 Fecha:',
              value: new Date().toLocaleString('es-ES'),
            },
          ],
        },
      ],
      actions: [
        ...(notification.repositoryUrl
          ? [
              {
                type: 'Action.OpenUrl',
                title: '🔗 Ver Repositorio',
                url: notification.repositoryUrl,
              },
            ]
          : []),
      ],
    }

    // Build release notes as HTML formatted text for Teams
    const releaseNotesHtml = notification.releaseNotes
      ? `<h3>📋 Release Notes</h3><br>
${notification.releaseNotes
  .replace(/<h4[^>]*>([^<]+)<\/h4>/gi, '\n\n**$1**\n\n') // Convert h4 to bold with spacing BEFORE removing HTML
  .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\n\s*\n\s*\n/g, '\n\n\n') // Preserve triple line breaks
  .replace(/\n\s*\n/g, '\n\n') // Preserve double line breaks
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
  .replace(/\*(.+?)\*/g, '<em>$1</em>') // Convert *text* to italic
  .replace(/^•\s+(.+)$/gm, '• $1') // Keep bullet points as text
  .replace(/^-\s+(.+)$/gm, '• $1') // Convert - to bullet points
  .replace(/^\*\s+(.+)$/gm, '• $1') // Convert * to bullet points
  .replace(/\(#([a-f0-9]{7,})\)/gi, '(#$1)') // Keep commit hashes as text
  .replace(/\n\n\n+/g, '\n\n\n') // Normalize multiple line breaks to max 3
  .replace(/\n\n\n/g, '<br><br><br>') // Convert triple breaks to HTML first
  .replace(/\n\n/g, '<br><br>') // Convert double breaks to HTML
  .replace(/\n/g, '<br>') // Convert single breaks to HTML
}`
      : null

    // Return payload compatible with Teams webhook trigger (free version)
    // Teams webhook expects specific format, we'll include both card and text
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: mainCardContent,
          name: 'Release Card',
        },
      ],
      text: releaseNotesHtml || 'Sin notas de release adicionales',
      summary: `Nueva Release ${notification.version} de ${notification.repositoryName}`,
    }
  }
}
