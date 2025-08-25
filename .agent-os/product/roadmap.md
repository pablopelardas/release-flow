# Product Roadmap

## Phase 0: Already Completed ✅

**Goal:** Script funcional de tagging automatizado
**Success Criteria:** Capacidad de tagear múltiples repositorios con un comando

### Features

- [x] Script PowerShell para tagging automatizado - Ejecuta tags en múltiples repos `DONE`
- [x] Configuración JSON centralizada - Define apps y sus dependencias `DONE`
- [x] Validación de repositorios Git - Verifica repos antes de tagear `DONE`
- [x] Manejo de tags existentes - Pregunta antes de sobreescribir `DONE`
- [x] Push automático configurable - Auto-push o instrucciones manuales `DONE`
- [x] Soporte multi-aplicación - Gestiona diferentes apps (TurnosOmintWebAPI, TotemAPI, etc.) `DONE`

## Phase 1: Migración a .NET ✅ (COMPLETADA)

**Goal:** Migrar funcionalidad existente de PowerShell a aplicación .NET manteniendo compatibilidad
**Success Criteria:** Aplicación .NET que reemplaza completamente el script PowerShell con las mismas funcionalidades

### Features

- [x] Aplicación consola .NET 8.0 - Estructura base del proyecto `L` `DONE`
- [x] Parser de configuración JSON - Lee app_repos_config.json existente `M` `DONE`
- [x] Operaciones Git con LibGit2Sharp - Reemplaza comandos git nativos `L` `DONE`
- [x] Sistema de logging estructurado - Logs detallados para debugging `S` `DONE`
- [x] Validación y manejo de errores - Mejora robustez vs script actual `M` `DONE`
- [x] Modo compatibilidad - Lee misma configuración que PowerShell `S` `DONE`
- [x] Build automatizado - Genera ejecutable standalone `S` `DONE`

### Dependencies

- .NET 8.0 SDK instalado
- LibGit2Sharp para operaciones Git
- Acceso a repositorios existentes para testing

## Phase 2: Integración CodebaseHQ

**Goal:** Conectar con API de CodebaseHQ para crear deployments automáticos
**Success Criteria:** Cada tag creado genera automáticamente un deployment en CodebaseHQ

### Features

- [ ] Cliente API CodebaseHQ - Integración con REST API v3 `M`
- [ ] Crear deployments automáticos - Registra cada tag como deployment `M`
- [ ] Sincronizar información de commits - Asocia commits con deployments `L`
- [ ] Gestión de merge requests - Lista y actualiza PRs relacionados `M`
- [ ] Webhooks de notificación - Notifica eventos de deployment `S`
- [ ] Autenticación segura - Gestión de API keys `S`

### Dependencies

- Credenciales API CodebaseHQ
- Documentación API CodebaseHQ
- Ambiente de pruebas en CodebaseHQ

## Phase 3: Changelog y Reportes

**Goal:** Generar automáticamente documentación de cambios entre versiones
**Success Criteria:** Producir changelogs detallados y diffs entre cualquier par de versiones

### Features

- [ ] Generador de changelog - Lista cambios entre tags `L`
- [ ] Análisis de diferencias - Compara versiones de dependencias `M`
- [ ] Exportación múltiples formatos - Markdown, HTML, JSON `M`
- [ ] Plantillas personalizables - Templates para diferentes audiencias `S`
- [ ] Integración con tickets - Vincula cambios con issues/tickets `M`
- [ ] Estadísticas de release - Métricas de cambios y contribuidores `S`

### Dependencies

- Histórico de commits estructurado
- Convenciones de mensajes de commit

## Phase 4: Interfaz Gráfica

**Goal:** Crear GUI de escritorio para mejorar usabilidad
**Success Criteria:** Aplicación WPF completa que reemplaza la interfaz de consola

### Features

- [ ] UI WPF con MVVM - Interfaz gráfica moderna `XL`
- [ ] Dashboard de aplicaciones - Vista general de todas las apps `L`
- [ ] Wizard de configuración - Asistente para nuevas apps `M`
- [ ] Vista de histórico - Timeline de releases anteriores `M`
- [ ] Preview de operaciones - Dry-run visual antes de ejecutar `S`
- [ ] Configuración visual - Editor de JSON integrado `M`

### Dependencies

- Diseño UX/UI aprobado
- Framework WPF y componentes UI

## Phase 5: Características Avanzadas

**Goal:** Añadir capacidades enterprise y automatización avanzada
**Success Criteria:** Sistema completo de CI/CD con capacidades enterprise

### Features

- [ ] Programación de releases - Schedule automático de deployments `L`
- [ ] Rollback automático - Revertir releases problemáticos `XL`
- [ ] Integración CI/CD - Hooks con Jenkins/Azure DevOps `L`
- [ ] Auditoría completa - Log de todas las operaciones `M`
- [ ] Multi-ambiente - Gestión de dev/staging/prod `L`
- [ ] Aprobaciones de release - Flujo de aprobación configurable `M`
- [ ] Métricas y dashboards - Analytics de deployments `L`

### Dependencies

- Infraestructura de CI/CD existente
- Políticas de seguridad y compliance
- Base de datos para persistencia