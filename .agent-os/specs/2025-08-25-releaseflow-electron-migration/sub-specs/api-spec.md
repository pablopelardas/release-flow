# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-25-releaseflow-electron-migration/spec.md

## IPC API - Comunicación Electron

### Git Operations

#### ipc:git:validate-repository
**Purpose:** Validar si una ruta es un repositorio Git válido
**Parameters:** 
- `path: string` - Ruta absoluta al directorio
**Response:** 
```typescript
{
  success: boolean,
  data?: {
    isValid: boolean,
    branch?: string,
    lastCommit?: string,
    remoteUrl?: string
  },
  error?: string
}
```
**Errors:** 
- `INVALID_PATH` - Ruta no existe
- `NOT_GIT_REPO` - No es un repositorio Git
- `ACCESS_DENIED` - Sin permisos de lectura

#### ipc:git:get-tags
**Purpose:** Obtener lista de tags del repositorio
**Parameters:**
- `repositoryPath: string` - Ruta del repositorio
- `limit?: number` - Límite de tags a retornar (default: 50)
**Response:**
```typescript
{
  success: boolean,
  data?: {
    tags: Array<{
      name: string,
      sha: string,
      date: string,
      message?: string
    }>
  },
  error?: string
}
```
**Errors:**
- `REPO_NOT_FOUND` - Repositorio no encontrado
- `GIT_ERROR` - Error ejecutando comando Git

#### ipc:git:get-commits
**Purpose:** Obtener commits entre dos referencias
**Parameters:**
- `repositoryPath: string` - Ruta del repositorio
- `fromRef?: string` - Referencia inicial (tag/branch/SHA)
- `toRef?: string` - Referencia final (default: HEAD)
**Response:**
```typescript
{
  success: boolean,
  data?: {
    commits: Array<{
      hash: string,
      shortHash: string,
      message: string,
      author: string,
      authorEmail: string,
      date: string
    }>
  },
  error?: string
}
```

#### ipc:git:create-tag
**Purpose:** Crear un nuevo tag en el repositorio
**Parameters:**
- `repositoryPath: string` - Ruta del repositorio
- `tagName: string` - Nombre del tag
- `message: string` - Mensaje del tag
- `force?: boolean` - Sobreescribir si existe
- `push?: boolean` - Push automático a remoto
**Response:**
```typescript
{
  success: boolean,
  data?: {
    tagName: string,
    sha: string,
    pushed: boolean
  },
  error?: string
}
```
**Errors:**
- `TAG_EXISTS` - Tag ya existe y force=false
- `PUSH_FAILED` - Error al hacer push

### Template Operations

#### ipc:template:list
**Purpose:** Listar todos los templates disponibles
**Parameters:** 
- `category?: string` - Filtrar por categoría
**Response:**
```typescript
{
  success: boolean,
  data?: {
    templates: Array<{
      id: number,
      name: string,
      category: string,
      description?: string,
      isDefault: boolean,
      createdAt: string,
      updatedAt: string
    }>
  },
  error?: string
}
```

#### ipc:template:get
**Purpose:** Obtener un template específico con su contenido
**Parameters:**
- `id: number` - ID del template
**Response:**
```typescript
{
  success: boolean,
  data?: {
    id: number,
    name: string,
    content: string,
    category: string,
    description?: string,
    isDefault: boolean
  },
  error?: string
}
```

#### ipc:template:save
**Purpose:** Guardar o actualizar un template
**Parameters:**
- `id?: number` - ID para actualizar, omitir para crear nuevo
- `name: string` - Nombre único del template
- `content: string` - Contenido Liquid
- `category?: string` - Categoría del template
- `description?: string` - Descripción
**Response:**
```typescript
{
  success: boolean,
  data?: {
    id: number,
    name: string
  },
  error?: string
}
```
**Errors:**
- `DUPLICATE_NAME` - Nombre ya existe
- `INVALID_TEMPLATE` - Sintaxis Liquid inválida

#### ipc:template:render
**Purpose:** Renderizar un template con datos de contexto
**Parameters:**
- `templateContent: string` - Contenido del template
- `context: object` - Datos para renderizar
**Response:**
```typescript
{
  success: boolean,
  data?: {
    rendered: string,
    html?: string // Si se solicita conversión a HTML
  },
  error?: string
}
```

### Release Operations

#### ipc:release:generate
**Purpose:** Generar un release completo
**Parameters:**
- `repositoryPath: string` - Ruta del repositorio
- `version: string` - Versión del release
- `templateId: number` - ID del template a usar
- `description?: string` - Descripción adicional
- `options: {
    createTag: boolean,
    forceTag: boolean,
    pushToRemote: boolean,
    outputPath?: string
  }`
**Response:**
```typescript
{
  success: boolean,
  data?: {
    version: string,
    content: string,
    tagSha?: string,
    outputFile?: string,
    pushed: boolean
  },
  error?: string
}
```

#### ipc:release:preview
**Purpose:** Preview de release sin crear tags
**Parameters:**
- `repositoryPath: string` - Ruta del repositorio
- `version: string` - Versión propuesta
- `templateId: number` - Template a usar
- `fromTag?: string` - Tag inicial para comparación
**Response:**
```typescript
{
  success: boolean,
  data?: {
    preview: string,
    statistics: {
      totalCommits: number,
      contributors: number,
      filesChanged: number
    }
  },
  error?: string
}
```

### Repository Management

#### ipc:repository:add
**Purpose:** Agregar nuevo repositorio a la configuración
**Parameters:**
- `name: string` - Nombre identificador
- `localPath: string` - Ruta local del repositorio
- `url?: string` - URL remota del repositorio
**Response:**
```typescript
{
  success: boolean,
  data?: {
    id: number,
    name: string,
    localPath: string
  },
  error?: string
}
```

#### ipc:repository:list
**Purpose:** Listar repositorios configurados
**Parameters:**
- `active?: boolean` - Filtrar solo activos
**Response:**
```typescript
{
  success: boolean,
  data?: {
    repositories: Array<{
      id: number,
      name: string,
      localPath: string,
      url?: string,
      isActive: boolean,
      lastSync?: string
    }>
  },
  error?: string
}
```

### Settings Operations

#### ipc:settings:get
**Purpose:** Obtener configuración de usuario
**Parameters:**
- `key?: string` - Clave específica o todas si se omite
**Response:**
```typescript
{
  success: boolean,
  data?: {
    settings: Record<string, any>
  },
  error?: string
}
```

#### ipc:settings:set
**Purpose:** Actualizar configuración de usuario
**Parameters:**
- `settings: Record<string, any>` - Pares clave-valor a actualizar
**Response:**
```typescript
{
  success: boolean,
  data?: {
    updated: string[]
  },
  error?: string
}
```

## Manejo de Errores Global

Todos los endpoints siguen el mismo formato de respuesta:

```typescript
interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp: number;
}
```

Códigos de error estándar:
- `VALIDATION_ERROR` - Parámetros inválidos
- `NOT_FOUND` - Recurso no encontrado
- `PERMISSION_DENIED` - Sin permisos
- `INTERNAL_ERROR` - Error interno del servidor
- `RATE_LIMITED` - Demasiadas solicitudes