import { readFile, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
// @ts-ignore - electron-squirrel-startup no tiene tipos TypeScript
import squirrelStartup from 'electron-squirrel-startup'
// @ts-ignore - usar autoUpdater de electron para Squirrel
import { autoUpdater } from 'electron'
import { CodebaseHQService } from './services/CodebaseHQService.js'
import { DatabaseService } from './services/DatabaseService.js'
// Importar servicios TypeScript
import { GitService } from './services/GitService.js'
import { JiraService } from './services/JiraService.js'
import { ReleaseService } from './services/ReleaseService.js'
import { TeamsService } from './services/TeamsService.js'
import { TemplateService } from './services/TemplateService.js'

// Manejar eventos de instalación/actualización de Squirrel
// Esto debe ocurrir antes de cualquier otra lógica
if (squirrelStartup) {
  console.log('Squirrel event handled, exiting...')
  app.quit()
}

// Función adicional para manejar eventos específicos de Squirrel
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false
  }

  const squirrelEvent = process.argv[1]
  console.log('Squirrel event:', squirrelEvent)

  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Instalar accesos directos, etc.
      // Salir inmediatamente después
      setTimeout(app.quit, 1000)
      return true

    case '--squirrel-uninstall':
      // Limpiar archivos de configuración, etc.
      setTimeout(app.quit, 1000)
      return true

    case '--squirrel-obsolete':
      // Se está reemplazando por una versión más nueva
      app.quit()
      return true

    default:
      return false
  }
}

// Verificar eventos de Squirrel antes de continuar
if (handleSquirrelEvent()) {
  // No continuar con la inicialización normal
}

// Para ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de desarrollo
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const isViteMode = process.env.NODE_ENV === 'development' // Solo para desarrollo con Vite server
const isDebugMode = process.env.ELECTRON_DEBUG === 'true'

// Configuración del Auto-Updater para Squirrel.Windows
if (!isDev && process.platform === 'win32') {
  try {
    // Configurar URL del servidor de actualizaciones
    const feedURL = 'http://localhost:3001/releases/'
    autoUpdater.setFeedURL({
      url: feedURL,
      headers: {
        'User-Agent': 'ReleaseFlow/1.0.0'
      }
    })
    
    console.log('Auto-updater configurado con URL:', feedURL)
    
    // Configurar eventos del updater
    autoUpdater.on('checking-for-update', () => {
      console.log('[AutoUpdater] Verificando actualizaciones...')
    })
    
    autoUpdater.on('update-available', () => {
      console.log('[AutoUpdater] ¡Actualización disponible!')
    })
    
    autoUpdater.on('update-not-available', () => {
      console.log('[AutoUpdater] No hay actualizaciones disponibles')
    })
    
    autoUpdater.on('error', (err) => {
      console.error('[AutoUpdater] Error:', err)
    })
    
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      console.log('[AutoUpdater] Actualización descargada:', releaseName)
      
      // Notificar al renderer
      if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', {
          version: releaseName
        })
        
        // Preguntar al usuario si quiere reiniciar
        const dialogOpts = {
          type: 'info' as const,
          buttons: ['Reiniciar', 'Más tarde'],
          title: 'Actualización disponible',
          message: releaseName ? `Una nueva versión ${releaseName} ha sido descargada.` : 'Una nueva versión ha sido descargada.',
          detail: '¿Desea reiniciar la aplicación para aplicar la actualización?'
        }
        
        dialog.showMessageBox(dialogOpts).then((returnValue) => {
          if (returnValue.response === 0) autoUpdater.quitAndInstall()
        })
      }
    })
  } catch (error) {
    console.error('[AutoUpdater] Error configurando:', error)
  }
}

// Función para obtener la ruta de la base de datos
function getDatabasePath(): string {
  if (isDev) {
    // En desarrollo: usar archivo en el directorio del proyecto
    return path.join(process.cwd(), 'releaseflow-dev.db')
  }

  // En producción: usar directorio de datos de usuario
  const userDataPath = app.getPath('userData')
  
  // Crear directorio si no existe
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  return path.join(userDataPath, 'releaseflow.db')
}

// Referencias globales de ventanas
let mainWindow: BrowserWindow | null = null

// Instancias de servicios
let gitService: GitService | null = null
let templateService: TemplateService | null = null
let releaseService: ReleaseService | null = null
let databaseService: DatabaseService | null = null
let codebaseHQService: CodebaseHQService | null = null
let teamsService: TeamsService | null = null
let jiraService: JiraService | null = null

function createWindow() {
  // Crear ventana principal del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    x: 100, // Posición específica
    y: 100,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    titleBarStyle: 'default',
    show: false, // No mostrar hasta que esté listo
  })

  // Cargar la aplicación
  if (isViteMode) {
    // Solo en desarrollo con Vite server
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // En producción o modo testing (npm run electron)
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    if (isDebugMode) {
      mainWindow.webContents.openDevTools()
    }
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Limpiar referencia cuando se cierre
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Banderas para WSL y mejor compatibilidad
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-features=VizDisplayCompositor')

// Este método se llamará cuando Electron haya terminado de inicializarse
app.whenReady().then(async () => {
  // Inicializar servicios primero
  const servicesInitialized = await initializeServices()
  if (!servicesInitialized) {
    console.error('No se pudieron inicializar los servicios')
    // Continuar con la app pero sin servicios
  }

  createWindow()

  // Verificar actualizaciones después de crear la ventana
  if (!isDev) {
    // Esperar un poco antes de verificar actualizaciones
    setTimeout(() => {
      console.log('[AutoUpdater] Verificando actualizaciones automáticamente...')
      autoUpdater.checkForUpdates()
    }, 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers para diálogos
ipcMain.handle('open-folder-dialog', async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar Repositorio Git',
  })
  return result
})

ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Seleccionar Archivos',
  })
  return result
})

// Handler avanzado para diálogo de abrir archivo con opciones
ipcMain.handle('open-file-dialog-advanced', async (_event, options = {}) => {
  if (!mainWindow) return { canceled: true, filePaths: [] }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: options.title || 'Seleccionar Archivo',
    filters: options.filters || [{ name: 'Todos los archivos', extensions: ['*'] }],
    ...options,
  })
  return result
})

// Handler avanzado para diálogo de guardar archivo con opciones
ipcMain.handle('save-file-dialog-advanced', async (_event, options = {}) => {
  if (!mainWindow) return { canceled: true, filePath: '' }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Guardar Archivo',
    defaultPath: options.defaultPath || 'document.txt',
    filters: options.filters || [{ name: 'Todos los archivos', extensions: ['*'] }],
    ...options,
  })
  return result
})

// Handler para leer archivo del disco
ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    const content = await readFile(filePath, 'utf8')
    return { success: true, content }
  } catch (error) {
    console.error('Error reading file:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Handler para escribir archivo al disco
ipcMain.handle('write-file', async (_event, filePath, content) => {
  try {
    await writeFile(filePath, content, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error writing file:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Handler para obtener información de la base de datos
ipcMain.handle('database-get-info', async (event) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    
    const dbPath = getDatabasePath()
    const userDataPath = app.getPath('userData')
    
    return {
      success: true,
      data: {
        databasePath: dbPath,
        userDataPath: userDataPath,
        isDevelopment: isDev,
        databaseExists: fs.existsSync(dbPath),
        databaseSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0
      }
    }
  } catch (error) {
    console.error('Error al obtener info de base de datos:', error)
    return { 
      success: false, 
      error: `Error: ${(error as Error).message}` 
    }
  }
})

// Handler para abrir carpeta en explorador
ipcMain.handle('show-in-explorer', async (_event, folderPath) => {
  try {
    await shell.showItemInFolder(folderPath)
    return { success: true }
  } catch (error) {
    console.error('Error opening folder:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Handler para abrir URLs externas
ipcMain.handle('open-external', async (_event, url) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Error opening external URL:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Función para inicializar servicios
async function initializeServices() {
  try {
    // Inicializar servicios
    gitService = new GitService()
    templateService = new TemplateService()

    // Inicializar base de datos con ruta correcta según el entorno
    const dbPath = getDatabasePath()
    console.log(`[DatabaseService] Usando base de datos en: ${dbPath}`)
    databaseService = new DatabaseService(dbPath)

    // Inicializar la base de datos
    try {
      databaseService.initialize()
    } catch (error) {
      console.warn('Warning: Could not initialize database:', error)
    }

    // Inicializar ReleaseService sin dependencias
    releaseService = new ReleaseService()

    // Inicializar CodebaseHQService
    codebaseHQService = new CodebaseHQService()
    // Inicializar TeamsService
    teamsService = new TeamsService()

    // Inicializar JiraService
    jiraService = new JiraService(databaseService)
    await jiraService.initialize()

    console.log('Servicios inicializados correctamente')
    return true
  } catch (error) {
    console.error('Error inicializando servicios:', error)
    return false
  }
}

// ===== HANDLERS IPC PARA SERVICIOS =====

// Git Service Handlers
ipcMain.handle('git-status', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getStatus(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-validate-repository', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.validateRepository(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-validate-repository:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-create-tag', async (_event, repoPath, tagName, message) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.createTag(repoPath, tagName, message)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-create-tag:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-tags', async (_event, repoPath, sortBySemver = true, tagPrefix) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getTags(repoPath, sortBySemver, tagPrefix)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-tags:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-tags-with-details', async (_event, repoPath, sortBySemver = true, tagPrefix) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getTagsWithDetails(repoPath, sortBySemver, tagPrefix)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-tags-with-details:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-commits-between-tags', async (_event, repoPath, fromTag, toTag) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getCommitsBetweenTags(repoPath, fromTag, toTag)
    return { success: true, data: { commits: result } }
  } catch (error) {
    console.error('Error en git-get-commits-between-tags:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-latest-tag', async (_event, repoPath, tagPrefix) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getLatestTag(repoPath, tagPrefix)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-latest-tag:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-commit', async (_event, repoPath, message) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.commitChanges(repoPath, message)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-commit:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-current-branch', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getCurrentBranch(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-current-branch:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-is-clean', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.isClean(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-is-clean:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-commits', async (_event, repoPath, limit = 50) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getCommits(repoPath, limit)
    return result
  } catch (error) {
    console.error('Error en git-get-commits:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-commits-since-last-tag', async (_event, repoPath, tagPrefix) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getCommitsSinceLastTag(repoPath, tagPrefix)
    return result
  } catch (error) {
    console.error('Error en git-get-commits-since-last-tag:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle(
  'git-get-commits-for-release-type',
  async (_event, repoPath, currentVersion, releaseType, tagPrefix) => {
    try {
      if (!gitService) throw new Error('GitService no inicializado')
      const result = await gitService.getCommitsForReleaseType(
        repoPath,
        currentVersion,
        releaseType,
        tagPrefix
      )
      return result
    } catch (error) {
      console.error('Error en git-get-commits-for-release-type:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
)

ipcMain.handle('git-extract-collaborators', async (_event, commits) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const collaborators = gitService.extractCollaborators(commits)
    return { success: true, data: collaborators }
  } catch (error) {
    console.error('Error en git-extract-collaborators:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-push-tags', async (_event, repoPath, remote = 'origin') => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.pushTags(repoPath, remote)
    return result
  } catch (error) {
    console.error('Error en git-push-tags:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-get-remotes', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getRemotes(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-remotes:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('git-validate-for-release', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.validateRepositoryForRelease(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-validate-for-release:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Template Service Handlers
ipcMain.handle('template-render', async (_event, templateContent, data) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.renderTemplate(templateContent, data)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-render:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('template-validate', async (_event, templateContent) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.validateTemplate(templateContent)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-validate:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('template-preview', async (_event, templateContent, data) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.previewTemplate(templateContent, data)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-preview:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('template-save', async (_event, templateId, templateData) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.saveTemplate(templateId, templateData)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-save:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('template-load', async (_event, templateId) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.loadTemplate(templateId)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-load:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Database Service Handlers
ipcMain.handle('db-insert-repository', async (_event, repoData) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.insertRepository(repoData)
    return result // El método ya devuelve la estructura correcta
  } catch (error) {
    console.error('Error en db-insert-repository:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-list-repositories', async (_event, filters) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.listRepositories(filters)
    return result // El método ya devuelve la estructura correcta
  } catch (error) {
    console.error('Error en db-list-repositories:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-update-repository', async (_event, id, updates) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.updateRepository(id, updates)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-update-repository:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-delete-repository', async (_event, id) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.deleteRepository(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-delete-repository:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-save-template', async (_event, templateData) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.saveTemplate(templateData)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-save-template:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-get-templates', async (_event, category) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    console.log(`[IPC] db-get-templates called with category: ${category}`)
    const result = await databaseService.getTemplatesByCategory(category)
    console.log(`[IPC] db-get-templates result:`, result)
    return result
  } catch (error) {
    console.error('Error en db-get-templates:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-delete-template', async (_event, id) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.deleteTemplate(id)
    return result
  } catch (error) {
    console.error('Error en db-delete-template:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-set-config', async (_event, key, value) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.setConfig(key, value)
    return result
  } catch (error) {
    console.error('Error en db-set-config:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-get-config', async (_event, key) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.getConfig(key)
    return result
  } catch (error) {
    console.error('Error en db-get-config:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Release Database Handlers
ipcMain.handle('db-insert-release', async (_event, releaseData) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.insertReleaseData(releaseData)
    return result
  } catch (error) {
    console.error('Error en db-insert-release:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-list-releases', async (_event) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.listAllReleases()
    return result
  } catch (error) {
    console.error('Error en db-list-releases:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Repository Relationships Handlers
ipcMain.handle('db-get-secondary-repositories', async (_event, mainRepoId) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.getSecondaryRepositories(mainRepoId)
    return result
  } catch (error) {
    console.error('Error en db-get-secondary-repositories:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-get-main-repositories', async (_event) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.getMainRepositories()
    return result
  } catch (error) {
    console.error('Error en db-get-main-repositories:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-get-available-secondary-repositories', async (_event, excludeMainRepoId) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.getAvailableSecondaryRepositories(excludeMainRepoId)
    return result
  } catch (error) {
    console.error('Error en db-get-available-secondary-repositories:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('db-update-secondary-repositories', async (_event, mainRepoId, secondaryRepoIds) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')

    console.log('IPC Handler - Update secondary repositories:', {
      mainRepoId: `${typeof mainRepoId} ${mainRepoId}`,
      secondaryRepoIds: Array.isArray(secondaryRepoIds)
        ? secondaryRepoIds.map((id) => `${typeof id} ${id}`)
        : secondaryRepoIds,
    })

    const result = await databaseService.updateSecondaryRepositories(
      Number(mainRepoId),
      secondaryRepoIds.map((id) => Number(id))
    )
    return result
  } catch (error) {
    console.error('Error en db-update-secondary-repositories:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Release Service Handlers
ipcMain.handle('release-validate-prerequisites', async (_event, repoPath, expectedBranch) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.validateReleasePrerequisites(repoPath, expectedBranch)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-validate-prerequisites:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('release-generate-changelog', async (_event, releaseData, template) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.generateChangelog(releaseData, template)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-generate-changelog:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('release-create', async (_event, config) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.createRelease(config)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-create:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('release-get-history', async (_event, repoPath, limit) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.getReleaseHistory(repoPath, limit)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-get-history:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('release-suggest-version', async (_event, repoPath, currentVersion) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.suggestNextVersion(repoPath, currentVersion)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-suggest-version:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Manejadores IPC para changelog unificado
ipcMain.handle(
  'release-collect-multi-repository-data',
  async (_event, mainRepoId, mainRepoName, mainRepoPath, mainRepoTagPrefix, secondaryRepositories, targetVersion) => {
    try {
      if (!releaseService) throw new Error('ReleaseService no inicializado')
      const result = await releaseService.collectMultiRepositoryData(
        mainRepoId,
        mainRepoName,
        mainRepoPath,
        mainRepoTagPrefix,
        secondaryRepositories,
        targetVersion
      )
      return { success: true, data: result }
    } catch (error) {
      console.error('Error en release-collect-multi-repository-data:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
)

ipcMain.handle('release-generate-unified-changelog', async (_event, unifiedData, templateOrId) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.generateUnifiedChangelog(unifiedData, templateOrId)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-generate-unified-changelog:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// CodebaseHQ Service Handlers
ipcMain.handle('codebase-create-deployment', async (_event, config, deployment) => {
  try {
    if (!codebaseHQService) throw new Error('CodebaseHQService no inicializado')
    const result = await codebaseHQService.createDeployment(config, deployment)
    return result
  } catch (error) {
    console.error('Error en codebase-create-deployment:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('codebase-test-connection', async (_event, config) => {
  try {
    if (!codebaseHQService) throw new Error('CodebaseHQService no inicializado')
    const result = await codebaseHQService.testConnection(config)
    return result
  } catch (error) {
    console.error('Error en codebase-test-connection:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('codebase-validate-config', async (_event, config) => {
  try {
    if (!codebaseHQService) throw new Error('CodebaseHQService no inicializado')
    const result = codebaseHQService.validateConfig(config)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en codebase-validate-config:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('codebase-get-deployments', async (_event, config) => {
  try {
    if (!codebaseHQService) throw new Error('CodebaseHQService no inicializado')
    const result = await codebaseHQService.getDeployments(config)
    return result
  } catch (error) {
    console.error('Error en codebase-get-deployments:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('codebase-get-activity', async (_event, config, page) => {
  try {
    if (!codebaseHQService) throw new Error('CodebaseHQService no inicializado')
    const result = await codebaseHQService.getActivity(config, page)
    return result
  } catch (error) {
    console.error('Error en codebase-get-activity:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Teams Service Handlers
ipcMain.handle('teams-send-release-notification', async (_event, config, notification) => {
  try {
    if (!teamsService) throw new Error('TeamsService no inicializado')
    const result = await teamsService.sendReleaseNotification(config, notification)
    return result
  } catch (error) {
    console.error('Error en teams-send-release-notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('teams-test-connection', async (_event, config) => {
  try {
    if (!teamsService) throw new Error('TeamsService no inicializado')
    const result = await teamsService.testConnection(config)
    return result
  } catch (error) {
    console.error('Error en teams-test-connection:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('teams-validate-config', async (_event, config) => {
  try {
    if (!teamsService) throw new Error('TeamsService no inicializado')
    const result = teamsService.validateConfig(config)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en teams-validate-config:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// JIRA Service Handlers
ipcMain.handle('jira-test-connection', async (_event) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const result = await jiraService.testConnection()
    return result
  } catch (error) {
    console.error('Error en jira-test-connection:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('jira-get-config', async (_event) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const config = jiraService.getConfig()
    return {
      success: true,
      data: {
        enabled: jiraService.isEnabled(),
        config: config
          ? {
              baseUrl: config.baseUrl,
              username: config.username,
              projectKey: config.projectKey,
              hasApiToken: !!config.apiToken,
            }
          : null,
      },
    }
  } catch (error) {
    console.error('Error en jira-get-config:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('jira-find-issues-from-commits', async (_event, commits) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const result = await jiraService.findIssuesFromCommits(commits)
    return result
  } catch (error) {
    console.error('Error en jira-find-issues-from-commits:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('jira-search-issues', async (_event, jql, maxResults) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const result = await jiraService.searchIssues(jql, maxResults)
    return result
  } catch (error) {
    console.error('Error en jira-search-issues:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('jira-create-version', async (_event, versionData) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const result = await jiraService.createVersion(versionData)
    return result
  } catch (error) {
    console.error('Error en jira-create-version:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('jira-get-project-versions', async (_event, projectKey) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const result = await jiraService.getProjectVersions(projectKey)
    return result
  } catch (error) {
    console.error('Error en jira-get-project-versions:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle(
  'jira-create-release-with-issues',
  async (_event, versionName, commits, releaseNotes, releaseDate) => {
    try {
      if (!jiraService) throw new Error('JiraService no inicializado')
      const result = await jiraService.createReleaseWithIssues(
        versionName,
        commits,
        releaseNotes,
        releaseDate
      )
      return result
    } catch (error) {
      console.error('Error en jira-create-release-with-issues:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
)

ipcMain.handle('jira-add-issues-fix-version', async (_event, issueKeys, versionId) => {
  try {
    if (!jiraService) throw new Error('JiraService no inicializado')
    const result = await jiraService.addIssuesFixVersion(issueKeys, versionId)
    return result
  } catch (error) {
    console.error('Error en jira-add-issues-fix-version:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// File system operations
ipcMain.handle('show-save-dialog', async (_event, options) => {
  try {
    const result = await dialog.showSaveDialog(options)
    return result
  } catch (error) {
    console.error('Error en show-save-dialog:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})


// Debug handlers
ipcMain.handle('db-get-table-structure', async (_event) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = databaseService.getTableStructure()
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-get-table-structure:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

// Auto-updater handlers
ipcMain.handle('app-check-for-updates', async () => {
  if (isDev) {
    return { success: false, error: 'Actualizaciones no disponibles en desarrollo' }
  }
  
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, data: result }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('app-restart-and-install-update', async () => {
  if (isDev) {
    return { success: false, error: 'Actualizaciones no disponibles en desarrollo' }
  }
  
  try {
    autoUpdater.quitAndInstall()
    return { success: true }
  } catch (error) {
    console.error('Error installing update:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})

ipcMain.handle('app-get-version', async () => {
  try {
    return { success: true, data: { version: app.getVersion() } }
  } catch (error) {
    console.error('Error getting app version:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
})
