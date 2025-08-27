# ReleaseFlow Desktop - Documentación de Desarrollo

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico
- **Frontend**: Vue 3 + Composition API + TypeScript
- **Backend**: Electron (Node.js) + TypeScript  
- **Base de datos**: SQLite (better-sqlite3)
- **Interfaz**: TailwindCSS + PrimeVue
- **Testing**: Vitest + Vue Test Utils
- **Empaquetado**: Electron Forge
- **Linting**: BiomeJS

### Estructura de Carpetas
```
src/
├── main/                 # Proceso principal de Electron
│   ├── main.ts          # Entry point y configuración de ventana
│   └── services/        # Servicios backend
│       ├── GitService.ts
│       ├── DatabaseService.ts
│       ├── TemplateService.ts
│       ├── ReleaseService.ts
│       ├── CodebaseHQService.ts
│       ├── JiraService.ts
│       └── TeamsService.ts
├── preload/             # Context bridge (IPC)
│   └── preload.ts
└── renderer/            # Frontend Vue.js
    ├── App.vue
    ├── components/      # Componentes reutilizables
    ├── layouts/         # Layouts principales
    ├── views/          # Páginas de la aplicación
    ├── store/          # Stores Pinia
    └── router/         # Configuración de rutas
```

## 🔧 Comandos de Desarrollo

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev          # Inicia app con hot-reload
npm run dev:simple   # Versión simplificada sin wait-on
```

### Testing
```bash
npm test            # Tests en watch mode
npm run test:unit   # Tests unitarios (una vez)
npm run test:e2e    # Tests E2E con Playwright
```

### Linting y Formateo
```bash
npm run lint        # Verificar código
npm run lint:fix    # Arreglar problemas automáticamente
npm run format      # Formatear código
npm run check       # Verificación completa
npm run check:fix   # Arreglar todo automáticamente
```

### Build y Empaquetado
```bash
npm run build        # Build del renderer
npm run build:main   # Build del main process
npm run build:all    # Build completo
npm run package      # Crear paquete sin instalador
npm run make         # Crear instaladores de Windows
```

### Comandos Específicos de Electron Forge
```bash
npm run start        # Iniciar con Forge
npx electron-forge make --targets=@electron-forge/maker-zip      # Solo ZIP
npx electron-forge make --targets=@electron-forge/maker-squirrel # Solo instalador
```

## 🧪 Testing

### Cobertura Actual
- **Total de tests**: 169+ tests pasando
- **Servicios**: 99 tests (GitService, DatabaseService, TemplateService, etc.)
- **Componentes Vue**: 70 tests (Dashboard, Releases, Templates, etc.)
- **Cobertura**: 95%+ en servicios core

### Ejecutar Tests Específicos
```bash
# Tests de servicios
npm test -- src/tests/services/

# Tests de componentes
npm test -- src/tests/components/

# Test específico
npm test -- src/tests/services/GitService.test.js
```

## 🔄 Flujo IPC (Inter-Process Communication)

### Arquitectura IPC
1. **Renderer** (Vue) → **Preload** → **Main** (Electron)
2. **Main** → **Services** → **Database/Git Operations**
3. **Results** ← **Preload** ← **Main**

### Ejemplo de Implementación

**renderer/views/Releases.vue**:
```javascript
const commits = await window.electronAPI.gitGetCommitsBetweenTags(
  repository.path, 
  fromTag, 
  toTag, 
  repository.tag_prefix
)
```

**preload/preload.ts**:
```typescript
gitGetCommitsBetweenTags: (repoPath: string, fromTag?: string, toTag?: string, tagPrefix?: string) =>
  ipcRenderer.invoke('git-get-commits-between-tags', repoPath, fromTag, toTag, tagPrefix)
```

**main/main.ts**:
```typescript
ipcMain.handle('git-get-commits-between-tags', async (event, repoPath, fromTag, toTag, tagPrefix) => {
  return await gitService.getCommitsBetweenTags(repoPath, fromTag, toTag, tagPrefix)
})
```

## 🗃️ Base de Datos

### Esquema SQLite

**repositories**:
```sql
CREATE TABLE repositories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  tag_prefix TEXT,          -- Para soporte de monorepos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**releases**:
```sql
CREATE TABLE releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER,
  tag_name TEXT NOT NULL,
  version TEXT NOT NULL,
  release_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories (id)
)
```

**templates**:
```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 🏷️ Sistema de Tags y Prefijos

### Soporte para Monorepos
El sistema soporta múltiples aplicaciones en el mismo repositorio mediante prefijos:

```javascript
// Mismo repositorio, diferentes aplicaciones
const repos = [
  { path: 'D:\\omint', tag_prefix: 'TurnosOmintWebAPIv' },
  { path: 'D:\\omint', tag_prefix: 'Bot-v' },
  { path: 'D:\\omint', tag_prefix: 'OmintDigitalAPIBotv' }
]
```

### Filtrado de Tags
```typescript
// GitService.ts
async getTagsForRepository(repoPath: string, tagPrefix?: string): Promise<GitTag[]> {
  const tags = await this.getTags(repoPath)
  
  if (tagPrefix) {
    return tags.filter(tag => tag.name.startsWith(tagPrefix))
  }
  
  return tags
}
```

## 🎨 Sistema de Templates

### Motor Liquid.js
Se utiliza Liquid.js como motor de plantillas con filtros personalizados:

```typescript
// TemplateService.ts
setupCustomFilters() {
  this.engine.registerFilter('format_date', (date: string) => {
    return new Date(date).toLocaleDateString('es-ES')
  })
  
  this.engine.registerFilter('group_by_type', (commits: any[]) => {
    return commits.reduce((groups, commit) => {
      const type = commit.type || 'other'
      groups[type] = groups[type] || []
      groups[type].push(commit)
      return groups
    }, {})
  })
}
```

### Variables Disponibles en Templates
```liquid
{
  "repository_name": "string",
  "from_tag": "string",
  "to_tag": "string", 
  "commit_count": number,
  "release_date": "ISO string",
  "commits": [
    {
      "hash": "string",
      "message": "string", 
      "author": "string",
      "date": "ISO string",
      "type": "feat|fix|docs|style|refactor|test|chore"
    }
  ]
}
```

## 🔗 Integraciones Externas

### CodebaseHQ API
```typescript
// CodebaseHQService.ts
class CodebaseHQService {
  async createDeployment(project: string, data: DeploymentData) {
    return await this.apiClient.post(`/${project}/deployments`, data)
  }
}
```

### JIRA API
```typescript
// JiraService.ts  
class JiraService {
  async updateIssueStatus(issueKey: string, status: string) {
    return await this.apiClient.post(`/issue/${issueKey}/transitions`, {
      transition: { id: status }
    })
  }
}
```

### Microsoft Teams Webhooks
```typescript
// TeamsService.ts
class TeamsService {
  async sendReleaseNotification(releaseData: ReleaseData) {
    const payload = this.buildAdaptiveCard(releaseData)
    return await this.webhook.send(payload)
  }
}
```

## 🚀 Empaquetado y Distribución

### Configuración Electron Forge
```javascript
// forge.config.js
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-squirrel', // Instalador Windows
      config: {
        name: 'ReleaseFlowDesktop',
        authors: 'Intuit Development Team'
      }
    },
    {
      name: '@electron-forge/maker-zip',       // Versión portable
      platforms: ['win32']
    }
  ]
}
```

### Archivos Generados
- **Instalador**: `out/make/squirrel.windows/x64/releaseflow-electron-X.X.X Setup.exe`
- **Portable**: `out/make/zip/win32/x64/releaseflow-electron-win32-x64-X.X.X.zip`

## 🛠️ Guía de Contribución

### Agregar un Nuevo Servicio
1. Crear archivo en `src/main/services/NuevoService.ts`
2. Implementar interfaz y métodos
3. Escribir tests en `tests/services/NuevoService.test.js`
4. Agregar handlers IPC en `main/main.ts`
5. Exponer en `preload/preload.ts`
6. Usar en componentes Vue

### Agregar una Nueva Vista
1. Crear componente en `src/renderer/views/NuevaVista.vue`
2. Agregar ruta en `src/renderer/router/index.js`
3. Escribir tests en `tests/components/NuevaVista.test.js`
4. Actualizar navegación si es necesario

### Workflow de Desarrollo
1. Crear rama: `git checkout -b feature/nueva-funcionalidad`
2. Desarrollar con TDD: escribir tests primero
3. Implementar funcionalidad
4. Ejecutar linting: `npm run check:fix`
5. Verificar tests: `npm test`
6. Commit y push
7. Crear pull request

## 📊 Métricas del Proyecto

### Estado Actual (Agosto 2025)
- **Líneas de código**: 15,000+ TypeScript/Vue
- **Tests**: 169+ pasando
- **Cobertura**: 95%+ servicios core  
- **Servicios**: 6 implementados
- **Vistas**: 7 vistas principales
- **Integraciones**: 3 servicios externos

### Roadmap Completado
- ✅ **Phase 0**: Script PowerShell base
- ✅ **Phase 1**: Migración Electron + Vue.js  
- ✅ **Phase 2**: Integración servicios externos
- ✅ **Phase 3**: Sistema changelog y reportes
- 🚧 **Phase 4**: Empaquetado y distribución (75% completado)

---

**Mantenido por**: Intuit Development Team  
**Última actualización**: Agosto 2025