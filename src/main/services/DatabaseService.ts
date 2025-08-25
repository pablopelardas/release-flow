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
  active: boolean
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
  private initialize(): void {
    // Configuraciones de SQLite
    this.db.pragma('foreign_keys = ON')
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('cache_size = 1000')
    this.db.pragma('temp_store = MEMORY')

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
        active BOOLEAN DEFAULT 1,
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

      -- Índices para mejorar performance
      CREATE INDEX IF NOT EXISTS idx_repositories_active ON repositories(active);
      CREATE INDEX IF NOT EXISTS idx_repositories_name ON repositories(name);
      CREATE INDEX IF NOT EXISTS idx_releases_repository_id ON releases(repository_id);
      CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version);
      CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases(created_at);
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);

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
      ]

      const insertMany = this.db.transaction((configs: Array<[string, string]>) => {
        for (const config of configs) {
          insertConfig.run(config[0], config[1])
        }
      })

      insertMany(defaultConfigs)
    }
  }

  // ===== OPERACIONES DE REPOSITORIOS =====

  /**
   * Inserta un nuevo repositorio
   */
  async insertRepository(repoData: Partial<Repository>): Promise<DatabaseResult<{ id: number }>> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO repositories (name, path, url, branch, active)
        VALUES (?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        repoData.name,
        repoData.path,
        repoData.url || null,
        repoData.branch || 'main',
        repoData.active !== false ? 1 : 0
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
    activeOnly = false
  ): Promise<DatabaseResult<{ repositories: Repository[] }>> {
    try {
      const query = activeOnly
        ? 'SELECT * FROM repositories WHERE active = 1 ORDER BY name'
        : 'SELECT * FROM repositories ORDER BY name'

      const stmt = this.db.prepare(query)
      const repositories = stmt.all() as Repository[]

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
      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ')
      const values = Object.values(updates)

      const stmt = this.db.prepare(`UPDATE repositories SET ${fields} WHERE id = ?`)
      const result = stmt.run(...values, id)

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Repositorio no encontrado o sin cambios',
        }
      }

      return { success: true }
    } catch (error) {
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
    category: string
  ): Promise<DatabaseResult<{ templates: Template[] }>> {
    try {
      const stmt = this.db.prepare('SELECT * FROM templates WHERE category = ? ORDER BY name')
      const templates = stmt.all(category) as Template[]

      return {
        success: true,
        data: { templates },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error obteniendo templates: ${(error as Error).message}`,
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
      const pages = backup.transfer(-1, 100)
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
      // Por ahora, solo re-ejecutar createTables para añadir nuevas tablas/índices
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
        data: results,
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
        data: { deletedRows: result.changes },
      }
    } catch (error) {
      return {
        success: false,
        error: `Error en limpieza: ${(error as Error).message}`,
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
}
