# ReleaseFlow Desktop - Guía del Usuario

## 📋 Descripción

ReleaseFlow Desktop es una aplicación de escritorio construida con Electron que automatiza la gestión de releases y tags en repositorios Git. Permite generar changelog, crear templates personalizables y gestionar múltiples repositorios desde una interfaz gráfica moderna.

## 🚀 Instalación

### Windows
1. Descarga el instalador `releaseflow-electron-X.X.X Setup.exe` desde la carpeta `out/make/squirrel.windows/x64/`
2. Ejecuta el instalador y sigue las instrucciones
3. La aplicación se iniciará automáticamente tras la instalación

### Versión Portable
1. Descarga el archivo `releaseflow-electron-win32-x64-X.X.X.zip` desde la carpeta `out/make/zip/win32/x64/`
2. Extrae el contenido a una carpeta de tu elección
3. Ejecuta `releaseflow-electron.exe`

## 🎯 Características Principales

### 📊 Dashboard
- Vista general de métricas del proyecto
- Resumen de repositorios configurados
- Estado de integraciones externas (CodebaseHQ, JIRA, Teams)

### 📁 Gestión de Repositorios
- **Agregar repositorios**: Usa el selector de carpetas nativo para agregar repositorios Git
- **Soporte para monorepos**: Configura prefijos de tags para separar aplicaciones
- **Vista de información**: Nombre, rama actual, número de commits y último tag
- **Acciones rápidas**: Abrir en Explorer, actualizar información, eliminar

### 📝 Editor de Templates
- **Editor Monaco**: Editor avanzado con sintaxis highlighting para Liquid
- **Templates predefinidos**: Plantillas listas para usar
- **Preview en tiempo real**: Vista previa instantánea de los release notes
- **Sistema Liquid**: Potente motor de plantillas con filtros personalizados

### 🚀 Generador de Releases
- **Wizard de 4 pasos**:
  1. **Repositorio**: Selecciona el repositorio objetivo
  2. **Versión**: Elige tipo de release (patch, minor, major) o versión personalizada
  3. **Template**: Selecciona y previsualiza el template de release notes
  4. **Confirmación**: Revisa los cambios y confirma la creación

### 📖 Changelog
- **Vista histórica**: Timeline completo de releases
- **Filtrado por prefijo**: Solo muestra tags relevantes para cada aplicación
- **Comparación de versiones**: Diferencias detalladas entre cualquier par de tags
- **Información de commits**: Autor, fecha, mensaje y tipo de cambio

### ⚙️ Configuración
- **Integraciones**: Configurar APIs de CodebaseHQ, JIRA y Microsoft Teams
- **Templates**: Gestionar plantillas de release notes
- **Preferencias**: Configuraciones de la aplicación

## 🔧 Uso Básico

### Primer Uso
1. **Agregar un repositorio**:
   - Ve a la sección "Repositorios"
   - Haz clic en "Agregar Repositorio"
   - Selecciona la carpeta del repositorio Git
   - Si es un monorepo, configura el prefijo de tag apropiado

2. **Crear tu primer release**:
   - Ve a la sección "Releases"
   - Haz clic en "Nuevo Release"
   - Sigue el wizard de 4 pasos
   - ¡Listo! Tu release ha sido creado

### Trabajo con Monorepos

Para repositorios que contienen múltiples aplicaciones:

1. **Agregar la misma ruta múltiples veces**:
   - Repo: `D:\proyectos\omint` → Prefijo: `TurnosOmintWebAPIv`
   - Repo: `D:\proyectos\omint` → Prefijo: `Bot-v`
   - Repo: `D:\proyectos\omint` → Prefijo: `OmintDigitalAPIBotv`

2. **Cada entrada mostrará solo sus tags relevantes**:
   - TurnosOmintWebAPIv1.0.6.288, TurnosOmintWebAPIv1.0.7, etc.
   - Bot-v2.1.0, Bot-v2.1.1, etc.

## 🎨 Templates Liquid

### Variables Disponibles
```liquid
{{ repository_name }}     # Nombre del repositorio
{{ from_tag }}           # Tag de inicio
{{ to_tag }}             # Tag de destino
{{ commit_count }}       # Número de commits
{{ release_date }}       # Fecha del release

{% for commit in commits %}
  {{ commit.hash }}      # Hash del commit
  {{ commit.message }}   # Mensaje del commit
  {{ commit.author }}    # Autor del commit
  {{ commit.date }}      # Fecha del commit
  {{ commit.type }}      # Tipo de commit (feat, fix, docs, etc.)
{% endfor %}
```

### Filtros Personalizados
```liquid
{{ commit.message | capitalize }}    # Capitalizar primera letra
{{ commit.date | format_date }}      # Formatear fecha
{{ commits | group_by_type }}        # Agrupar commits por tipo
```

## 🔗 Integraciones

### CodebaseHQ
- Creación automática de deployments
- Sincronización de commits y branches
- Gestión de merge requests

### JIRA
- Vinculación automática con tickets
- Actualización de estados
- Comentarios en issues

### Microsoft Teams
- Notificaciones de nuevos releases
- Webhooks configurables
- Mensajes de error y estado

## 🛠️ Versionado Inteligente

### Tipos de Release
- **Patch (1.0.0 → 1.0.1)**: Correcciones de bugs
- **Minor (1.0.1 → 1.1.0)**: Nuevas funcionalidades compatibles
- **Major (1.1.0 → 2.0.0)**: Cambios que rompen compatibilidad

### Lógica de Comparación
- **Patch**: Compara contra el último patch
- **Minor**: Incluye todos los patches del minor
- **Major**: Incluye todos los minors y patches

### Versiones de 4 Dígitos
Para repositorios con formato `1.0.6.288`:
- Al crear `1.0.7`, compara solo hasta el 3er dígito
- Asume que el 4to dígito es build/revision automático

## 🐛 Solución de Problemas

### La aplicación no inicia
1. Verifica que tienes permisos de ejecución
2. Ejecuta como administrador si es necesario
3. Revisa que no haya antivirus bloqueando la aplicación

### No se detectan repositorios Git
1. Asegúrate de que la carpeta seleccionada contiene un `.git`
2. Verifica que Git esté instalado en el sistema
3. Comprueba los permisos de la carpeta

### Preview de template no funciona
1. Revisa la sintaxis Liquid en el editor
2. Verifica que el repositorio tenga commits y tags
3. Consulta la documentación de templates

### Commits incorrectos en changelog
1. Verifica que el prefijo de tag sea correcto
2. Asegúrate de que los tags existan en el repositorio
3. Revisa que no haya tags duplicados con diferentes prefijos

## 📞 Soporte

Para reportar problemas o sugerir mejoras:
- Repositorio: [Intuit Development Team]
- Email: [desarrollo@intuit.com]

---

**Versión**: 1.0.0  
**Última actualización**: Agosto 2025  
**Desarrollado por**: Intuit Development Team