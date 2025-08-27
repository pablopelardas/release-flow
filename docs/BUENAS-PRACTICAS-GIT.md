# Buenas Prácticas para Git y Commits

## 📋 Tabla de Contenidos
- [Estructura de Commits](#estructura-de-commits)
- [Tipos de Commits](#tipos-de-commits)
- [Integración con JIRA](#integración-con-jira)
- [Nomenclatura de Branches](#nomenclatura-de-branches)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Herramientas Recomendadas](#herramientas-recomendadas)

## 🎯 Estructura de Commits

Seguimos el estándar **Conventional Commits** para mantener consistencia en el historial del proyecto:

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

### Formato Completo
```
feat(auth): Implementar autenticación con JWT

- Agregar middleware de autenticación
- Crear endpoints de login/logout
- Implementar validación de tokens
- Agregar tests unitarios para auth service

Relacionado con: PROJ-123
Closes: PROJ-124
```

## 🏷️ Tipos de Commits

| Tipo | Descripción | Cuándo usar |
|------|-------------|-------------|
| `feat` | Nueva funcionalidad | Agregar una nueva feature para el usuario |
| `fix` | Corrección de errores | Solucionar un bug o problema |
| `docs` | Documentación | Agregar o actualizar documentación |
| `style` | Formato/estilo | Cambios que no afectan funcionalidad (espacios, formato, etc.) |
| `refactor` | Refactorización | Cambio de código que no agrega funcionalidad ni corrige bugs |
| `test` | Pruebas | Agregar o modificar tests |
| `chore` | Mantenimiento | Cambios en build, dependencias, configuración |
| `perf` | Performance | Cambios que mejoran el rendimiento |
| `ci` | Integración continua | Cambios en configuración de CI/CD |
| `build` | Build system | Cambios en sistema de build o dependencias externas |
| `revert` | Reversión | Revertir un commit anterior |

## 🎫 Integración con JIRA

### Obligatorio: Referencia a Ticket
Todos los commits **DEBEN** estar relacionados con un ticket de JIRA:

```bash
# ✅ CORRECTO
feat(releases): Agregar generación automática de changelog

Implementar sistema que genera changelog desde commits
entre tags utilizando plantillas personalizables.

Relacionado con: PROJ-456

# ❌ INCORRECTO (sin referencia JIRA)
feat: agregar changelog
```

### Formato de Referencias JIRA

| Tipo de relación | Formato | Ejemplo |
|------------------|---------|---------|
| Ticket relacionado | `Relacionado con: TICKET-123` | `Relacionado con: PROJ-456` |
| Cierra ticket | `Closes: TICKET-123` | `Closes: BUG-789` |
| Implementa | `Implements: TICKET-123` | `Implements: FEAT-123` |
| Fixes | `Fixes: TICKET-123` | `Fixes: BUG-456` |

### Múltiples Tickets
```bash
feat(git): Implementar validación de repositorios

- Validar que el directorio sea un repo Git válido
- Verificar estado del working directory
- Comprobar existencia de remotes

Relacionado con: PROJ-123, PROJ-124
Closes: BUG-456
```

## 🌿 Nomenclatura de Branches

### Estructura de Branches
```
<tipo>/<ticket-jira>-<descripción-corta>
```

### Tipos de Branches
| Tipo | Propósito | Ejemplo |
|------|-----------|---------|
| `feature/` | Nueva funcionalidad | `feature/PROJ-123-auto-updater` |
| `bugfix/` | Corrección de bugs | `bugfix/BUG-456-auth-validation` |
| `hotfix/` | Corrección urgente en producción | `hotfix/CRIT-789-security-patch` |
| `chore/` | Mantenimiento/configuración | `chore/DEV-123-update-dependencies` |
| `docs/` | Documentación | `docs/DOC-456-api-documentation` |

### Ejemplos de Branches
```bash
# ✅ CORRECTO
feature/PROJ-123-automatic-releases
bugfix/BUG-456-git-tag-validation
hotfix/CRIT-789-security-vulnerability
chore/DEV-321-update-electron-version

# ❌ INCORRECTO
new-feature
fix-bug
my-changes
```

## 🔄 Flujo de Trabajo

### 1. Crear Branch desde Ticket JIRA
```bash
# Desde main/develop
git checkout main
git pull origin main
git checkout -b feature/PROJ-123-auto-updater
```

### 2. Desarrollo con Commits Atómicos
```bash
# Commits pequeños y enfocados
git add src/services/UpdaterService.js
git commit -m "feat(updater): Crear servicio base de actualizaciones

Relacionado con: PROJ-123"

git add tests/services/UpdaterService.test.js
git commit -m "test(updater): Agregar tests para UpdaterService

Relacionado con: PROJ-123"
```

### 3. Push y Pull Request
```bash
git push origin feature/PROJ-123-auto-updater
# Crear PR en GitHub/GitLab con template
```

### 4. Merge a Main
```bash
# Squash merge manteniendo historia limpia
git checkout main
git merge --squash feature/PROJ-123-auto-updater
git commit -m "feat(updater): Implementar sistema de auto-actualización

- Crear servicio de actualizaciones
- Implementar verificación de versiones
- Agregar UI para notificaciones de actualización
- Configurar Electron Forge para distribución

Implements: PROJ-123
Relacionado con: PROJ-124, PROJ-125"
```

## 📝 Ejemplos Prácticos

### Feature Completa
```bash
feat(git): Implementar validación completa de repositorios

- Agregar validación de directorio Git válido
- Verificar estado del working directory
- Comprobar configuración de remotes
- Implementar validación de permisos
- Agregar manejo de errores específicos

Funcionalidades implementadas:
* GitService.validateRepository()
* GitService.checkWorkingDirectory()
* GitService.validateRemotes()

Tests agregados:
* Validación de repositorio válido/inválido
* Casos edge de directorio vacío
* Manejo de errores de permisos

Implements: PROJ-456
Relacionado con: PROJ-457, PROJ-458
```

### Bug Fix
```bash
fix(releases): Corregir filtrado de commits por tipo de release

Problema: Los commits no se filtraban correctamente al generar
changelog para releases patch, causando que se incluyeran
commits de features en releases de bugfix.

Solución:
- Corregir lógica de filtrado en ReleaseService.getCommitsForReleaseType()
- Agregar validación de tipo de commit según semver
- Mejorar regex para detección de breaking changes

Casos de prueba:
- Release patch solo incluye fixes
- Release minor incluye fixes y features
- Release major incluye todos los tipos

Fixes: BUG-789
Relacionado con: PROJ-123
```

### Chore/Mantenimiento
```bash
chore(deps): Actualizar Electron a v37.3.0 y dependencias relacionadas

Actualizaciones realizadas:
- electron: 36.2.0 → 37.3.0
- @electron/rebuild: 3.6.0 → 4.0.1
- electron-updater: 6.1.7 → 6.6.2

Cambios necesarios:
- Actualizar configuración de seguridad en main.ts
- Ajustar CSP para nueva versión
- Corregir deprecations en autoUpdater API

Tests: ✅ Todas las pruebas pasan
Build: ✅ Aplicación compila sin errores

Relacionado con: MAINT-234
```

## 🛠️ Herramientas Recomendadas

### 1. Commitizen
Instalar globalmente para commits interactivos:
```bash
npm install -g commitizen cz-conventional-changelog
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

# Uso
git cz
```

### 2. Husky + Commitlint
Validación automática de commits:
```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli husky

# .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "body-max-line-length": [2, "always", 100],
    "footer-max-line-length": [2, "always", 100]
  }
}
```

### 3. Template de Commit
Crear template en `.gitmessage`:
```bash
# <tipo>[ámbito]: <descripción>
#
# [Cuerpo del commit - explicar el QUÉ y POR QUÉ]
#
# [Pie - referencias a JIRA]
# Relacionado con: PROJ-XXX
# Closes: BUG-XXX
# Implements: FEAT-XXX

git config commit.template .gitmessage
```

### 4. Alias de Git Útiles
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.last "log -1 HEAD"
```

## 📋 Checklist de Commit

Antes de hacer commit, verificar:

- [ ] ✅ El commit tiene un tipo válido (feat, fix, docs, etc.)
- [ ] ✅ La descripción es clara y concisa
- [ ] ✅ Incluye referencia a ticket JIRA
- [ ] ✅ El cambio es atómico (una sola responsabilidad)
- [ ] ✅ Los tests pasan
- [ ] ✅ No incluye archivos temporales o de configuración local
- [ ] ✅ El mensaje sigue el formato conventional commits

## 🚫 Qué NO hacer

### ❌ Commits Problemáticos
```bash
# Muy vago
git commit -m "fix stuff"

# Sin contexto
git commit -m "update"

# Sin referencia JIRA
git commit -m "feat: nueva funcionalidad increíble"

# Demasiado genérico
git commit -m "cambios varios"

# Commit gigante
git commit -m "feat: refactor completo del sistema"
```

### ❌ Branches Problemáticos
```bash
# Sin ticket JIRA
feature/nueva-funcionalidad

# Muy genérico
bugfix/arreglos

# Nombres personales
pablo/mis-cambios
```

## 📊 Métricas y Seguimiento

### KPIs de Calidad de Commits
- **Coverage JIRA**: >95% de commits con referencia a ticket
- **Formato**: >95% siguiendo conventional commits
- **Atomicidad**: Promedio <200 líneas por commit
- **Frecuencia**: Al menos 1 commit por día de trabajo

### Revisión Periódica
- Review mensual de calidad de commits
- Identificar patrones problemáticos
- Sesiones de formación según necesidad
- Actualización de herramientas y procesos

---

> **Nota**: Esta documentación es un estándar en evolución. Se actualiza según las necesidades del equipo y las mejores prácticas de la industria.