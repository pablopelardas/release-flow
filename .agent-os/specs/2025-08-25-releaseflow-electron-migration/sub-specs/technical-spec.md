# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-25-releaseflow-electron-migration/spec.md

## Technical Requirements

### Arquitectura de Aplicación

- **Electron 37.3** con arquitectura de procesos separados (main, renderer, preload) - Compatible con Node.js 22
- **Context Bridge** para comunicación segura IPC entre procesos
- **Vue 3.4+** con Composition API y TypeScript para el frontend
- **Vite 5+** como bundler con HMR para desarrollo rápido
- **Pinia** para gestión de estado global reactivo

### Stack Frontend

- **Vue Router 4** para navegación SPA dentro de Electron
- **TailwindCSS 3.4** para estilos utility-first
- **PrimeVue 3** o **Vuetify 3** para componentes UI consistentes
- **Monaco Editor** para edición de templates con syntax highlighting
- **VueUse** para composables de utilidad y reactivos

### Stack Backend (Proceso Principal)

- **simple-git** para operaciones Git sin dependencias nativas
- **better-sqlite3** para base de datos SQLite con mejor rendimiento
- **liquidjs** (^10.0.0) para sistema de templates moderno y flexible
- **axios** para llamadas HTTP a APIs externas (CodebaseHQ, Jira)
- **electron-store** para persistencia de configuración de usuario

### Estructura de Proyecto

```
releaseflow-electron/
├── electron/              # Proceso principal
│   ├── main.ts           # Entry point de Electron
│   ├── preload.ts        # Context bridge
│   ├── services/         # Servicios backend
│   │   ├── git.service.ts
│   │   ├── release.service.ts
│   │   ├── template.service.ts
│   │   └── database.service.ts
│   └── ipc/              # Handlers IPC
├── src/                  # Aplicación Vue
│   ├── views/            # Páginas principales
│   ├── components/       # Componentes reutilizables
│   ├── stores/           # Pinia stores
│   ├── composables/      # Lógica compartida
│   └── assets/           # Recursos estáticos
└── database/             # Esquemas y migraciones
```

### Comunicación IPC

- Implementar handlers IPC tipo-safe con TypeScript
- Validación de esquemas con Zod para datos entre procesos
- Manejo de errores centralizado con respuestas estructuradas
- Rate limiting para operaciones costosas (Git, DB)

### Seguridad

- No exponer Node.js APIs directamente al renderer
- Sanitización de inputs para prevenir inyección de comandos
- Validación de rutas de archivos para prevenir path traversal
- Encriptación de credenciales sensibles con electron-store

### Performance

- Lazy loading de rutas y componentes Vue
- Virtual scrolling para listas largas de commits/repositorios
- Web Workers para operaciones pesadas de procesamiento
- Caché de operaciones Git frecuentes en memoria

### Testing

- **Vitest** para unit tests de servicios y componentes
- **Playwright** para tests E2E de la aplicación completa
- **@vue/test-utils** para testing de componentes Vue
- Coverage mínimo del 70% para código crítico

## External Dependencies

### Nuevas Dependencias Core

- **electron** (^37.3.0) - Framework para aplicaciones desktop multiplataforma con Node.js 22
  - **Justificación:** Reemplazo de WPF para habilitar soporte multiplataforma, versión compatible con Node.js 22 instalado
  
- **simple-git** (^3.20.0) - Cliente Git en JavaScript puro
  - **Justificación:** Reemplazo de LibGit2Sharp sin dependencias nativas

- **better-sqlite3** (^9.2.0) - SQLite nativo de alto rendimiento
  - **Justificación:** Mejor rendimiento que sqlite3 estándar para Electron

- **@monaco-editor/vue** (^1.0.0) - Monaco Editor para Vue 3
  - **Justificación:** Editor de código profesional con syntax highlighting

- **liquidjs** (^10.0.0) - Motor de templates moderno
  - **Justificación:** Sintaxis más limpia que Handlebars, mejor soporte JavaScript, usado por Jekyll/Shopify

### Dependencias de Desarrollo

- **vite** (^5.0.0) - Build tool moderno con HMR
  - **Justificación:** Desarrollo más rápido que webpack con mejor DX

- **electron-builder** (^24.0.0) - Creación de instaladores nativos
  - **Justificación:** Generación automática de MSI, DMG, AppImage

- **playwright** (^1.40.0) - Testing E2E moderno
  - **Justificación:** Tests multiplataforma de aplicación Electron

### Dependencias UI

- **primevue** (^3.45.0) - Componentes UI para Vue 3
  - **Justificación:** Biblioteca completa de componentes profesionales

- **tailwindcss** (^3.4.0) - Framework CSS utility-first
  - **Justificación:** Desarrollo rápido de UI consistente y personalizable

- **@vueuse/core** (^10.7.0) - Composables de utilidad para Vue 3
  - **Justificación:** Funcionalidad reactiva común pre-construida