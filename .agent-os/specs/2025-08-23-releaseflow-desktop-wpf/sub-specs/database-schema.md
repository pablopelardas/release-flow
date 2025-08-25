# Esquema de Base de Datos

Este es el esquema de base de datos para la especificación detallada en @.agent-os/specs/2025-08-23-releaseflow-desktop-wpf/spec.md

> Creado: 2025-08-23
> Versión: 1.0.0

## Esquema SQLite para ReleaseFlow Desktop WPF

### Consideraciones Técnicas

- **Motor**: SQLite 3.x para portabilidad y simplicidad
- **ORM**: Entity Framework Core 6.0+
- **Ubicación**: `%APPDATA%/ReleaseFlow/releaseflow.db`
- **Backup**: Automático en `%APPDATA%/ReleaseFlow/backups/`

## Estructura de Tablas

### 1. UserPreferences - Preferencias de Usuario

Almacena configuraciones personalizadas de la interfaz y comportamiento de la aplicación.

```sql
CREATE TABLE UserPreferences (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId TEXT NOT NULL DEFAULT 'default',
    Theme TEXT NOT NULL DEFAULT 'Light' CHECK(Theme IN ('Light', 'Dark', 'Auto')),
    DefaultProjectPath TEXT,
    DefaultOutputPath TEXT,
    NotificationsEnabled INTEGER NOT NULL DEFAULT 1,
    AutoSaveEnabled INTEGER NOT NULL DEFAULT 1,
    AutoSaveIntervalMinutes INTEGER NOT NULL DEFAULT 5 CHECK(AutoSaveIntervalMinutes >= 1),
    Language TEXT NOT NULL DEFAULT 'es-ES',
    WindowWidth INTEGER DEFAULT 1200,
    WindowHeight INTEGER DEFAULT 800,
    WindowMaximized INTEGER DEFAULT 0,
    LastUsedTemplate TEXT,
    ShowWelcomeScreen INTEGER NOT NULL DEFAULT 1,
    EnableTelemetry INTEGER NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(UserId)
);

-- Índice para búsquedas por usuario
CREATE INDEX IX_UserPreferences_UserId ON UserPreferences(UserId);
```

**Rationale**: Centraliza todas las configuraciones de usuario para persistir experiencia personalizada entre sesiones.

### 2. LocalTemplates - Plantillas Locales Personalizadas

Gestiona plantillas creadas o modificadas por el usuario con control de versiones.

```sql
CREATE TABLE LocalTemplates (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT,
    TemplateType TEXT NOT NULL CHECK(TemplateType IN ('Changelog', 'ReleaseNotes', 'Custom')),
    Content TEXT NOT NULL,
    Version INTEGER NOT NULL DEFAULT 1,
    IsActive INTEGER NOT NULL DEFAULT 1,
    IsDefault INTEGER NOT NULL DEFAULT 0,
    Tags TEXT, -- JSON array de tags para categorización
    AuthorName TEXT,
    AuthorEmail TEXT,
    BaseTemplateId INTEGER, -- Referencia a plantilla base si aplica
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(Name, Version),
    FOREIGN KEY (BaseTemplateId) REFERENCES LocalTemplates(Id) ON DELETE SET NULL
);

-- Índices para optimizar búsquedas comunes
CREATE INDEX IX_LocalTemplates_Name ON LocalTemplates(Name);
CREATE INDEX IX_LocalTemplates_Type ON LocalTemplates(TemplateType);
CREATE INDEX IX_LocalTemplates_Active ON LocalTemplates(IsActive) WHERE IsActive = 1;
CREATE INDEX IX_LocalTemplates_CreatedAt ON LocalTemplates(CreatedAt DESC);
```

**Rationale**: Permite a los usuarios crear plantillas personalizadas manteniendo historial de versiones para rollback si es necesario.

### 3. RepositoryConfigurations - Configuraciones de Repositorios

Almacena configuraciones específicas por repositorio local incluyendo referencias a credenciales.

```sql
CREATE TABLE RepositoryConfigurations (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    RepositoryPath TEXT NOT NULL,
    RepositoryName TEXT NOT NULL,
    GitRemoteUrl TEXT,
    DefaultBranch TEXT NOT NULL DEFAULT 'main',
    CredentialReference TEXT, -- Referencia segura a Windows Credential Manager
    PreferredTemplateId INTEGER,
    OutputPath TEXT,
    AutoPushEnabled INTEGER NOT NULL DEFAULT 0,
    AutoTagEnabled INTEGER NOT NULL DEFAULT 0,
    TagPrefix TEXT DEFAULT 'v',
    IgnorePatterns TEXT, -- JSON array de patrones a ignorar
    IncludePatterns TEXT, -- JSON array de patrones a incluir
    LastSyncAt DATETIME,
    IsActive INTEGER NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(RepositoryPath),
    FOREIGN KEY (PreferredTemplateId) REFERENCES LocalTemplates(Id) ON DELETE SET NULL
);

-- Índices para búsquedas y listados
CREATE INDEX IX_RepositoryConfigurations_Path ON RepositoryConfigurations(RepositoryPath);
CREATE INDEX IX_RepositoryConfigurations_Name ON RepositoryConfigurations(RepositoryName);
CREATE INDEX IX_RepositoryConfigurations_Active ON RepositoryConfigurations(IsActive) WHERE IsActive = 1;
CREATE INDEX IX_RepositoryConfigurations_LastSync ON RepositoryConfigurations(LastSyncAt DESC);
```

**Rationale**: Mantiene configuraciones específicas por repositorio para experiencia personalizada sin comprometer seguridad de credenciales.

### 4. GeneratedReports - Historial de Reportes Generados

Rastrea todos los reportes generados para auditoría y re-generación rápida.

```sql
CREATE TABLE GeneratedReports (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    RepositoryConfigId INTEGER NOT NULL,
    ReportType TEXT NOT NULL CHECK(ReportType IN ('Changelog', 'ReleaseNotes', 'TagSummary', 'Custom')),
    TemplateId INTEGER,
    TemplateName TEXT NOT NULL,
    OutputPath TEXT NOT NULL,
    FileSize INTEGER,
    CommitRange TEXT, -- "hash1..hash2" o "v1.0.0..v1.1.0"
    TagsIncluded TEXT, -- JSON array de tags incluidos
    GenerationParameters TEXT, -- JSON con parámetros usados
    ExecutionTimeMs INTEGER,
    Success INTEGER NOT NULL,
    ErrorMessage TEXT,
    GeneratedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (RepositoryConfigId) REFERENCES RepositoryConfigurations(Id) ON DELETE CASCADE,
    FOREIGN KEY (TemplateId) REFERENCES LocalTemplates(Id) ON DELETE SET NULL
);

-- Índices para búsquedas de historial y estadísticas
CREATE INDEX IX_GeneratedReports_Repository ON GeneratedReports(RepositoryConfigId);
CREATE INDEX IX_GeneratedReports_Type ON GeneratedReports(ReportType);
CREATE INDEX IX_GeneratedReports_Success ON GeneratedReports(Success);
CREATE INDEX IX_GeneratedReports_GeneratedAt ON GeneratedReports(GeneratedAt DESC);
CREATE INDEX IX_GeneratedReports_Template ON GeneratedReports(TemplateId);
```

**Rationale**: Proporciona trazabilidad completa de operaciones y permite re-ejecutar generaciones previas con los mismos parámetros.

### 5. SyncSettings - Configuración de Sincronización en Equipo

Configuraciones opcionales para sincronización de templates y configuraciones con equipos.

```sql
CREATE TABLE SyncSettings (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TeamId TEXT,
    TeamName TEXT,
    SyncEndpoint TEXT, -- URL del servicio de sincronización
    ApiKeyReference TEXT, -- Referencia a credential manager
    SyncEnabled INTEGER NOT NULL DEFAULT 0,
    SyncFrequencyHours INTEGER DEFAULT 24 CHECK(SyncFrequencyHours > 0),
    SyncTemplates INTEGER NOT NULL DEFAULT 1,
    SyncConfigurations INTEGER NOT NULL DEFAULT 0,
    LastSyncAt DATETIME,
    LastSyncResult TEXT, -- 'Success', 'Failed', 'Partial'
    ConflictResolution TEXT NOT NULL DEFAULT 'Manual' CHECK(ConflictResolution IN ('Manual', 'LocalWins', 'RemoteWins')),
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(TeamId)
);

-- Índice para verificaciones de sincronización
CREATE INDEX IX_SyncSettings_Enabled ON SyncSettings(SyncEnabled) WHERE SyncEnabled = 1;
CREATE INDEX IX_SyncSettings_LastSync ON SyncSettings(LastSyncAt DESC);
```

**Rationale**: Facilita colaboración en equipos manteniendo sincronización opcional de plantillas y configuraciones.

## Relaciones entre Tablas

```
UserPreferences (1) ←→ (1) SyncSettings
LocalTemplates (1) ←→ (N) RepositoryConfigurations [PreferredTemplateId]
LocalTemplates (1) ←→ (N) GeneratedReports [TemplateId]  
LocalTemplates (1) ←→ (N) LocalTemplates [BaseTemplateId] (Auto-referencia)
RepositoryConfigurations (1) ←→ (N) GeneratedReports
```

## Consideraciones de Migración

### Versionado de Esquema

```sql
CREATE TABLE SchemaVersion (
    Version INTEGER PRIMARY KEY,
    AppliedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Description TEXT NOT NULL
);

-- Versión inicial
INSERT INTO SchemaVersion (Version, Description) 
VALUES (1, 'Esquema inicial ReleaseFlow Desktop v1.0.0');
```

### Estrategia de Migración

1. **Backup Automático**: Antes de cada migración, crear backup completo
2. **Transacciones**: Todas las migraciones dentro de transacciones
3. **Rollback**: Mantener scripts de rollback para cada versión
4. **Validación**: Verificar integridad después de migración

### Migraciones Futuras Contempladas

- **v1.1**: Agregar soporte para múltiples usuarios locales
- **v1.2**: Expandir configuraciones de integración (GitHub, GitLab)
- **v1.3**: Cachear metadatos de commits para mejor performance
- **v1.4**: Soporte para workspaces/proyectos agrupados

## Consideraciones de Rendimiento

### Índices de Performance

```sql
-- Índice compuesto para búsquedas de reportes por repositorio y fecha
CREATE INDEX IX_GeneratedReports_Repo_Date ON GeneratedReports(RepositoryConfigId, GeneratedAt DESC);

-- Índice para templates activos más usados
CREATE INDEX IX_LocalTemplates_Usage ON LocalTemplates(IsActive, UpdatedAt DESC) WHERE IsActive = 1;

-- Índice para configuraciones de repositorios activos
CREATE INDEX IX_RepositoryConfigurations_Active_Name ON RepositoryConfigurations(IsActive, RepositoryName) WHERE IsActive = 1;
```

### Optimizaciones

1. **Paginación**: Implementar paginación en listados de reportes e historial
2. **Cleanup Automático**: Limpiar reportes antiguos (>6 meses) automáticamente
3. **Vacuum**: Ejecutar VACUUM periódicamente para optimizar espacio
4. **WAL Mode**: Usar Write-Ahead Logging para mejor concurrencia

```sql
-- Configuración de performance para SQLite
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA foreign_keys = ON;
PRAGMA auto_vacuum = INCREMENTAL;
```

## Seguridad y Privacidad

### Datos Sensibles

- **Credenciales**: Nunca almacenar credenciales directamente, solo referencias a Windows Credential Manager
- **API Keys**: Usar referencias encriptadas a almacén seguro del sistema
- **Paths**: Validar y sanitizar todas las rutas de archivos

### Backup y Recuperación

```sql
-- Trigger para backup automático antes de cambios críticos
CREATE TRIGGER backup_before_schema_change 
BEFORE UPDATE ON SchemaVersion
BEGIN
    -- Lógica de backup implementada en aplicación
    SELECT RAISE(IGNORE); -- Placeholder para lógica de aplicación
END;
```

### Integridad Referencial

- **Foreign Keys**: Habilitadas para mantener consistencia
- **Constraints**: Validaciones a nivel de base de datos
- **Triggers**: Para auditoría y validaciones complejas

## Inicialización de Datos

```sql
-- Configuración por defecto del usuario
INSERT INTO UserPreferences (UserId, Theme, Language, NotificationsEnabled) 
VALUES ('default', 'Light', 'es-ES', 1);

-- Template básico de changelog
INSERT INTO LocalTemplates (Name, Description, TemplateType, Content, IsDefault) 
VALUES ('Changelog Básico', 'Template básico para changelogs', 'Changelog', 
        '# Changelog\n\n## [{{version}}] - {{date}}\n\n{{changes}}', 1);
```