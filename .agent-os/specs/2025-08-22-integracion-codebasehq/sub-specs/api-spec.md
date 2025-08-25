# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-22-integracion-codebasehq/spec.md

## Service Interface

### ICodebaseService

```csharp
public interface ICodebaseService
{
    // Crear deployment en CodebaseHQ
    Task<DeploymentResult> CreateDeploymentAsync(
        string projectId, 
        string repositoryId, 
        CodebaseDeployment deployment);
    
    // Validar conexión y credenciales
    Task<bool> ValidateConnectionAsync();
}
```

### IChangelogService

```csharp
public interface IChangelogService  
{
    // Generar changelog entre dos tags
    Task<Changelog> GenerateChangelogAsync(
        string repositoryPath,
        string fromTag, 
        string toTag);
    
    // Guardar changelog en archivos
    Task SaveChangelogAsync(
        Changelog changelog,
        string applicationName,
        string version);
    
    // Mostrar changelog en consola
    void DisplayChangelog(Changelog changelog);
}
```

## Modelos de Request/Response

### CodebaseDeployment
```csharp
public class CodebaseDeployment
{
    public string Branch { get; set; }
    public string Revision { get; set; }  // SHA del commit
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

### DeploymentResult
```csharp
public class DeploymentResult
{
    public bool Success { get; set; }
    public string ResponseXml { get; set; }
    public string Message { get; set; }
    public int HttpStatusCode { get; set; }
}
```

### Changelog
```csharp
public class Changelog
{
    public string FromTag { get; set; }
    public string ToTag { get; set; }
    public DateTime GeneratedAt { get; set; }
    public List<CommitInfo> Commits { get; set; }
    public Dictionary<string, object> Metadata { get; set; }
}

public class CommitInfo
{
    public string Sha { get; set; }
    public string Author { get; set; }
    public string Email { get; set; }
    public DateTime Date { get; set; }
    public string Message { get; set; }
}
```

## CodebaseHQ API Integration

### Endpoint
```
POST https://api3.codebasehq.com/:account/:project/:repository/deployments
```

### Autenticación - Basic Auth
```csharp
// Configurar HttpClient con Basic Auth
var credentials = Convert.ToBase64String(
    Encoding.ASCII.GetBytes($"{config.Username}:{config.ApiKey}"));
    
httpClient.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Basic", credentials);
```

### Request Format
```xml
<deployment>
  <branch>master</branch>
  <revision>deac8ba2675d6da4c8c9df4525da0a92fcea6c1a</revision>
  <environment>production</environment>
  <servers>app.myapp.com</servers>
</deployment>
```

### Response Format (HTTP 201 Created)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<deployments>
    <branch>master</branch>
    <revision>143b920</revision>
    <environment>OmintDigitalAPIBot</environment>
    <servers>vhlserver-01.omint.ad</servers>
</deployments>
```

## Configuración Extendida

### app_repos_config.json
```json
{
  "applications": {
    "AppName": {
      "repos": {
        // Configuración existente de repositorios
      },
      "codebase": {
        "project_id": "project-slug",
        "environment": "production",
        "branch": "master", 
        "servers": "server1.com,server2.com"
      }
    }
  },
  "settings": {
    "codebase": {
      "enabled": true,
      "api_url": "https://api3.codebasehq.com",
      "account": "account-name",
      "username": "${CODEBASE_USERNAME}",  // Variable de entorno
      "api_key": "${CODEBASE_API_KEY}"      // Variable de entorno
    }
  }
}
```

## Implementación del Cliente HTTP

### Configuración de HttpClient
```csharp
public class CodebaseService : ICodebaseService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<CodebaseService> _logger;
    
    public CodebaseService(HttpClient httpClient, IConfiguration config, ILogger<CodebaseService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        
        ConfigureHttpClient();
    }
    
    private void ConfigureHttpClient()
    {
        var codebaseConfig = _config.GetSection("settings:codebase");
        var username = Environment.GetEnvironmentVariable(codebaseConfig["username"]) 
                      ?? codebaseConfig["username"];
        var apiKey = Environment.GetEnvironmentVariable(codebaseConfig["api_key"]) 
                    ?? codebaseConfig["api_key"];
        
        // Configurar Basic Auth
        var credentials = Convert.ToBase64String(
            Encoding.ASCII.GetBytes($"{username}:{apiKey}"));
        
        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Basic", credentials);
        
        _httpClient.BaseAddress = new Uri(codebaseConfig["api_url"]);
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }
    
    public async Task<DeploymentResult> CreateDeploymentAsync(
        string projectId, 
        string repositoryId, 
        CodebaseDeployment deployment)
    {
        try
        {
            var account = _config["settings:codebase:account"];
            var url = $"/{account}/{projectId}/{repositoryId}/deployments";
            
            var content = new StringContent(
                deployment.ToXml(), 
                Encoding.UTF8, 
                "application/xml");
            
            var response = await _httpClient.PostAsync(url, content);
            
            var responseXml = await response.Content.ReadAsStringAsync();
            
            return new DeploymentResult
            {
                Success = response.StatusCode == HttpStatusCode.Created,
                HttpStatusCode = (int)response.StatusCode,
                ResponseXml = responseXml,
                Message = response.StatusCode == HttpStatusCode.Created 
                    ? "Deployment creado exitosamente" 
                    : $"Error: {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creando deployment en CodebaseHQ");
            return new DeploymentResult
            {
                Success = false,
                Message = ex.Message
            };
        }
    }
}
```

## Flujo de Integración

### 1. Post-Tagging Hook
```csharp
// Después de crear tags exitosamente
if (config.Settings.Codebase?.Enabled == true)
{
    foreach (var repo in taggedRepos)
    {
        try 
        {
            var deployment = new CodebaseDeployment
            {
                Branch = app.Codebase.Branch,
                Environment = app.Codebase.Environment,
                Servers = app.Codebase.Servers,
                Revision = repo.TagCommitSha
            };
            
            var result = await codebaseService.CreateDeploymentAsync(
                app.Codebase.ProjectId,
                repo.Name,
                deployment);
                
            if (result.Success)
            {
                logger.LogInformation($"✓ Deployment creado en CodebaseHQ: {repo.Name}");
                logger.LogDebug($"Response: {result.ResponseXml}");
            }
            else
            {
                logger.LogWarning($"✗ Deployment falló: {repo.Name} - {result.Message}");
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning($"Error creando deployment: {ex.Message}");
            // No fallar el proceso principal
        }
    }
}
```

### 2. Generación de Changelog
```csharp
// Buscar tag anterior y generar changelog
var previousTag = FindPreviousTag(currentTag);
if (previousTag != null)
{
    var changelog = await changelogService.GenerateChangelogAsync(
        repoPath, 
        previousTag, 
        currentTag);
    
    changelogService.DisplayChangelog(changelog);
    
    await changelogService.SaveChangelogAsync(
        changelog,
        applicationName,
        version);
}
```

## Manejo de Errores

- **201 Created**: Deployment creado exitosamente, respuesta contiene el mismo XML enviado
- **401 Unauthorized**: Credenciales inválidas (username o API key incorrectos)
- **404 Not Found**: Proyecto o repositorio no existe en CodebaseHQ
- **422 Unprocessable Entity**: Datos inválidos en el XML
- **500+ Server Error**: Error del servidor, reintentar con backoff
- **Timeout**: Excedido tiempo de espera (30s), log y continuar sin interrumpir el proceso