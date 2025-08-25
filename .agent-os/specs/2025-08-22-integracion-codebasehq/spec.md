# Spec Requirements Document

> Spec: Integración con CodebaseHQ y Generación de Changelogs
> Created: 2025-08-22
> Status: Completed

## Overview

Implementar integración simplificada con CodebaseHQ para crear deployments automáticos y generar changelogs entre versiones. Esta fase establecerá la base para futuras integraciones con Jira, capturando y archivando información de cambios entre tags.

## User Stories

### Historia 1: Registro Automático de Deployments en CodebaseHQ

Como un **desarrollador DevOps**, quiero que cada tag creado por ReleaseFlow se registre automáticamente como deployment en CodebaseHQ usando la configuración predefinida de cada aplicación, para mantener un registro centralizado de todos los releases.

El flujo sería:
1. ReleaseFlow crea tags en múltiples repositorios según configuración
2. Para cada tag creado exitosamente, obtiene la configuración de deployment de la aplicación (environment, branch, servers)
3. Se conecta a la API de CodebaseHQ con las credenciales configuradas
4. Envía XML con información del deployment usando la configuración de la app + el SHA del commit taggeado
5. Registra el resultado en logs
6. Continúa con el proceso aunque falle el registro en CodebaseHQ

### Historia 2: Configuración por Aplicación

Como un **administrador de sistemas**, quiero configurar una sola vez los parámetros de deployment para cada aplicación (environment, branch, servers), para que todos los deployments de esa aplicación usen consistentemente la misma configuración.

La configuración debe:
1. Definirse una vez por aplicación en el archivo de configuración
2. Incluir environment (ej: "production", "staging")
3. Incluir branch (ej: "master", "main")
4. Incluir servers (ej: "app.myapp.com", "api.myapp.com")
5. Reutilizarse automáticamente en cada deployment de esa aplicación
6. Solo el revision (SHA del commit) será dinámico en cada ejecución

### Historia 3: Generación de Changelog entre Versiones

Como un **líder técnico**, quiero ver un changelog detallado de todos los commits entre versiones, para entender qué cambios se incluyeron en cada release.

El sistema debe:
1. Identificar el tag anterior del mismo patrón (ej: AppNamev1.0.0 → AppNamev1.0.1)
2. Generar lista de commits entre ambos tags
3. Formatear la información (SHA, autor, fecha, mensaje)
4. Mostrar el changelog en consola
5. Guardar el changelog en archivo para futura integración con Jira

### Historia 4: Archivo de Changelogs para Futura Integración

Como un **gestor de proyecto**, quiero que los changelogs se archiven automáticamente, para poder usarlos cuando implementemos la integración con Jira.

El proceso incluye:
1. Crear estructura de carpetas para changelogs (changelog/YYYY-MM/)
2. Guardar changelog en formato JSON y Markdown
3. Incluir metadata del release (fecha, versión, repositorios)
4. Mantener índice de changelogs generados

## Spec Scope

1. **Cliente API CodebaseHQ Simplificado** - Implementación mínima para crear deployments via XML
2. **Configuración de Deployment por Aplicación** - Settings específicos de environment, branch y servers para cada app
3. **Generador de Changelogs** - Extraer y formatear commits entre tags
4. **Sistema de Archivado** - Almacenar changelogs para uso futuro
5. **Output en Consola** - Mostrar changelog generado al usuario

## Out of Scope

- Integración con Jira (fase posterior)
- Actualización de merge requests en CodebaseHQ
- Interfaz web para visualización
- Modificación del flujo actual de tagging
- Recuperación de deployments existentes desde CodebaseHQ
- Configuración dinámica de environment/branch/servers (siempre usa la configuración predefinida)

## Expected Deliverable

1. Deployments creados automáticamente en CodebaseHQ después de cada tagging exitoso, usando la configuración específica de cada aplicación
2. Changelogs visibles en consola mostrando todos los cambios entre versiones
3. Archivos de changelog guardados en formato JSON y Markdown para futura integración con Jira
4. Configuración extendida que permite definir parámetros de deployment por aplicación