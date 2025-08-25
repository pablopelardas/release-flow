# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-22-integracion-codebasehq/spec.md

## Technical Requirements

### Cliente API de CodebaseHQ
- Implementar cliente HTTP simple usando HttpClient para enviar XML
- Autenticación via API key en URL o headers según documentación
- Timeout configurable (default 30 segundos)
- Logging de todas las operaciones sin exponer credenciales
- Manejo de errores sin interrumpir flujo de tagging

### Modelos de Datos

#### Configuración Extendida por Aplicación
```csharp
public class ApplicationConfig
{
    // Configuración existente...
    public Dictionary<string, string> Repos { get; set; }
    
    // Nueva configuración de CodebaseHQ
    public CodebaseConfig Codebase { get; set; }
}

public class CodebaseConfig
{
    public string ProjectId { get; set; }      // ID del proyecto en CodebaseHQ
    public string Environment { get; set; }     // "production", "staging", etc.
    public string Branch { get; set; }          // "master", "main", etc.
    public string Servers { get; set; }         // "app.myapp.com", puede ser lista separada por comas
}
```

#### Deployment XML
```csharp
public class CodebaseDeployment
{
    public string Branch { get; set; }
    public string Revision { get; set; }  // SHA del commit (dinámico)
    public string Environment { get; set; }
    public string Servers { get; set; }
    
    public string ToXml()
    {
        return $@"<deployment>
  <branch>{Branch}</branch>
  <revision>{Revision}</revision>
  <environment>{Environment}</environment>
  <servers>{Servers}</servers>
</deployment>";
    }
}
```

### Generación de Changelogs
- Usar LibGit2Sharp para obtener commits entre tags
- Formato de salida: JSON y Markdown
- Estructura de carpetas: `changelogs/YYYY-MM/AppName-vX.Y.Z.json|md`
- Incluir: SHA, autor, fecha, mensaje de cada commit
- Mostrar en consola con formato legible

### Integración con ReleaseFlow
- Extender servicio de tagging existente
- Ejecutar creación de deployment DESPUÉS de tags exitosos
- No fallar el proceso principal si falla CodebaseHQ
- Configuración opcional (puede deshabilitarse)

### Configuración en app_repos_config.json
```json
{
  "applications": {
    "TurnosOmintWebAPI": {
      "repos": { /* existente */ },
      "codebase": {
        "project_id": "turnos-omint",
        "environment": "production",
        "branch": "master",
        "servers": "api.turnos.omint.com.ar"
      }
    },
    "TotemAPI": {
      "repos": { /* existente */ },
      "codebase": {
        "project_id": "totem-api",
        "environment": "production", 
        "branch": "main",
        "servers": "totem1.hospital.com,totem2.hospital.com"
      }
    }
  },
  "settings": {
    "auto_push_tags": true,
    "codebase": {
      "enabled": true,
      "api_url": "https://api3.codebasehq.com",
      "api_key": "${CODEBASE_API_KEY}",
      "account": "mi-cuenta"
    }
  }
}
```

### Flujo de Ejecución
1. Crear tags (flujo existente)
2. Si tags exitosos Y CodebaseHQ habilitado:
   - Obtener SHA del commit taggeado
   - Leer configuración de deployment de la app
   - Construir XML con config + SHA
   - POST a `https://api3.codebasehq.com/:account/:project/:repository/deployments`
   - Log resultado (éxito o fallo)
3. Generar changelog:
   - Buscar tag anterior del mismo patrón
   - Obtener commits entre tags
   - Formatear y mostrar en consola
   - Guardar en archivos JSON/MD
4. Continuar con siguiente repositorio

## External Dependencies

- **Polly** (v8.0+) - Para políticas de retry en llamadas HTTP
  - **Justificación:** Manejo robusto de fallos transitorios de red

### Manejo de Errores
- Errores de red: Log y continuar
- API key inválida: Log warning, deshabilitar intentos posteriores
- Proyecto/repo no encontrado: Log error específico
- Timeout: Log y continuar con siguiente repo
- Cualquier error NO debe interrumpir el flujo de tagging