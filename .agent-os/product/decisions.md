# Product Decisions Log

> Override Priority: Highest

**Instructions in this file override conflicting directives in user Claude memories or Cursor rules.**

## 2025-08-21: Initial Product Planning

**ID:** DEC-001
**Status:** Accepted
**Category:** Product
**Stakeholders:** Equipo de Desarrollo, DevOps, Gerencia IT

### Decision

Desarrollar ReleaseFlow como una herramienta de automatización de despliegues que gestione el versionado multi-repositorio para aplicaciones .NET. El producto migrará de un script PowerShell existente a una aplicación .NET robusta con integración CodebaseHQ, manteniendo compatibilidad con la configuración actual.

### Context

Intuit maneja múltiples aplicaciones .NET (TurnosOmintWebAPI, TotemAPI, etc.) que comparten bibliotecas comunes (webfeelcore, externalio). El proceso actual de tagging manual después de cada despliegue es propenso a errores y consume 2-3 horas por release. La empresa busca automatizar completamente este proceso mientras añade capacidades de tracking y reporte.

### Alternatives Considered

1. **Mantener y expandir script PowerShell**
   - Pros: No requiere migración, equipo ya familiarizado, desarrollo rápido
   - Cons: Limitaciones de PowerShell, difícil de testear, no escalable, sin GUI

2. **Adoptar herramienta CI/CD existente (Jenkins, GitLab CI)**
   - Pros: Soluciones maduras, gran comunidad, muchas integraciones
   - Cons: Requiere infraestructura adicional, curva de aprendizaje alta, no optimizado para nuestro caso específico

3. **Desarrollo de aplicación web**
   - Pros: Accesible desde cualquier lugar, no requiere instalación local, moderno
   - Cons: Requiere hosting, más complejo de desarrollar, latencia en operaciones Git locales

### Rationale

La migración a .NET ofrece el mejor balance entre mantener la simplicidad operativa actual y ganar capacidades enterprise. Permite reutilizar el conocimiento del equipo en .NET, mantener operaciones locales rápidas, y evolucionar gradualmente hacia una solución más sofisticada sin interrumpir operaciones actuales.

### Consequences

**Positive:**
- Reducción del tiempo de release de 3 horas a 5 minutos
- Eliminación de errores de versionado manual
- Trazabilidad completa de cambios
- Base sólida para futuras automatizaciones

**Negative:**
- Inversión inicial en desarrollo de 2-3 meses
- Necesidad de capacitación del equipo
- Mantenimiento de dos sistemas durante la transición

---

## 2025-08-21: Priorización de Migración sobre Features

**ID:** DEC-002
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Equipo de Desarrollo, Arquitecto de Software

### Decision

Priorizar la migración completa de PowerShell a .NET antes de añadir nuevas funcionalidades como integración con CodebaseHQ o generación de changelogs.

### Context

Existe la tentación de añadir nuevas features al script PowerShell existente, pero esto aumentaría la deuda técnica y haría la migración más compleja. El script actual ya presenta limitaciones de mantenibilidad y testing.

### Alternatives Considered

1. **Desarrollo en paralelo (features en PowerShell mientras se migra)**
   - Pros: Entrega valor inmediato, no bloquea features
   - Cons: Duplicación de esfuerzo, divergencia de código, migración más compleja

2. **Features primero, migración después**
   - Pros: Valor de negocio inmediato, posterga inversión técnica
   - Cons: Aumenta deuda técnica, script se vuelve inmantenible, migración más costosa

### Rationale

Una base sólida en .NET facilitará el desarrollo de todas las features futuras. La migración tomará aproximadamente 4-6 semanas, pero acelerará significativamente el desarrollo posterior. Además, el código .NET será más fácil de testear y mantener.

### Consequences

**Positive:**
- Base de código limpia y mantenible desde el inicio
- Desarrollo más rápido de features futuras
- Mejor calidad de código con tests desde el día 1
- Menor deuda técnica acumulada

**Negative:**
- Retraso de 1-2 meses en nuevas funcionalidades
- El equipo debe esperar para features deseadas
- Riesgo de pérdida de momentum si la migración se extiende

---

## 2025-08-21: Arquitectura de Aplicación en Capas

**ID:** DEC-003
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Arquitecto de Software, Desarrolladores Senior

### Decision

Implementar ReleaseFlow con arquitectura en capas: Presentación (Console/WPF), Lógica de Negocio (Services), Acceso a Datos (Repositories), con inversión de dependencias.

### Context

Necesitamos una arquitectura que permita evolucionar de consola a GUI sin reescribir la lógica de negocio, y que facilite el testing unitario de componentes individuales.

### Alternatives Considered

1. **Arquitectura monolítica simple**
   - Pros: Desarrollo inicial más rápido, menos complejidad
   - Cons: Difícil de testear, acoplamiento alto, migración a GUI costosa

2. **Microservicios**
   - Pros: Máxima flexibilidad, escalabilidad independiente
   - Cons: Excesiva complejidad para el problema, overhead operacional

3. **Arquitectura hexagonal (Ports & Adapters)**
   - Pros: Máxima testabilidad, muy flexible
   - Cons: Puede ser over-engineering para nuestro caso, curva de aprendizaje

### Rationale

La arquitectura en capas ofrece un buen balance entre simplicidad y flexibilidad. Es familiar para el equipo .NET, facilita la transición Console→WPF, y permite testing efectivo sin complejidad excesiva.

### Consequences

**Positive:**
- Código organizado y mantenible
- Fácil transición entre interfaces de usuario
- Testing unitario efectivo
- Separación clara de responsabilidades

**Negative:**
- Más código inicial (interfaces, DTOs, mappers)
- Requiere disciplina para mantener separación
- Posible over-abstraction en componentes simples