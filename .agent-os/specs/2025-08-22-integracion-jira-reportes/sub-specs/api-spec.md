# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-22-integracion-jira-reportes/spec.md

## Endpoints

### GET /api/reports/generate

**Purpose:** Generar un reporte de release con información enriquecida de Jira
**Parameters:**
- `fromTag` (string, required): Tag inicial para el rango
- `toTag` (string, required): Tag final para el rango  
- `template` (string, optional): Nombre de la plantilla a usar (default: "technical-detailed")
- `format` (string, optional): Formato de salida (markdown|html|pdf|json|excel, default: "markdown")
- `includeJira` (boolean, optional): Incluir información de Jira (default: true)
- `includeMetrics` (boolean, optional): Incluir métricas y estadísticas (default: true)

**Response:**
```json
{
  "reportId": "rpt_20250822_123456",
  "status": "completed",
  "downloadUrl": "/api/reports/download/rpt_20250822_123456",
  "format": "pdf",
  "generatedAt": "2025-08-22T10:30:00Z",
  "metrics": {
    "totalCommits": 45,
    "ticketsResolved": 12,
    "contributors": 5
  }
}
```

**Errors:**
- 400: Tags inválidos o no encontrados
- 404: Plantilla no encontrada
- 500: Error al generar reporte

---

### GET /api/reports/download/{reportId}

**Purpose:** Descargar un reporte generado previamente
**Parameters:**
- `reportId` (string, required): ID del reporte generado

**Response:** File stream con el reporte en el formato solicitado

**Errors:**
- 404: Reporte no encontrado
- 410: Reporte expirado (más de 24 horas)

---

### POST /api/reports/preview

**Purpose:** Generar vista previa de un reporte con plantilla personalizada
**Parameters:**
```json
{
  "fromTag": "v1.0.0",
  "toTag": "v1.1.0",
  "templateContent": "# Release {{version}}\n{{#each commits}}...",
  "format": "html",
  "sampleSize": 10
}
```

**Response:**
```json
{
  "preview": "<html>...</html>",
  "warnings": ["Missing variable: epicLink"],
  "processedCommits": 10
}
```

**Errors:**
- 400: Plantilla inválida o error de sintaxis
- 422: Variables requeridas no disponibles

---

### GET /api/jira/validate

**Purpose:** Validar conexión y credenciales con Jira
**Parameters:** None (usa configuración del sistema)

**Response:**
```json
{
  "connected": true,
  "serverInfo": {
    "version": "8.20.0",
    "baseUrl": "https://company.atlassian.net"
  },
  "permissions": {
    "browseProjects": true,
    "viewIssues": true
  },
  "projectsAccessible": ["PROJ", "FEAT", "BUG"]
}
```

**Errors:**
- 401: Credenciales inválidas
- 403: Sin permisos suficientes
- 503: Jira no disponible

---

### GET /api/jira/ticket/{ticketId}

**Purpose:** Obtener información de un ticket específico de Jira
**Parameters:**
- `ticketId` (string, required): ID del ticket (ej: PROJ-123)
- `fields` (string, optional): Campos a incluir (comma-separated)

**Response:**
```json
{
  "key": "PROJ-123",
  "summary": "Implementar autenticación OAuth",
  "status": "Done",
  "assignee": "john.doe",
  "priority": "High",
  "storyPoints": 5,
  "labels": ["backend", "security"],
  "fixVersions": ["1.1.0"],
  "customFields": {
    "epicLink": "PROJ-100"
  }
}
```

**Errors:**
- 404: Ticket no encontrado
- 403: Sin permisos para ver el ticket

---

### GET /api/metrics/release

**Purpose:** Obtener métricas detalladas de un release
**Parameters:**
- `fromTag` (string, required): Tag inicial
- `toTag` (string, required): Tag final
- `groupBy` (string, optional): Agrupar por (author|type|component)

**Response:**
```json
{
  "summary": {
    "totalCommits": 45,
    "uniqueAuthors": 5,
    "daysElapsed": 14,
    "linesAdded": 2500,
    "linesDeleted": 800
  },
  "byType": {
    "feat": 15,
    "fix": 20,
    "docs": 5,
    "refactor": 3,
    "test": 2
  },
  "byAuthor": [
    {
      "name": "John Doe",
      "commits": 18,
      "linesChanged": 1200
    }
  ],
  "velocity": {
    "commitsPerDay": 3.2,
    "storyPointsCompleted": 35
  }
}
```

**Errors:**
- 400: Rango de tags inválido

---

### GET /api/templates

**Purpose:** Listar plantillas disponibles
**Parameters:**
- `type` (string, optional): Filtrar por tipo (executive|technical|qa|customer)

**Response:**
```json
{
  "templates": [
    {
      "id": "executive-summary",
      "name": "Executive Summary",
      "description": "High-level overview for management",
      "type": "executive",
      "supportedFormats": ["pdf", "html"],
      "isDefault": false
    },
    {
      "id": "technical-detailed",
      "name": "Technical Detailed Report",
      "description": "Complete technical changelog",
      "type": "technical",
      "supportedFormats": ["markdown", "html", "pdf"],
      "isDefault": true
    }
  ]
}
```

---

### POST /api/templates

**Purpose:** Crear o actualizar una plantilla personalizada
**Parameters:**
```json
{
  "id": "custom-template",
  "name": "Custom Release Notes",
  "content": "# {{version}} Release\n...",
  "type": "custom",
  "supportedFormats": ["markdown", "html"]
}
```

**Response:**
```json
{
  "id": "custom-template",
  "created": true,
  "validationResult": "valid"
}
```

**Errors:**
- 400: Sintaxis de plantilla inválida
- 409: ID de plantilla ya existe

---

## WebSocket API

### WS /api/reports/stream

**Purpose:** Streaming en tiempo real del progreso de generación de reportes
**Protocol:** WebSocket
**Messages:**

Cliente → Servidor:
```json
{
  "action": "generate",
  "params": {
    "fromTag": "v1.0.0",
    "toTag": "v1.1.0",
    "format": "pdf"
  }
}
```

Servidor → Cliente:
```json
{
  "type": "progress",
  "stage": "fetching_commits",
  "progress": 25,
  "message": "Analizando 45 commits..."
}
```

```json
{
  "type": "completed",
  "reportId": "rpt_20250822_123456",
  "downloadUrl": "/api/reports/download/rpt_20250822_123456"
}
```

**Stages:**
1. `fetching_commits` - Obteniendo commits del repositorio
2. `parsing_tickets` - Extrayendo referencias a tickets
3. `querying_jira` - Consultando información de Jira
4. `calculating_metrics` - Calculando métricas
5. `generating_report` - Generando reporte final
6. `completed` - Proceso completado