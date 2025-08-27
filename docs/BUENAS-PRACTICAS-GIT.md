# Buenas Prácticas para Git y Commits

## 📋 Tabla de Contenidos
- [Estructura de Commits](#estructura-de-commits)
- [Tipos de Commits](#tipos-de-commits)
- [Nomenclatura de Branches](#nomenclatura-de-branches)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Herramientas Recomendadas](#herramientas-recomendadas)

## 🎯 Estructura de Commits

Seguimos el formato **PROJ-nroticket/tipo: descripción** para mantener trazabilidad directa con JIRA:

```
PROJ-nroticket/tipo: <descripción>

[cuerpo opcional]
```

### Formato Completo
```
PROJ-123/feat: Implementar autenticación con JWT

- Agregar middleware de autenticación
- Crear endpoints de login/logout
- Implementar validación de tokens
- Agregar tests unitarios para auth service
```

### Componentes del Formato

| Componente | Descripción | Ejemplo |
|------------|-------------|---------|
| `PROJ` | Código del proyecto en JIRA | `IDESAINT`, `INT`, ... |
| `nroticket` | Número del ticket JIRA | `123`, `456`, `789` |
| `tipo` | Tipo de commit | `feat`, `fix`, `docs` |
| `descripción` | Descripción clara y concisa | `Implementar sistema de login` |

## 🏷️ Tipos de Commits

| Tipo | Descripción | Cuándo usar | Ejemplo |
|------|-------------|-------------|---------|
| `feat` | Nueva funcionalidad | Agregar una nueva feature para el usuario | `PROJ-123/feat: Agregar dashboard de métricas` |
| `fix` | Corrección de errores | Solucionar un bug o problema | `PROJ-456/fix: Corregir validación de formularios` |
| `docs` | Documentación | Agregar o actualizar documentación | `PROJ-789/docs: Actualizar guía de instalación` |
| `style` | Formato/estilo | Cambios que no afectan funcionalidad | `PROJ-101/style: Aplicar formato Prettier` |
| `refactor` | Refactorización | Cambio de código sin agregar funcionalidad | `PROJ-202/refactor: Simplificar lógica de validación` |
| `test` | Pruebas | Agregar o modificar tests | `PROJ-303/test: Agregar tests para UserService` |
| `chore` | Mantenimiento | Cambios en build, dependencias, configuración | `PROJ-404/chore: Actualizar dependencias npm` |
| `perf` | Performance | Cambios que mejoran el rendimiento | `PROJ-505/perf: Optimizar consultas de base de datos` |
| `ci` | Integración continua | Cambios en configuración de CI/CD | `PROJ-606/ci: Configurar pipeline de deployment` |
| `build` | Build system | Cambios en sistema de build | `PROJ-707/build: Actualizar configuración Webpack` |
| `revert` | Reversión | Revertir un commit anterior | `PROJ-808/revert: Revertir cambios en auth system` |

## 🌿 Nomenclatura de Branches

### Estructura de Branches
```
PROJ-nroticket/tipo-descripcion-corta
```

### Ejemplos de Branches
```bash
# ✅ CORRECTO
PROJ-123/feat-automatic-releases
PROJ-456/fix-git-tag-validation
PROJ-789/chore-update-electron-version
PROJ-101/docs-api-documentation

# ❌ INCORRECTO
feature/nueva-funcionalidad
bugfix/arreglos
pablo/mis-cambios
```

### Tipos de Branches por Propósito

| Tipo de Trabajo | Branch Format | Ejemplo |
|-----------------|---------------|---------|
| Nueva funcionalidad | `PROJ-XXX/feat-descripcion` | `PROJ-123/feat-auto-updater` |
| Corrección de bugs | `PROJ-XXX/fix-descripcion` | `PROJ-456/fix-auth-validation` |
| Corrección urgente | `PROJ-XXX/hotfix-descripcion` | `PROJ-789/hotfix-security-patch` |
| Mantenimiento | `PROJ-XXX/chore-descripcion` | `PROJ-101/chore-update-deps` |
| Documentación | `PROJ-XXX/docs-descripcion` | `PROJ-202/docs-user-guide` |

## 🔄 Flujo de Trabajo

### 1. Crear Branch desde Ticket JIRA
```bash
# Desde master/qa
git checkout master
git pull origin master
git checkout -b PROJ-123/feat-auto-updater
```

### 2. Desarrollo con Commits Siguiendo el Formato
```bash
# Commit inicial
git add src/services/UpdaterService.js
git commit -m "PROJ-123/feat: Crear servicio base de actualizaciones

- Implementar clase UpdaterService
- Agregar métodos de verificación de versiones
- Configurar endpoints de descarga"

# Commit de tests
git add tests/services/UpdaterService.test.js
git commit -m "PROJ-123/test: Agregar tests para UpdaterService

- Tests de verificación de versiones
- Tests de manejo de errores
- Mocks para servicios externos"
```

### 3. Push y Pull Request
```bash
git push origin PROJ-123/feat-auto-updater
# Crear PR en GitHub/GitLab
```

### 4. Merge a Main
```bash
# Squash merge manteniendo formato
git checkout master
git merge --squash PROJ-123/feat-auto-updater
git commit -m "PROJ-123/feat: Implementar sistema de auto-actualización completo

- Crear servicio de actualizaciones con verificación de versiones
- Implementar UI para notificaciones de actualización
- Configurar Electron Forge para distribución Windows
- Agregar tests unitarios e integración
- Documentar proceso de deployment"
```

## 📝 Ejemplos Prácticos

### Feature Completa
```bash
PROJ-456/feat: Implementar validación completa de repositorios Git

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
```

### Bug Fix
```bash
PROJ-789/fix: Corregir filtrado de commits por tipo de release

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
```

### Chore/Mantenimiento
```bash
PROJ-234/chore: Actualizar Electron a v37.3.0 y dependencias relacionadas

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
```

### Documentación
```bash
PROJ-567/docs: Crear guía completa de buenas prácticas Git

- Documentar formato estándar PROJ-XXX/tipo: descripción
- Definir tipos de commits disponibles con ejemplos
- Especificar nomenclatura de branches
- Incluir flujo de trabajo completo
- Agregar ejemplos prácticos para cada tipo
- Definir herramientas recomendadas
- Establecer checklist de validación

Cubre todos los aspectos:
* Estructura y formato obligatorio
* Trazabilidad directa con JIRA
* Flujo completo de desarrollo
* Casos de uso reales
* Herramientas de automatización
```

## 🛠️ Herramientas Recomendadas

### 1. Template de Commit
Crear template en `.gitmessage`:
```bash
# PROJ-XXX/tipo: <descripción>
#
# [Cuerpo del commit - explicar el QUÉ y POR QUÉ]
#
# Ejemplos de formato:
# PROJ-123/feat: Implementar nuevo dashboard
# PROJ-456/fix: Corregir validación de formularios
# PROJ-789/docs: Actualizar documentación API

git config commit.template .gitmessage
```

### 2. Alias de Git Útiles
```bash
# Configurar alias para el formato
git config --global alias.commit-proj '!f() { git commit -m "PROJ-$1/$2: $3"; }; f'

# Uso: git commit-proj 123 feat "Nueva funcionalidad"

# Otros alias útiles
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate --all"
```

### 3. Hook de Pre-commit
Crear `.git/hooks/pre-commit` para validación:
```bash
#!/bin/bash
# Validar formato de commit
commit_msg=$(git log --format=%B -n 1 HEAD)
if [[ ! $commit_msg =~ ^PROJ-[0-9]+/[a-z]+: ]]; then
    echo "❌ Error: El commit debe seguir el formato PROJ-XXX/tipo: descripción"
    echo "Ejemplo: PROJ-123/feat: Nueva funcionalidad"
    exit 1
fi
echo "✅ Formato de commit válido"
```

### 4. Script de Creación de Branch
```bash
#!/bin/bash
# create-branch.sh
if [ $# -ne 3 ]; then
    echo "Uso: ./create-branch.sh <numero-ticket> <tipo> <descripcion>"
    echo "Ejemplo: ./create-branch.sh 123 feat auto-updater"
    exit 1
fi

TICKET=$1
TIPO=$2
DESC=$3
BRANCH_NAME="PROJ-${TICKET}/${TIPO}-${DESC}"

git checkout main
git pull origin main
git checkout -b "$BRANCH_NAME"
echo "✅ Branch creado: $BRANCH_NAME"
```

## 📋 Checklist de Commit

Antes de hacer commit, verificar:

- [ ] ✅ Sigue el formato `PROJ-XXX/tipo: descripción`
- [ ] ✅ El número de ticket JIRA es correcto
- [ ] ✅ El tipo es válido
- [ ] ✅ La descripción es clara y concisa
- [ ] ✅ El cambio es atómico (una sola responsabilidad)
- [ ] ✅ Los tests pasan
- [ ] ✅ No incluye archivos temporales o de configuración local
- [ ] ✅ El branch sigue la nomenclatura correcta

## 🚫 Qué NO hacer

### ❌ Commits Problemáticos
```bash
# Sin formato correcto
git commit -m "fix stuff"
git commit -m "feat: nueva funcionalidad"
git commit -m "actualización"

# Sin número de ticket
git commit -m "PROJ/feat: nueva funcionalidad"

# Sin slash después del número
git commit -m "PROJ-123feat: nueva funcionalidad"

# Muy genérico
git commit -m "PROJ-123/fix: arreglos varios"
```

### ❌ Branches Problemáticos
```bash
# Sin formato correcto
feature/nueva-funcionalidad
bugfix/arreglos
pablo/mis-cambios

# Sin número de ticket
PROJ/feat-nueva-funcionalidad

# Sin slash después del número
PROJ-123feat-nueva-funcionalidad
```

## ✅ Ejemplos de Commits Correctos

```bash
# Features
PROJ-123/feat: Implementar sistema de autenticación OAuth2
PROJ-456/feat: Agregar dashboard de métricas en tiempo real
PROJ-789/feat: Crear módulo de exportación de reportes

# Fixes
PROJ-101/fix: Corregir validación de campos obligatorios
PROJ-202/fix: Resolver problema de memory leak en cache
PROJ-303/fix: Arreglar renderizado en dispositivos móviles

# Chore
PROJ-404/chore: Actualizar dependencias de seguridad
PROJ-505/chore: Configurar ESLint para TypeScript
PROJ-606/chore: Migrar CI/CD a GitHub Actions

# Docs
PROJ-707/docs: Agregar documentación de API REST
PROJ-808/docs: Actualizar guía de contribución
PROJ-909/docs: Crear tutorial de instalación
```

## 📊 Métricas y Seguimiento

### KPIs de Calidad de Commits
- **Formato**: 100% siguiendo PROJ-XXX/tipo: descripción
- **Trazabilidad**: 100% con tickets JIRA válidos
- **Atomicidad**: Promedio <200 líneas por commit
- **Claridad**: Descripciones autoexplicativas sin contexto adicional

### Revisión Periódica
- Review semanal de commits del equipo
- Identificar patrones problemáticos
- Sesiones de formación según necesidad
- Actualización de herramientas y procesos

### Automatización Recomendada
- Validación automática en pre-commit hooks
- Integración con JIRA para verificación de tickets
- Notificaciones automáticas en commits mal formateados
- Reportes automáticos de calidad de commits

---

> **Nota**: Este formato es obligatorio para todos los commits. Mantiene trazabilidad directa con JIRA y facilita el seguimiento de cambios por ticket.