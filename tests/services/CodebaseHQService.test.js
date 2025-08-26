import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CodebaseHQService } from '../../src/main/services/CodebaseHQService.ts'

// Mock fetch
global.fetch = vi.fn()

describe('CodebaseHQService', () => {
  let service

  beforeEach(() => {
    service = new CodebaseHQService()
    vi.clearAllMocks()
  })

  describe('validateConfig', () => {
    it('debe validar configuración completa correctamente', () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
        repositoryPermalink: 'test-repo',
      }

      const result = service.validateConfig(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('debe detectar campos faltantes', () => {
      const config = {
        accountName: 'test-account',
        // username missing
        apiKey: 'test-api-key',
        // projectPermalink missing
        repositoryPermalink: 'test-repo',
      }

      const result = service.validateConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('username es requerido')
      expect(result.errors).toContain('projectPermalink es requerido')
      expect(result.errors).toHaveLength(2)
    })

    it('debe detectar campos vacíos', () => {
      const config = {
        accountName: '',
        username: '  ',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
        repositoryPermalink: 'test-repo',
      }

      const result = service.validateConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('accountName es requerido')
      expect(result.errors).toContain('username es requerido')
    })
  })

  describe('validateDeployment', () => {
    it('debe validar deployment completo correctamente', () => {
      const deployment = {
        branch: 'main',
        revision: '1234567',
        environment: 'production',
        servers: ['server1.com', 'server2.com'],
        tagName: 'v1.0.0',
        releaseNotes: 'Test release',
      }

      const result = service.validateDeployment(deployment)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('debe detectar campos de deployment faltantes', () => {
      const deployment = {
        branch: 'main',
        // revision missing
        // environment missing
        servers: [],
      }

      const result = service.validateDeployment(deployment)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('revision es requerido')
      expect(result.errors).toContain('environment es requerido')
      expect(result.errors).toContain('al menos un servidor es requerido')
    })

    it('debe validar que revision tenga al menos 7 caracteres', () => {
      const deployment = {
        branch: 'main',
        revision: '123', // Too short
        environment: 'production',
        servers: ['server1.com'],
      }

      const result = service.validateDeployment(deployment)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('revision debe tener al menos 7 caracteres')
    })
  })

  describe('testConnection', () => {
    it('debe hacer request al endpoint de actividad correctamente', async () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
      }

      const mockResponse = '<?xml version="1.0" encoding="UTF-8"?><events></events>'

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(mockResponse),
      })

      const result = await service.testConnection(config)

      expect(result.success).toBe(true)
      expect(result.data).toBe(mockResponse)
      expect(result.statusCode).toBe(200)

      expect(fetch).toHaveBeenCalledWith(
        'https://api3.codebasehq.com/test-project/activity?page=1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic '),
            Accept: 'application/xml',
            'User-Agent': 'ReleaseFlow/1.0',
          }),
        })
      )
    })

    it('debe manejar errores de conexión', async () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
      }

      fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.testConnection(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error de conexión: Network error')
    })

    it('debe manejar respuestas HTTP de error', async () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
      }

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Project not found'),
      })

      const result = await service.testConnection(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('HTTP 404: Not Found')
    })
  })

  describe('getActivity', () => {
    it('debe obtener actividad con paginación', async () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
      }

      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
        <events>
          <event>
            <id>123</id>
            <title>Test activity</title>
            <type>push</type>
            <timestamp>2023-01-01T10:00:00Z</timestamp>
          </event>
        </events>`

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockXmlResponse),
      })

      const result = await service.getActivity(config, 2)

      expect(result.success).toBe(true)
      expect(result.data).toBe(mockXmlResponse)

      expect(fetch).toHaveBeenCalledWith(
        'https://api3.codebasehq.com/test-project/activity?page=2',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic '),
            Accept: 'application/xml',
          }),
        })
      )
    })
  })

  describe('createDeployment', () => {
    it('debe crear deployment con XML válido', async () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
        repositoryPermalink: 'test-repo',
      }

      const deployment = {
        branch: 'main',
        revision: '1234567890',
        environment: 'production',
        servers: ['server1.com', 'server2.com'],
        tagName: 'v1.0.0',
        releaseNotes: 'Test release notes',
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        text: () => Promise.resolve('<deployment><id>456</id></deployment>'),
      })

      const result = await service.createDeployment(config, deployment)

      expect(result.success).toBe(true)
      expect(result.statusCode).toBe(201)

      // Verify the request was made correctly
      expect(fetch).toHaveBeenCalledWith(
        'https://api3.codebasehq.com/test-project/test-repo/deployments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/xml',
            Accept: 'application/xml',
          }),
          body: expect.stringContaining('<deployment>'),
        })
      )

      // Check XML structure
      const requestBody = fetch.mock.calls[0][1].body
      expect(requestBody).toContain('<branch>main</branch>')
      expect(requestBody).toContain('<revision>1234567890</revision>')
      expect(requestBody).toContain('<environment>production</environment>')
      expect(requestBody).toContain('<servers>server1.com, server2.com</servers>')
    })

    it('debe escapar caracteres especiales en XML', async () => {
      const config = {
        accountName: 'test-account',
        username: 'test-user',
        apiKey: 'test-api-key',
        projectPermalink: 'test-project',
        repositoryPermalink: 'test-repo',
      }

      const deployment = {
        branch: 'feature/test&branch',
        revision: '1234567890',
        environment: 'test<environment>',
        servers: ['server"1".com'],
        tagName: "v1.0.0'test",
        releaseNotes: 'Notes with <special> &amp; characters',
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve('<deployment></deployment>'),
      })

      await service.createDeployment(config, deployment)

      const requestBody = fetch.mock.calls[0][1].body
      expect(requestBody).toContain('feature/test&amp;branch')
      expect(requestBody).toContain('test&lt;environment&gt;')
      expect(requestBody).toContain('server&quot;1&quot;.com')
    })

    it('debe rechazar configuración inválida', async () => {
      const invalidConfig = {
        accountName: 'test-account',
        // missing required fields
        projectPermalink: 'test-project',
      }

      const deployment = {
        branch: 'main',
        revision: '1234567890',
        environment: 'production',
        servers: ['server1.com'],
      }

      const result = await service.createDeployment(invalidConfig, deployment)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Configuración inválida')
      expect(fetch).not.toHaveBeenCalled()
    })
  })
})
