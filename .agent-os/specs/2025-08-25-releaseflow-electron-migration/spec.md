# Spec Requirements Document

> Spec: ReleaseFlow Electron Migration - Aplicación de Gestión de Releases Multiplataforma
> Created: 2025-08-25
> Status: Planning

## Overview

Migrar la aplicación ReleaseFlow Desktop de WPF a Electron con Vue 3, manteniendo toda la funcionalidad existente mientras se mejora la experiencia de desarrollo y se habilita el soporte multiplataforma real. Esta migración permitirá un desarrollo más ágil con hot-reload, una UI más moderna y fluida, y reducirá la complejidad técnica comparada con WPF.

## User Stories

### Historia de Usuario 1: Gestión Visual de Repositorios Git

**Como** desarrollador líder de equipo
**Quiero** gestionar múltiples repositorios Git a través de una interfaz visual intuitiva con Vue 3
**Para que** pueda coordinar releases multi-repositorio sin necesidad de usar la línea de comandos y con mejor rendimiento que la versión WPF.

**Workflow Detallado:**
El usuario abre la aplicación Electron y ve un dashboard moderno con cards de repositorios. Puede agregar nuevos repositorios mediante drag & drop o selector de carpetas. La aplicación valida automáticamente que sean repositorios Git válidos y muestra el estado actual (branch, último commit, tags). El usuario puede seleccionar múltiples repositorios para operaciones batch como tagging simultáneo. Todo esto con animaciones fluidas de Vue 3 y actualización en tiempo real sin los problemas de binding de WPF.

### Historia de Usuario 2: Editor de Templates con Monaco y Preview en Tiempo Real

**Como** desarrollador o release manager
**Quiero** editar templates de changelog usando Monaco Editor con syntax highlighting y autocompletado
**Para que** pueda crear templates personalizados con toda la potencia de un IDE moderno y preview instantáneo.

**Workflow Detallado:**
El usuario navega a la sección de templates, donde ve una lista de templates existentes en cards visuales. Al seleccionar uno, se abre Monaco Editor (mismo motor de VS Code) en el panel izquierdo con syntax highlighting para Liquid. Mientras edita, el panel derecho muestra un preview renderizado en tiempo real usando datos de muestra del repositorio seleccionado. El sistema Liquid ofrece filtros poderosos para transformar datos (fechas, arrays, strings) y mejor manejo de errores. Puede guardar templates localmente o exportarlos/importarlos como archivos JSON. El autocompletado sugiere variables y filtros disponibles basados en el contexto de Git.

### Historia de Usuario 3: Generación de Releases con Wizard Interactivo

**Como** product manager sin experiencia técnica profunda
**Quiero** crear releases mediante un wizard paso a paso con validaciones en cada etapa
**Para que** pueda generar releases profesionales sin errores y sin conocer comandos Git.

**Workflow Detallado:**
El usuario inicia el wizard de release que lo guía paso a paso: 1) Selección visual de repositorios con checkboxes, 2) Selección de versión con sugerencias semánticas basadas en tags existentes, 3) Selección de template con preview, 4) Configuración de opciones (crear tag, push a remoto, etc.) con toggles visuales, 5) Preview final del changelog generado, 6) Confirmación y ejecución con barra de progreso. Si hay errores, se muestran con notificaciones toast no intrusivas y sugerencias de solución.

## Spec Scope

1. **Migración de Core Services** - Portar GitService, ReleaseService y TemplateEngine de C# a JavaScript/TypeScript manteniendo la misma lógica de negocio
2. **UI Vue 3 con Vite** - Desarrollar interfaz moderna con Vue 3, Composition API, TailwindCSS y componentes de PrimeVue/Vuetify
3. **Integración Electron Segura** - Implementar arquitectura IPC segura con contextBridge para comunicación entre procesos
4. **Base de Datos SQLite** - Migrar esquema de Entity Framework a better-sqlite3 manteniendo modelos y relaciones
5. **Editor Monaco Integrado** - Incorporar Monaco Editor con configuración para Handlebars y preview en tiempo real

## Out of Scope

- Reescritura de la lógica de negocio core (se mantiene el mismo comportamiento)
- Nuevas funcionalidades no existentes en la versión WPF actual
- Aplicación web o servicios cloud (mantener enfoque desktop local)
- Migración automática de datos desde la versión WPF (instalación limpia)
- Soporte para sistemas operativos móviles o tablets

## Expected Deliverable

1. **Aplicación Electron funcional** con todas las características de la versión WPF actual ejecutándose en Windows, macOS y Linux
2. **Suite de pruebas E2E** con Playwright para validar funcionalidad crítica de gestión de releases y templates
3. **Instaladores nativos** para cada plataforma (MSI para Windows, DMG para macOS, AppImage para Linux) con auto-actualización
4. **Documentación de migración** en español detallando mapeo de funcionalidades WPF → Electron y guía de instalación

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-25-releaseflow-electron-migration/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-25-releaseflow-electron-migration/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-08-25-releaseflow-electron-migration/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-08-25-releaseflow-electron-migration/sub-specs/api-spec.md