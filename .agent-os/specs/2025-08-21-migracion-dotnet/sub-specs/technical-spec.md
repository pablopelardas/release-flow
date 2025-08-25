# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-21-migracion-dotnet/spec.md

## Technical Requirements

### Solution Structure
- **Solution File**: ReleaseFlow.sln con múltiples proyectos organizados en carpetas lógicas
- **Main Project**: ReleaseFlow (Console Application, .NET 8.0)
- **Test Project**: ReleaseFlow.Tests (xUnit Test Project, .NET 8.0)
- **Directory Structure**: src/, tests/, docs/, con separación clara entre código y tests

### Architecture & Design Patterns
- **Layered Architecture**: Presentation → Business Logic → Data Access
- **Dependency Injection**: Microsoft.Extensions.DependencyInjection con interfaces para testabilidad
- **Repository Pattern**: Para operaciones Git abstractas y mockeables
- **Command Pattern**: Para encapsular operaciones de tagging complejas
- **Factory Pattern**: Para crear instancias de repositorios y services según configuración

### Core Components & Interfaces
- **IConfigurationService**: Parse y validación de app_repos_config.json
- **IGitRepository**: Abstracción para operaciones Git (tag, push, validate)
- **ITaggingService**: Lógica de negocio para coordinar tagging multi-repo
- **ILoggingService**: Logging estructurado con niveles configurables
- **IValidationService**: Validaciones de entrada y estado de repositorios

### Testing Strategy & Framework
- **Unit Testing**: xUnit con Moq para mocking de dependencias externas
- **Test Data Builders**: Para crear objetos de configuración y repos de prueba
- **In-Memory Git Repositories**: LibGit2Sharp con repos temporales para integration tests
- **Approval Tests**: Para validar output formatting vs script PowerShell
- **Parameterized Tests**: Para cubrir múltiples configuraciones de aplicaciones

### Error Handling & Logging
- **Structured Logging**: Serilog con output a Console y File
- **Custom Exceptions**: ReleaseFlowException hierarchy para diferentes tipos de errores
- **Validation Results**: Pattern Result<T> para operaciones que pueden fallar
- **Error Recovery**: Rollback parcial de operaciones Git en caso de fallas

### Performance & Quality Requirements
- **Startup Time**: < 2 segundos para aplicaciones con 10+ repositorios
- **Memory Usage**: < 100MB para operaciones típicas
- **Code Coverage**: Mínimo 90% líneas cubiertas por tests
- **Test Execution**: Suite completa en < 30 segundos
- **Static Analysis**: Sin warnings de nivel Error, máximo 5 warnings de Info

## External Dependencies

### Production Dependencies
- **LibGit2Sharp** (v0.30.0+) - Operaciones Git programáticas sin shell dependencies
  - **Justification**: Reemplaza comandos git shell con operaciones robustas y testeable
- **Microsoft.Extensions.DependencyInjection** (v8.0.0) - Container DI oficial de Microsoft
  - **Justification**: Arquitectura testeable con inversión de dependencias
- **Microsoft.Extensions.Configuration** (v8.0.0) - Configuration provider robusto
  - **Justification**: Manejo consistente de JSON config con binding automático
- **Serilog** (v3.0.0+) - Logging estructurado de alta performance
  - **Justification**: Logging más robusto que ILogger built-in, mejor para debugging

### Test Dependencies
- **xUnit** (v2.4.2+) - Framework de testing estándar para .NET
  - **Justification**: Ecosystem maduro, mejor integración con tooling .NET
- **Moq** (v4.20.0+) - Mocking framework para interfaces y dependencies
  - **Justification**: Permite testing aislado de componentes sin dependencias reales
- **FluentAssertions** (v6.12.0+) - Assertions legibles y descriptivas
  - **Justification**: Tests más mantenibles con mensajes de error claros
- **Microsoft.NET.Test.Sdk** (v17.8.0+) - SDK para ejecutar tests en CI/CD
  - **Justification**: Integración nativa con dotnet CLI y build systems

### Development Tools
- **Coverlet.Collector** (v6.0.0+) - Code coverage collection para CI/CD
  - **Justification**: Measurement automático de coverage sin overhead en producción