import Database from 'better-sqlite3'

export interface DatabaseResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface Repository {
  id: number
  name: string
  path: string
  url?: string
  branch: string
  current_branch?: string
  is_clean?: boolean
  tag_prefix?: string
  is_main_repository?: boolean
  active: boolean
  codebase_repository_permalink?: string
  codebase_environment?: string
  codebase_servers?: string
  codebase_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface Release {
  id: number
  repository_id: number
  version: string
  tag_name: string
  release_notes?: string
  commit_count: number
  created_at: string
}

export interface Template {
  id: number
  name: string
  description?: string
  content: string
  category: string
  variables: string // JSON string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Configuration {
  key: string
  value: string
  updated_at: string
}

export interface RepositoryStats {
  total_releases: number
  total_commits: number
  last_release_date?: string
  avg_commits_per_release: number
}

export interface GlobalStats {
  total_repositories: number
  total_releases: number
  total_templates: number
  avg_commits_per_release: number
}

export interface BackupResult {
  success: boolean
  pages?: number
  error?: string
}

export interface MigrationResult {
  success: boolean
  version?: number
  error?: string
}

export interface TransactionResult {
  success: boolean
  results?: unknown[]
  error?: string
}

export interface CleanupResult {
  success: boolean
  deletedRows?: number
  error?: string
}

export class DatabaseService {
  private db: Database.Database
  private dbPath: string

  constructor(dbPath: string = 'releaseflow.db') {
    this.dbPath = dbPath
    this.db = new Database(dbPath)
    this.initialize()
  }

  /**
   * Inicializa la base de datos con configuraciones y esquemas
   */
  public initialize(): void {
    // Configuraciones de SQLite
    this.db.pragma('foreign_keys = ON')
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('cache_size = 1000')
    this.db.pragma('temp_store = MEMORY')

    // No migrations needed in development - recreate DB as needed

    // Crear tablas
    this.createTables()

    // Insertar datos iniciales si es necesario
    this.seedData()
  }

  /**
   * Crea las tablas de la base de datos
   */
  private createTables(): void {
    const schema = `
      -- Tabla de repositorios
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        path TEXT NOT NULL,
        url TEXT,
        branch TEXT DEFAULT 'main',
        current_branch TEXT,
        is_clean BOOLEAN,
        tag_prefix TEXT DEFAULT '',
        is_main_repository BOOLEAN DEFAULT 0,
        active BOOLEAN DEFAULT 1,
        codebase_repository_permalink TEXT,
        codebase_environment TEXT DEFAULT 'production',
        codebase_servers TEXT,
        codebase_enabled BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de releases
      CREATE TABLE IF NOT EXISTS releases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repository_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        release_notes TEXT,
        commit_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        UNIQUE(repository_id, version)
      );

      -- Tabla de templates
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'custom',
        variables TEXT, -- JSON array de variables
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name)
      );

      -- Tabla de configuraciones
      CREATE TABLE IF NOT EXISTS configurations (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de historial de releases (para auditoría)
      CREATE TABLE IF NOT EXISTS release_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        release_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
        details TEXT, -- JSON con detalles del cambio
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
      );

      -- Tabla de relaciones entre repositorios principales y secundarios
      CREATE TABLE IF NOT EXISTS repository_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_repository_id INTEGER NOT NULL,
        secondary_repository_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        FOREIGN KEY (secondary_repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        UNIQUE(main_repository_id, secondary_repository_id)
      );

      -- Índices para mejorar performance
      CREATE INDEX IF NOT EXISTS idx_repositories_active ON repositories(active);
      CREATE INDEX IF NOT EXISTS idx_repositories_name ON repositories(name);
      CREATE INDEX IF NOT EXISTS idx_releases_repository_id ON releases(repository_id);
      CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version);
      CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases(created_at);
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
      CREATE INDEX IF NOT EXISTS idx_repo_relationships_main ON repository_relationships(main_repository_id);
      CREATE INDEX IF NOT EXISTS idx_repo_relationships_secondary ON repository_relationships(secondary_repository_id);

      -- Trigger para actualizar updated_at automáticamente
      CREATE TRIGGER IF NOT EXISTS update_repositories_updated_at 
        AFTER UPDATE ON repositories
        BEGIN
          UPDATE repositories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_templates_updated_at 
        AFTER UPDATE ON templates
        BEGIN
          UPDATE templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_configurations_updated_at 
        AFTER UPDATE ON configurations
        BEGIN
          UPDATE configurations SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
        END;
    `

    this.db.exec(schema)
  }

  /**
   * Inserta datos iniciales si la base de datos está vacía
   */
  private seedData(): void {
    // Verificar si ya hay configuraciones
    const configCount = this.db.prepare('SELECT COUNT(*) as count FROM configurations').get() as {
      count: number
    }

    if (configCount.count === 0) {
      // Insertar configuraciones por defecto
      const insertConfig = this.db.prepare('INSERT INTO configurations (key, value) VALUES (?, ?)')

      const defaultConfigs = [
        ['theme', 'light'],
        ['auto_push_tags', 'false'],
        ['default_branch', 'main'],
        ['editor_theme', 'vs-dark'],
        ['notification_enabled', 'true'],
        ['backup_enabled', 'true'],
        ['backup_frequency', 'weekly'],
        ['codebase_enabled', 'false'],
        ['codebase_account_name', 'mindware'],
        ['codebase_username', ''],
        ['codebase_api_key', ''],
        ['codebase_project_permalink', 'Clever'],
        ['codebase_default_environment', 'production'],
        ['codebase_default_servers', 'vturnoscli.omint.ad'],
        // JIRA Configuration
        ['jira_enabled', 'false'],
        ['jira_base_url', 'https://your-company.atlassian.net'],
        ['jira_username', ''],
        ['jira_api_token', ''],
        ['jira_project_key', 'PROJ'],
      ]

      const insertMany = this.db.transaction((configs: Array<[string, string]>) => {
        for (const config of configs) {
          insertConfig.run(config[0], config[1])
        }
      })

      // @ts-expect-error - Temporary fix for type mismatch
      insertMany(defaultConfigs)
    }

    // Insertar templates predefinidos si no existen
    this.seedTemplates()
  }

  /**
   * Inserta templates predefinidos si la tabla está vacía
   */
  private seedTemplates(): void {
    // Verificar si ya hay templates
    const templateCount = this.db.prepare('SELECT COUNT(*) as count FROM templates').get() as {
      count: number
    }

    console.log(`[DB] Current template count: ${templateCount.count}`)

    if (templateCount.count === 0) {
      // Insertar templates predefinidos
      const insertTemplate = this.db.prepare(
        'INSERT INTO templates (name, description, content, category) VALUES (?, ?, ?, ?)'
      )

      const predefinedTemplates = [
        {
          name: 'Release Notes Estándar',
          description: 'Template formal para release notes',
          category: 'predefined',
          content: `# Release Notes v{{ version }}

**Fecha de Lanzamiento:** {{ date | date: "%d de %B de %Y" }}
**Tipo de Release:** {{ type }}

{% assign has_feat = false %}
{% assign has_fix = false %}
{% assign has_docs = false %}
{% assign has_chore = false %}
{% assign has_other = false %}

{% for commit in commits %}
  {% if commit.type == "feat" %}{% assign has_feat = true %}{% endif %}
  {% if commit.type == "fix" %}{% assign has_fix = true %}{% endif %}
  {% if commit.type == "docs" %}{% assign has_docs = true %}{% endif %}
  {% if commit.type == "chore" %}{% assign has_chore = true %}{% endif %}
  {% unless commit.type == "feat" or commit.type == "fix" or commit.type == "docs" or commit.type == "chore" %}{% assign has_other = true %}{% endunless %}
{% endfor %}

{% if has_feat %}
## 🚀 Nuevas Características
{% for commit in commits %}{% if commit.type == "feat" %}
- {{ commit.subject }} (#{{ commit.hash | slice: 0, 7 }})
{% endif %}{% endfor %}

{% endif %}
{% if has_fix %}
## 🐛 Correcciones
{% for commit in commits %}{% if commit.type == "fix" %}
- {{ commit.subject }} (#{{ commit.hash | slice: 0, 7 }})
{% endif %}{% endfor %}

{% endif %}
{% if has_docs %}
## 📝 Documentación
{% for commit in commits %}{% if commit.type == "docs" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_chore %}
## 🔧 Mantenimiento
{% for commit in commits %}{% if commit.type == "chore" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_other %}
## 📝 Otros Cambios
{% for commit in commits %}{% unless commit.type == "feat" or commit.type == "fix" or commit.type == "docs" or commit.type == "chore" %}
- {{ commit.subject }}
{% endunless %}{% endfor %}

{% endif %}
---
*Generado automáticamente por ReleaseFlow*`,
        },
        {
          name: 'Changelog Simple',
          description: 'Template minimalista para changelogs',
          category: 'predefined',
          content: `## v{{ version }} - {{ date | date: "%Y-%m-%d" }}

{% assign has_feat = false %}
{% assign has_fix = false %}
{% assign has_refactor = false %}
{% assign has_other = false %}

{% for commit in commits %}
  {% if commit.type == "feat" %}{% assign has_feat = true %}{% endif %}
  {% if commit.type == "fix" %}{% assign has_fix = true %}{% endif %}
  {% if commit.type == "refactor" %}{% assign has_refactor = true %}{% endif %}
  {% unless commit.type == "feat" or commit.type == "fix" or commit.type == "refactor" %}{% assign has_other = true %}{% endunless %}
{% endfor %}

{% if has_feat %}
### Added
{% for commit in commits %}{% if commit.type == "feat" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_fix %}
### Fixed
{% for commit in commits %}{% if commit.type == "fix" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_refactor %}
### Changed
{% for commit in commits %}{% if commit.type == "refactor" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_other %}
### Other
{% for commit in commits %}{% unless commit.type == "feat" or commit.type == "fix" or commit.type == "refactor" %}
- {{ commit.subject }}
{% endunless %}{% endfor %}

{% endif %}`,
        },
        {
          name: 'Release Notes con Breaking Changes',
          description: 'Template para releases con cambios importantes',
          category: 'predefined',
          content: `# 🎉 Release v{{ version }}

{% assign has_breaking = false %}
{% assign has_feat = false %}
{% assign has_fix = false %}
{% assign has_maintenance = false %}
{% assign has_docs = false %}

{% for commit in commits %}
  {% if commit.breaking %}{% assign has_breaking = true %}{% endif %}
  {% if commit.type == "feat" and commit.breaking != true %}{% assign has_feat = true %}{% endif %}
  {% if commit.type == "fix" %}{% assign has_fix = true %}{% endif %}
  {% if commit.type == "chore" or commit.type == "refactor" %}{% assign has_maintenance = true %}{% endif %}
  {% if commit.type == "docs" %}{% assign has_docs = true %}{% endif %}
{% endfor %}

{% if has_breaking %}
## ⚠️ Breaking Changes
{% for commit in commits %}{% if commit.breaking %}
- **{{ commit.subject }}**: {{ commit.body | default: "Ver documentación para más detalles" }}
{% endif %}{% endfor %}

{% endif %}
{% if has_feat %}
## ✨ Features
{% for commit in commits %}{% if commit.type == "feat" and commit.breaking != true %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_fix %}
## 🐛 Bug Fixes
{% for commit in commits %}{% if commit.type == "fix" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_maintenance %}
## 🔧 Maintenance
{% for commit in commits %}{% if commit.type == "chore" or commit.type == "refactor" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
{% if has_docs %}
## 📖 Documentation
{% for commit in commits %}{% if commit.type == "docs" %}
- {{ commit.subject }}
{% endif %}{% endfor %}

{% endif %}
---

### Instalación
\`\`\`bash
npm install your-package@{{ version }}
\`\`\`

{% if has_breaking %}
### Migración
⚠️ Esta versión incluye cambios que rompen compatibilidad. 
Ver [Guía de Migración](./MIGRATION.md) para más detalles.
{% endif %}

**Fecha:** {{ date | date: "%d de %B de %Y" }}
**Autor:** {{ author | default: "Release Team" }}`,
        },
      ]

      const insertManyTemplates = this.db.transaction((templates) => {
        for (const template of templates) {
          insertTemplate.run(
            template.name,
            template.description,
            template.content,
            template.category
          )
          console.log(`[DB] Inserted template: ${template.name}`)
        }
      })

      console.log(`[DB] Seeding ${predefinedTemplates.length} predefined templates`)
      insertManyTemplates(predefinedTemplates)
      console.log(`[DB] Templates seeded successfully`)
    }
  }

  // ===== OPERACIONES DE REPOSITORIOS =====

  /**
   * Inserta un nuevo repositorio
   */
  async insertRepository(repoData: Partial<Repository>): Promise<DatabaseResult<{ id: number }>> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO repositories (
          name, path, url, branch, current_branch, is_clean, tag_prefix, is_main_repository, active,
          codebase_enabled, codebase_repository_permalink, codebase_environment, codebase_servers
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        repoData.name,
        repoData.path,
        repoData.url || null,
        repoData.branch || 'main',
        repoData.current_branch || null,
        repoData.is_clean !== undefined ? (repoData.is_clean ? 1 : 0) : null,
        repoData.tag_prefix || '',
        repoData.is_main_repository ? 1 : 0,
        repoData.active !== false ? 1 : 0,
        repoData.codebase_enabled ? 1 : 0,
        repoData.codebase_repository_permalink || null,
        repoData.codebase_environment || 'production',
        repoData.codebase_servers || null
      )

      return {
        success: true,
        data: { id: result.lastInsertRowid as number },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error insertando repositorio: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene un repositorio por ID
   */
  async getRepository(id: number): Promise<DatabaseResult<{ repository: Repository }>> {
    try {
      const stmt = this.db.prepare('SELECT * FROM repositories WHERE id = ?')
      const repository = stmt.get(id) as Repository

      if (!repository) {
        return {
          success: false,
          error: 'Repositorio no encontrado',
        }
      }

      return {
        success: true,
        data: { repository },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo repositorio: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Lista repositorios con filtros opcionales
   */
  async listRepositories(
    filters: { active?: number } = {}
  ): Promise<DatabaseResult<{ repositories: Repository[] }>> {
    try {
      const query =
        filters.active !== undefined
          ? 'SELECT * FROM repositories WHERE active = ? ORDER BY name'
          : 'SELECT * FROM repositories ORDER BY name'

      const stmt = this.db.prepare(query)
      const repositories =
        filters.active !== undefined
          ? (stmt.all(filters.active) as Repository[])
          : (stmt.all() as Repository[])

      return {
        success: true,
        data: { repositories },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error listando repositorios: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Actualiza un repositorio existente
   */
  async updateRepository(id: number, updates: Partial<Repository>): Promise<DatabaseResult> {
    try {
      console.log(`[DB] Updating repository ${id} with:`, updates)

      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ')
      const values = Object.values(updates)

      const query = `UPDATE repositories SET ${fields} WHERE id = ?`
      console.log(`[DB] Query: ${query}`)
      console.log(`[DB] Values:`, [...values, id])

      const stmt = this.db.prepare(query)
      const result = stmt.run(...values, id)

      console.log(`[DB] Update result:`, {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      })

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Repositorio no encontrado o sin cambios',
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[DB] Error updating repository:', error)
      return {
        success: false,
        error: `Error actualizando repositorio: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Elimina un repositorio
   */
  async deleteRepository(id: number): Promise<DatabaseResult> {
    try {
      const stmt = this.db.prepare('DELETE FROM repositories WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Repositorio no encontrado',
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error eliminando repositorio: ${(error as Error).message}`,
      }
    }
  }

  // ===== OPERACIONES DE RELEASES =====

  /**
   * Inserta un nuevo release
   */
  async insertRelease(releaseData: Partial<Release>): Promise<DatabaseResult<{ id: number }>> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO releases (repository_id, version, tag_name, release_notes, commit_count)
        VALUES (?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        releaseData.repository_id,
        releaseData.version,
        releaseData.tag_name,
        releaseData.release_notes || null,
        releaseData.commit_count || 0
      )

      // Insertar en historial
      const historyStmt = this.db.prepare(`
        INSERT INTO release_history (release_id, action, details)
        VALUES (?, 'created', ?)
      `)
      historyStmt.run(result.lastInsertRowid, JSON.stringify(releaseData))

      return {
        success: true,
        data: { id: result.lastInsertRowid as number },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error insertando release: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene releases por repositorio
   */
  async getReleasesByRepository(
    repositoryId: number
  ): Promise<DatabaseResult<{ releases: Release[] }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM releases 
        WHERE repository_id = ? 
        ORDER BY created_at DESC
      `)
      const releases = stmt.all(repositoryId) as Release[]

      return {
        success: true,
        data: { releases },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo releases: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene el último release de un repositorio
   */
  async getLatestRelease(repositoryId: number): Promise<DatabaseResult<{ release: Release }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM releases 
        WHERE repository_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `)
      const release = stmt.get(repositoryId) as Release

      if (!release) {
        return {
          success: false,
          error: 'No se encontraron releases para este repositorio',
        }
      }

      return {
        success: true,
        data: { release },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo último release: ${(error as Error).message}`,
      }
    }
  }

  // ===== OPERACIONES DE TEMPLATES =====

  /**
   * Guarda un template
   */
  async saveTemplate(templateData: Partial<Template>): Promise<DatabaseResult<{ id: number }>> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO templates (name, description, content, category, variables, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        templateData.name,
        templateData.description || null,
        templateData.content,
        templateData.category || 'custom',
        templateData.variables || '[]',
        templateData.created_by || null
      )

      return {
        success: true,
        data: { id: result.lastInsertRowid as number },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error guardando template: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene templates por categoría
   */
  async getTemplatesByCategory(
    category: string | null = null
  ): Promise<DatabaseResult<{ templates: Template[] }>> {
    try {
      console.log(`[DB] getTemplatesByCategory called with category: ${category}`)
      let stmt: Database.Statement
      let templates: Template[]

      if (category === null) {
        // Obtener todos los templates
        stmt = this.db.prepare('SELECT * FROM templates ORDER BY category, name')
        templates = stmt.all() as Template[]
        console.log(`[DB] Found ${templates.length} templates (all categories)`)
      } else {
        // Obtener templates por categoría específica
        stmt = this.db.prepare('SELECT * FROM templates WHERE category = ? ORDER BY name')
        templates = stmt.all(category) as Template[]
        console.log(`[DB] Found ${templates.length} templates for category '${category}'`)
      }

      console.log(
        `[DB] Templates:`,
        templates.map((t) => ({ id: t.id, name: t.name, category: t.category }))
      )

      return {
        success: true,
        data: { templates },
      }
    } catch (error) {
      console.error(`[DB] Error in getTemplatesByCategory:`, error)
      return {
        success: false,
        error: `Error obteniendo templates: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Elimina un template
   */
  async deleteTemplate(templateId: number): Promise<DatabaseResult<{ deleted: boolean }>> {
    try {
      // Verificar que el template no sea predefinido
      const checkStmt = this.db.prepare('SELECT category FROM templates WHERE id = ?')
      const template = checkStmt.get(templateId) as { category: string } | undefined

      if (!template) {
        return {
          success: false,
          error: 'Template no encontrado',
        }
      }

      if (template.category === 'predefined') {
        return {
          success: false,
          error: 'No se pueden eliminar templates predefinidos',
        }
      }

      const stmt = this.db.prepare('DELETE FROM templates WHERE id = ? AND category != ?')
      const result = stmt.run(templateId, 'predefined')

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Template no encontrado o no se puede eliminar',
        }
      }

      return {
        success: true,
        data: { deleted: true },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error eliminando template: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Actualiza un template
   */
  async updateTemplate(id: number, updates: Partial<Template>): Promise<DatabaseResult> {
    try {
      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ')
      const values = Object.values(updates)

      const stmt = this.db.prepare(`UPDATE templates SET ${fields} WHERE id = ?`)
      const result = stmt.run(...values, id)

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Template no encontrado o sin cambios',
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error actualizando template: ${(error as Error).message}`,
      }
    }
  }

  // ===== OPERACIONES DE CONFIGURACIÓN =====

  /**
   * Establece un valor de configuración
   */
  async setConfig(key: string, value: string): Promise<DatabaseResult> {
    try {
      const stmt = this.db.prepare(
        'INSERT OR REPLACE INTO configurations (key, value) VALUES (?, ?)'
      )
      stmt.run(key, value)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error estableciendo configuración: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene un valor de configuración
   */
  async getConfig(key: string): Promise<DatabaseResult<{ value: string }>> {
    try {
      const stmt = this.db.prepare('SELECT value FROM configurations WHERE key = ?')
      const result = stmt.get(key) as { value: string }

      if (!result) {
        return {
          success: false,
          error: 'Configuración no encontrada',
        }
      }

      return {
        success: true,
        data: { value: result.value },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo configuración: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene todas las configuraciones
   */
  async getAllConfigs(): Promise<DatabaseResult<{ configs: Record<string, string> }>> {
    try {
      const stmt = this.db.prepare('SELECT key, value FROM configurations')
      const results = stmt.all() as Configuration[]

      const configs: Record<string, string> = {}
      results.forEach(({ key, value }) => {
        configs[key] = value
      })

      return {
        success: true,
        data: { configs },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo configuraciones: ${(error as Error).message}`,
      }
    }
  }

  // ===== ESTADÍSTICAS =====

  /**
   * Obtiene estadísticas de un repositorio
   */
  async getRepositoryStats(
    repositoryId: number
  ): Promise<DatabaseResult<{ stats: RepositoryStats }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_releases,
          SUM(commit_count) as total_commits,
          MAX(created_at) as last_release_date,
          AVG(commit_count) as avg_commits_per_release
        FROM releases 
        WHERE repository_id = ?
      `)
      const stats = stmt.get(repositoryId) as RepositoryStats

      return {
        success: true,
        data: { stats },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo estadísticas: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene estadísticas globales
   */
  async getGlobalStats(): Promise<DatabaseResult<{ stats: GlobalStats }>> {
    try {
      const repoStmt = this.db.prepare(
        'SELECT COUNT(*) as count FROM repositories WHERE active = 1'
      )
      const releaseStmt = this.db.prepare('SELECT COUNT(*) as count FROM releases')
      const templateStmt = this.db.prepare('SELECT COUNT(*) as count FROM templates')
      const avgStmt = this.db.prepare('SELECT AVG(commit_count) as avg_commits FROM releases')

      const repoCount = repoStmt.get() as { count: number }
      const releaseCount = releaseStmt.get() as { count: number }
      const templateCount = templateStmt.get() as { count: number }
      const avgCommits = avgStmt.get() as { avg_commits: number }

      const stats: GlobalStats = {
        total_repositories: repoCount.count,
        total_releases: releaseCount.count,
        total_templates: templateCount.count,
        avg_commits_per_release: Math.round(avgCommits.avg_commits || 0),
      }

      return {
        success: true,
        data: { stats },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo estadísticas globales: ${(error as Error).message}`,
      }
    }
  }

  // ===== UTILIDADES =====

  /**
   * Crea backup de la base de datos
   */
  async backup(backupPath: string): Promise<BackupResult> {
    try {
      const backup = this.db.backup(backupPath)
      // @ts-expect-error - Temporary fix for backup types
      const pages = backup.transfer(-1, 100)
      // @ts-expect-error - Temporary fix for backup types
      backup.close()

      return {
        success: true,
        pages,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error creando backup: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Ejecuta migraciones de esquema
   */
  async migrate(): Promise<MigrationResult> {
    try {
      // Re-ejecutar createTables para añadir nuevas tablas/índices
      this.createTables()

      return {
        success: true,
        version: 1,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error en migración: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Ejecuta múltiples operaciones en transacción
   */
  async executeTransaction(operations: Array<() => unknown>): Promise<TransactionResult> {
    try {
      const transaction = this.db.transaction(() => {
        const results = []
        for (const operation of operations) {
          results.push(operation())
        }
        return results
      })

      const results = transaction()

      return {
        success: true,
        results: results,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error en transacción: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Limpia datos antiguos
   */
  async cleanup(daysToKeep = 90): Promise<CleanupResult> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM release_history 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `)
      const result = stmt.run(daysToKeep)

      return {
        success: true,
        deletedRows: result.changes,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error en limpieza: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Inserta un nuevo release con datos del frontend
   */
  async insertReleaseData(releaseData: {
    version: string
    repository: string
    repositoryPath: string
    template: string
    templateId: number
    date: string
    content: string
    releaseType: string
    baseVersion: string
  }): Promise<DatabaseResult<{ id: number }>> {
    try {
      // Primero, obtener el repository_id por el nombre
      const repoStmt = this.db.prepare('SELECT id FROM repositories WHERE name = ?')
      const repo = repoStmt.get(releaseData.repository) as { id: number } | undefined

      if (!repo) {
        return {
          success: false,
          error: `Repositorio '${releaseData.repository}' no encontrado en la base de datos`,
        }
      }

      // Insertar o reemplazar el release (en caso de que ya existe)
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO releases (repository_id, version, tag_name, release_notes, commit_count)
        VALUES (?, ?, ?, ?, ?)
      `)

      // Contar commits en el contenido (aproximación)
      const commitCount = (releaseData.content.match(/- /g) || []).length

      const result = stmt.run(
        repo.id,
        releaseData.version,
        releaseData.version, // usar version como tag_name
        releaseData.content,
        commitCount
      )

      // Determinar si fue inserción o actualización basado en si hubo cambios
      const action = result.changes === 1 && result.lastInsertRowid ? 'created' : 'updated'

      // Obtener el ID del release (puede ser nuevo o existente)
      let releaseId = result.lastInsertRowid as number
      if (!releaseId) {
        const existingRelease = this.db
          .prepare('SELECT id FROM releases WHERE repository_id = ? AND version = ?')
          .get(repo.id, releaseData.version) as { id: number } | undefined
        releaseId = existingRelease?.id || 0
      }

      // Insertar en historial
      const historyStmt = this.db.prepare(`
        INSERT INTO release_history (release_id, action, details)
        VALUES (?, ?, ?)
      `)
      historyStmt.run(releaseId, action, JSON.stringify(releaseData))

      return {
        success: true,
        data: { id: releaseId },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error insertando release: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Lista todos los releases con información del repositorio
   */
  async listAllReleases(): Promise<
    DatabaseResult<
      Array<{
        id: number
        version: string
        repository: string
        template: string
        date: string
        content: string
        created_at: string
      }>
    >
  > {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          r.id,
          r.version,
          repo.name as repository,
          r.tag_name,
          r.release_notes as content,
          r.created_at,
          'Unknown' as template
        FROM releases r
        JOIN repositories repo ON r.repository_id = repo.id
        ORDER BY r.created_at DESC
      `)

      const releases = stmt.all() as Array<{
        id: number
        version: string
        repository: string
        tag_name: string
        content: string
        created_at: string
        template: string
      }>

      return {
        success: true,
        data: releases.map((release) => ({
          id: release.id,
          version: release.version,
          repository: release.repository,
          template: release.template,
          date: release.created_at,
          content: release.content || '',
          created_at: release.created_at,
        })),
      }
    } catch (error) {
      return {
        success: false,
        error: `Error listando releases: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close(): void {
    if (this.db) {
      this.db.close()
    }
  }

  // ===== GESTIÓN DE RELACIONES ENTRE REPOSITORIOS =====

  /**
   * Agrega un repositorio secundario a un repositorio principal
   */
  async addSecondaryRepository(
    mainRepoId: number,
    secondaryRepoId: number
  ): Promise<DatabaseResult> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO repository_relationships (main_repository_id, secondary_repository_id)
        VALUES (?, ?)
      `)

      const _result = stmt.run(mainRepoId, secondaryRepoId)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error agregando repositorio secundario: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Remueve un repositorio secundario de un repositorio principal
   */
  async removeSecondaryRepository(
    mainRepoId: number,
    secondaryRepoId: number
  ): Promise<DatabaseResult> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM repository_relationships 
        WHERE main_repository_id = ? AND secondary_repository_id = ?
      `)

      const result = stmt.run(mainRepoId, secondaryRepoId)

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Relación no encontrada',
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error removiendo repositorio secundario: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene los repositorios secundarios de un repositorio principal
   */
  async getSecondaryRepositories(
    mainRepoId: number
  ): Promise<DatabaseResult<{ repositories: Repository[] }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT r.* 
        FROM repositories r
        JOIN repository_relationships rr ON r.id = rr.secondary_repository_id
        WHERE rr.main_repository_id = ? AND r.active = 1
        ORDER BY r.name
      `)

      const repositories = stmt.all(mainRepoId) as Repository[]

      return {
        success: true,
        data: { repositories },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo repositorios secundarios: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene todos los repositorios principales (que tienen is_main_repository = 1)
   */
  async getMainRepositories(): Promise<DatabaseResult<{ repositories: Repository[] }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM repositories 
        WHERE is_main_repository = 1 AND active = 1 
        ORDER BY name
      `)

      const repositories = stmt.all() as Repository[]

      return {
        success: true,
        data: { repositories },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo repositorios principales: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene todos los repositorios secundarios disponibles (que no son principales)
   */
  async getAvailableSecondaryRepositories(
    excludeMainRepoId?: number
  ): Promise<DatabaseResult<{ repositories: Repository[] }>> {
    try {
      let query = `
        SELECT * FROM repositories 
        WHERE is_main_repository = 0 AND active = 1
      `
      const params: unknown[] = []

      if (excludeMainRepoId) {
        query += ` AND id != ?`
        params.push(excludeMainRepoId)
      }

      query += ` ORDER BY name`

      const stmt = this.db.prepare(query)
      const repositories =
        params.length > 0 ? (stmt.all(...params) as Repository[]) : (stmt.all() as Repository[])

      return {
        success: true,
        data: { repositories },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo repositorios secundarios disponibles: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Actualiza múltiples relaciones de repositorio secundario
   */
  async updateSecondaryRepositories(
    mainRepoId: number,
    secondaryRepoIds: number[]
  ): Promise<DatabaseResult> {
    try {
      const transaction = this.db.transaction(() => {
        // Eliminar relaciones existentes
        const deleteStmt = this.db.prepare(
          'DELETE FROM repository_relationships WHERE main_repository_id = ?'
        )
        deleteStmt.run(mainRepoId)

        // Agregar nuevas relaciones
        const insertStmt = this.db.prepare(`
          INSERT INTO repository_relationships (main_repository_id, secondary_repository_id)
          VALUES (?, ?)
        `)

        for (const secondaryId of secondaryRepoIds) {
          insertStmt.run(mainRepoId, secondaryId)
        }
      })

      transaction()

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Error actualizando repositorios secundarios: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Obtiene información de la base de datos
   */
  getInfo(): {
    path: string
    inMemory: boolean
    readonly: boolean
    name: string
  } {
    return {
      path: this.dbPath,
      inMemory: this.db.memory,
      readonly: this.db.readonly,
      name: this.db.name,
    }
  }

  /**
   * Obtiene la estructura de la tabla repositories para debugging
   */
  getTableStructure(): Array<{
    cid: number
    name: string
    type: string
    notnull: number
    dflt_value: unknown
    pk: number
  }> {
    try {
      return this.db.prepare('PRAGMA table_info(repositories)').all() as Array<{
        cid: number
        name: string
        type: string
        notnull: number
        dflt_value: unknown
        pk: number
      }>
    } catch (error) {
      console.error('Error getting table structure:', error)
      return []
    }
  }
}
