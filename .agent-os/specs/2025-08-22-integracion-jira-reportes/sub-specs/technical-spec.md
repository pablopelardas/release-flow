# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-22-integracion-jira-reportes/spec.md

## Technical Requirements

### 1. Cliente API de Jira

- **Autenticación**: Soporte para API Token y OAuth 2.0
- **Endpoints requeridos**:
  - GET /rest/api/3/issue/{issueIdOrKey} - Obtener detalles del ticket
  - GET /rest/api/3/search - Búsqueda JQL para tickets múltiples
  - GET /rest/api/3/project/{projectIdOrKey} - Información del proyecto
- **Rate Limiting**: Implementar retry con backoff exponencial
- **Caching**: Cache local de tickets con TTL de 1 hora
- **Manejo de errores**: Graceful degradation si Jira no está disponible

### 2. Parser de Referencias de Tickets

- **Patrones soportados**:
  - Jira clásico: `PROJ-123`, `ABC-4567`
  - GitHub: `#123`, `GH-456`
  - Azure DevOps: `AB#789`
  - Genérico configurable via regex
- **Extracción desde**:
  - Mensaje de commit principal
  - Cuerpo del commit (descripción extendida)
  - Branch names (feature/PROJ-123-description)
- **Deduplicación**: Evitar referencias duplicadas en mismo commit

### 3. Motor de Análisis y Métricas

- **Métricas de commits**:
  - Clasificación por tipo (feat, fix, docs, refactor, test, chore)
  - Análisis de conventional commits
  - Estadísticas por autor (commits, líneas)
- **Métricas de tiempo**:
  - Lead time (ticket creado → producción)
  - Cycle time (desarrollo → producción)
  - Tiempo entre releases
- **Métricas de código**:
  - Integración con `git diff --stat`
  - Archivos modificados por tipo
  - Churn rate (archivos frecuentemente modificados)

### 4. Sistema de Plantillas

- **Motor de plantillas**: Razor/Liquid/Handlebars para .NET
- **Contexto de datos**:
  ```csharp
  public class ReleaseReportContext
  {
      public ReleaseInfo Release { get; set; }
      public List<CommitWithJira> Commits { get; set; }
      public ReleaseMetrics Metrics { get; set; }
      public Dictionary<string, object> CustomData { get; set; }
  }
  ```
- **Plantillas predefinidas**:
  - executive-summary.template
  - technical-detailed.template
  - qa-testing.template
  - customer-release-notes.template
- **Personalización**: YAML/JSON para configurar secciones

### 5. Exportadores de Formato

- **Markdown**: CommonMark compliant con extensiones de tablas
- **HTML**: 
  - Generación con plantillas Razor
  - Inclusión de Chart.js para gráficos
  - CSS embebido o externo configurable
- **PDF**:
  - Librería: iTextSharp o Puppeteer
  - Soporte para headers/footers personalizados
  - Numeración de páginas y TOC automático
- **Excel**:
  - Librería: ClosedXML o EPPlus
  - Múltiples hojas (Summary, Details, Metrics)
  - Gráficos nativos de Excel
- **JSON**: 
  - Schema versionado
  - Opciones de pretty-print
  - Filtrado de campos sensibles

### 6. Configuración y Extensibilidad

- **Archivo de configuración**:
  ```json
  {
    "jira": {
      "baseUrl": "https://company.atlassian.net",
      "authentication": "token",
      "projectKeys": ["PROJ", "FEAT"],
      "customFields": ["storyPoints", "epicLink"]
    },
    "ticketPatterns": [
      { "name": "jira", "pattern": "([A-Z]{2,}-\\d+)" },
      { "name": "github", "pattern": "#(\\d+)" }
    ],
    "templates": {
      "defaultTemplate": "technical-detailed",
      "customTemplatesPath": "./templates"
    },
    "export": {
      "formats": ["markdown", "html", "pdf"],
      "outputPath": "./reports"
    }
  }
  ```

### 7. Performance y Escalabilidad

- **Procesamiento paralelo**: Para análisis de commits grandes
- **Paginación**: Para APIs de Jira con muchos resultados
- **Streaming**: Para exportación de reportes grandes
- **Límites configurables**: Máximo de commits/tickets a procesar

## External Dependencies

- **Atlassian.SDK** (v3.0+) - Cliente oficial de Jira para .NET
- **Handlebars.Net** (v2.0+) - Motor de plantillas flexible
- **iTextSharp** (v5.5+) - Generación de PDF
- **ClosedXML** (v0.95+) - Manipulación de Excel sin Office
- **Markdig** (v0.30+) - Procesador Markdown extensible
- **Justification**: Estas librerías son estándares de la industria, bien mantenidas y optimizadas para sus respectivas tareas