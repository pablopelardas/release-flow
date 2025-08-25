# Product Mission

## Pitch

ReleaseFlow es una herramienta de automatización de despliegues que ayuda a equipos de desarrollo .NET a gestionar releases complejos multi-repositorio mediante versionado automatizado y orquestación de deployments, eliminando los errores manuales y reduciendo el tiempo de despliegue de horas a minutos.

## Users

### Primary Customers

- **Equipos de Desarrollo .NET**: Desarrolladores que trabajan con aplicaciones empresariales que tienen múltiples dependencias compartidas
- **Equipos DevOps**: Ingenieros responsables de automatizar y optimizar los procesos de CI/CD
- **Release Managers**: Profesionales encargados de coordinar y validar los despliegues a producción

### User Personas

**Desarrollador Senior .NET** (28-45 años)
- **Role:** Lead Developer / Arquitecto de Software
- **Context:** Empresa con múltiples aplicaciones .NET interconectadas que comparten bibliotecas comunes
- **Pain Points:** Tagging manual propenso a errores, falta de trazabilidad entre versiones, tiempo perdido en procesos repetitivos
- **Goals:** Automatizar el versionado, mantener consistencia entre repositorios, reducir errores de despliegue

**Ingeniero DevOps** (25-40 años)
- **Role:** DevOps Engineer / SRE
- **Context:** Responsable de mantener pipelines de CI/CD y garantizar despliegues confiables
- **Pain Points:** Procesos manuales no escalables, falta de integración con herramientas existentes, dificultad para auditar cambios
- **Goals:** Automatización completa del pipeline, integración con sistemas existentes, visibilidad del proceso

## The Problem

### Versionado Manual Inconsistente

Los equipos actualmente tagean manualmente cada repositorio después de un despliegue, lo que resulta en inconsistencias de versiones entre dependencias acopladas. Esto genera en promedio 2-3 horas de trabajo manual por release y un 15% de errores de versionado.

**Our Solution:** Automatización completa del tagging multi-repositorio con una sola acción.

### Falta de Trazabilidad de Cambios

No existe una forma centralizada de ver qué cambió entre versiones de aplicaciones con múltiples dependencias. Los equipos pierden 4-5 horas investigando cambios para cada release mayor.

**Our Solution:** Generación automática de changelogs consolidados y reportes de diferencias entre versiones.

### Desconexión entre Tags y Deployments

Los tags de Git y los registros de deployment en sistemas como CodebaseHQ no están sincronizados. Esto dificulta el rastreo de qué versión está desplegada en cada ambiente.

**Our Solution:** Integración directa con API de CodebaseHQ para crear deployments automáticamente con cada tag.

## Differentiators

### Configuración Declarativa Multi-Aplicación

A diferencia de scripts bash genéricos o soluciones de CI/CD complejas, ReleaseFlow usa configuración JSON simple que mapea aplicaciones con sus dependencias. Esto reduce el tiempo de configuración de días a minutos y permite gestionar docenas de aplicaciones desde un único punto.

### Integración Nativa con CodebaseHQ

Mientras que otras herramientas requieren webhooks complejos o integraciones personalizadas, ReleaseFlow se integra directamente con la API de CodebaseHQ. Esto permite sincronización bidireccional completa y reduce la complejidad de integración en un 80%.

### Migración Progresiva PowerShell a .NET

A diferencia de reescrituras completas que interrumpen los flujos de trabajo, ReleaseFlow permite usar el script PowerShell existente mientras se migra gradualmente a la aplicación .NET. Esto asegura continuidad operativa con zero downtime durante la transición.

## Key Features

### Core Features

- **Tagging Multi-Repositorio Automatizado:** Aplica el mismo tag a todos los repositorios relacionados con una aplicación en una sola operación
- **Configuración Centralizada JSON:** Define todas las aplicaciones y sus dependencias en un único archivo de configuración versionado
- **Validación de Repositorios Git:** Verifica que todos los repositorios existan y sean válidos antes de ejecutar operaciones
- **Manejo Inteligente de Tags Existentes:** Detecta tags duplicados y ofrece opciones de sobreescritura o versionado alternativo
- **Push Automático Configurable:** Pushea tags a remotos automáticamente o muestra instrucciones manuales según configuración

### Collaboration Features

- **Integración con API CodebaseHQ:** Crea deployments automáticos y sincroniza información de releases con el sistema de gestión
- **Generación de Changelogs:** Produce reportes automáticos de cambios entre versiones para documentación y auditoría
- **Notificaciones de Release:** Envía notificaciones al equipo sobre nuevos releases y su estado
- **Modo Dry-Run:** Permite simular operaciones sin hacer cambios reales para validación previa
- **Logging Detallado:** Registra todas las operaciones para auditoría y troubleshooting