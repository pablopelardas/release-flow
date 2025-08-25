# Technical Stack

## Current Implementation (PowerShell)

- **Scripting Language:** PowerShell 7.0+
- **Configuration Format:** JSON
- **Version Control:** Git
- **Repository Management:** CodebaseHQ

## Target Implementation (Phase 1 - Migration)

### Application Layer
- **Application Framework:** .NET 8.0
- **Language:** C# 12
- **Project Type:** Console Application (initial) → WPF Desktop Application (future)
- **Dependency Injection:** Microsoft.Extensions.DependencyInjection
- **Configuration:** Microsoft.Extensions.Configuration (JSON, Environment Variables)

### Data & Storage
- **Configuration Storage:** JSON files (local)
- **Logging Storage:** File-based logs + Console output
- **Database System:** SQLite (future - for audit logs and history)

### External Integrations
- **Git Operations:** LibGit2Sharp
- **API Client:** RestSharp / HttpClient
- **JSON Processing:** System.Text.Json
- **API Integration:** CodebaseHQ REST API v3

### Testing & Quality
- **Unit Testing:** xUnit
- **Mocking:** Moq
- **Code Coverage:** Coverlet
- **Integration Testing:** TestContainers (for Git operations)

### Build & Deployment
- **Build System:** MSBuild / dotnet CLI
- **Package Manager:** NuGet
- **CI/CD Pipeline:** GitHub Actions / Azure DevOps (future)
- **Deployment Method:** Self-contained executable (.exe)
- **Installer:** WiX Toolset (future)

### Development Tools
- **IDE:** Visual Studio 2022 / Visual Studio Code
- **Version Control:** Git
- **Code Repository:** CodebaseHQ (internal)
- **Documentation:** Markdown + XML Documentation Comments

## Future Considerations (Phase 2+)

### Desktop GUI
- **UI Framework:** WPF with MVVM pattern
- **UI Component Library:** MahApps.Metro or ModernWpf
- **Icons:** FontAwesome or Material Design Icons
- **Themes:** Light/Dark mode support

### Cloud Integration (Optional Future)
- **Application Hosting:** Azure App Service (for web version)
- **Database Hosting:** Azure SQL Database
- **Asset Hosting:** Azure Blob Storage
- **Authentication:** Azure AD / OAuth 2.0

### Advanced Features
- **Message Queue:** RabbitMQ (for async operations)
- **Caching:** Redis (for API response caching)
- **Monitoring:** Application Insights
- **Container Support:** Docker (optional)