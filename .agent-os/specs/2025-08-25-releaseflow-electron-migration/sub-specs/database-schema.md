# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-25-releaseflow-electron-migration/spec.md

## Migración de Esquema SQLite

### Tablas Existentes a Migrar

#### user_preferences
```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'default',
    key TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, key)
);

CREATE INDEX idx_user_preferences_user_key ON user_preferences(user_id, key);
```
**Rationale:** Mantiene configuración de usuario compatible con versión WPF

#### local_templates
```sql
CREATE TABLE local_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Release',
    is_default BOOLEAN DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_local_templates_name ON local_templates(name);
CREATE INDEX idx_local_templates_category ON local_templates(category);
```
**Rationale:** Almacena templates Liquid.js para el nuevo sistema de templates

#### repository_configurations
```sql
CREATE TABLE repository_configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    local_path TEXT NOT NULL,
    url TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_sync DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repository_configurations_name ON repository_configurations(name);
CREATE INDEX idx_repository_configurations_url ON repository_configurations(url);
```
**Rationale:** Gestiona configuración de repositorios Git locales

#### generated_reports
```sql
CREATE TABLE generated_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repository_name TEXT NOT NULL,
    version TEXT NOT NULL,
    template_used TEXT,
    content TEXT NOT NULL,
    tag_sha TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_reports_repository ON generated_reports(repository_name);
CREATE INDEX idx_generated_reports_date ON generated_reports(generated_at);
```
**Rationale:** Historial de releases generados para auditoría

### Nuevas Tablas para Electron

#### app_settings
```sql
CREATE TABLE app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string',
    is_encrypted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**Rationale:** Configuración global de la aplicación Electron con soporte para valores encriptados

#### git_cache
```sql
CREATE TABLE git_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repository_path TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    cache_value TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(repository_path, cache_key)
);

CREATE INDEX idx_git_cache_expires ON git_cache(expires_at);
```
**Rationale:** Cache temporal para operaciones Git costosas, mejora performance

### Triggers para Actualización Automática

```sql
-- Trigger para user_preferences
CREATE TRIGGER update_user_preferences_timestamp 
AFTER UPDATE ON user_preferences
BEGIN
    UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger para local_templates
CREATE TRIGGER update_local_templates_timestamp 
AFTER UPDATE ON local_templates
BEGIN
    UPDATE local_templates SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger para repository_configurations
CREATE TRIGGER update_repository_configurations_timestamp 
AFTER UPDATE ON repository_configurations
BEGIN
    UPDATE repository_configurations SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger para app_settings
CREATE TRIGGER update_app_settings_timestamp 
AFTER UPDATE ON app_settings
BEGIN
    UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
```
**Rationale:** Mantiene timestamps actualizados automáticamente sin lógica en aplicación

### Datos Semilla (Seed Data)

```sql
-- Templates por defecto con sintaxis Liquid
INSERT INTO local_templates (name, content, category, is_default, description) VALUES
('Default Release Template', '# Release {{ version }}

## Fecha de Release
{{ releaseDate | date: "%Y-%m-%d" }}

## Cambios Principales
{% for feature in features %}
- {{ feature.summary }} ({{ feature.key }})
{% endfor %}

## Correcciones
{% for bugfix in bugfixes %}
- {{ bugfix.summary }} ({{ bugfix.key }})
{% endfor %}

## Mejoras Técnicas
{% for improvement in improvements %}
- {{ improvement.summary }} ({{ improvement.key }})
{% endfor %}

## Estadísticas
- Total de commits: {{ commits | size }}
- Colaboradores: {{ contributors | uniq | size }}', 'Release', 1, 'Plantilla por defecto para generar notas de release'),

('Changelog Template', '# Changelog

## [{{ version }}] - {{ releaseDate | date: "%Y-%m-%d" }}

### Added
{% for feature in features %}
- {{ feature.summary }}
{% endfor %}

### Fixed
{% for bugfix in bugfixes %}
- {{ bugfix.summary }}
{% endfor %}

### Changed
{% for improvement in improvements %}
- {{ improvement.summary }}
{% endfor %}

### Contributors
{% assign unique_authors = commits | map: "author" | uniq %}
{% for author in unique_authors %}
- {{ author }}
{% endfor %}', 'Changelog', 0, 'Plantilla estándar de changelog siguiendo el formato Keep a Changelog');

-- Configuración inicial
INSERT INTO user_preferences (user_id, key, value) VALUES
('default', 'theme', 'system'),
('default', 'language', 'es-ES'),
('default', 'autoSave', 'true'),
('default', 'editorTheme', 'vs-dark');

-- Settings de aplicación
INSERT INTO app_settings (setting_key, setting_value, setting_type) VALUES
('autoUpdate', 'true', 'boolean'),
('telemetry', 'false', 'boolean'),
('defaultBranch', 'main', 'string'),
('gitTimeout', '30000', 'number');
```

### Consideraciones de Migración

1. **Compatibilidad de Datos**: El esquema mantiene misma estructura que WPF para facilitar migración futura de datos
2. **Performance**: Índices optimizados para queries comunes en la aplicación
3. **Integridad**: Constraints UNIQUE previenen duplicados en configuraciones críticas
4. **Mantenibilidad**: Triggers automáticos reducen lógica de aplicación
5. **Seguridad**: Columna is_encrypted en app_settings para valores sensibles