import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'

// Importar servicios
import { GitService } from './services/GitService.ts'
import { TemplateService } from './services/TemplateService.ts'
import { ReleaseService } from './services/ReleaseService.ts'
import { DatabaseService } from './services/DatabaseService.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de desarrollo
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Referencias globales de ventanas
let mainWindow

// Instancias de servicios
let gitService
let templateService 
let releaseService
let databaseService

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
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload.js'),
      // Opciones para WSL
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    titleBarStyle: 'default',
    show: false, // No mostrar hasta que esté listo
  })

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow.show()
    mainWindow.focus()
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
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar Repositorio Git',
  })
  return result
})

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Seleccionar Archivos',
  })
  return result
})

// Handler avanzado para diálogo de abrir archivo con opciones
ipcMain.handle('open-file-dialog-advanced', async (_event, options = {}) => {
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
    return { success: false, error: error.message }
  }
})

// Handler para escribir archivo al disco
ipcMain.handle('write-file', async (_event, filePath, content) => {
  try {
    await writeFile(filePath, content, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error writing file:', error)
    return { success: false, error: error.message }
  }
})

// Handler para abrir carpeta en explorador
ipcMain.handle('show-in-explorer', async (_event, folderPath) => {
  try {
    await shell.showItemInFolder(folderPath)
    return { success: true }
  } catch (error) {
    console.error('Error opening folder:', error)
    return { success: false, error: error.message }
  }
})

// Handler para abrir URLs externas
ipcMain.handle('open-external', async (_event, url) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Error opening external URL:', error)
    return { success: false, error: error.message }
  }
})

// Función para inicializar servicios
async function initializeServices() {
  try {
    // Inicializar servicios
    gitService = new GitService()
    templateService = new TemplateService()
    
    // Inicializar base de datos
    const dbPath = isDev ? ':memory:' : path.join(__dirname, '../../data/releaseflow.db')
    databaseService = new DatabaseService(dbPath)
    await databaseService.initialize()
    
    // Inicializar ReleaseService con dependencias
    releaseService = new ReleaseService(gitService, templateService)
    
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
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git-validate-repository', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.validateRepository(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-validate-repository:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git-create-tag', async (_event, repoPath, tagName, message) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.createTag(repoPath, tagName, message)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-create-tag:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git-get-tags', async (_event, repoPath, sortBySemver = true) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getTags(repoPath, sortBySemver)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-tags:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git-commit', async (_event, repoPath, message) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.commitChanges(repoPath, message)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-commit:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git-get-current-branch', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.getCurrentBranch(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-get-current-branch:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git-is-clean', async (_event, repoPath) => {
  try {
    if (!gitService) throw new Error('GitService no inicializado')
    const result = await gitService.isClean(repoPath)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en git-is-clean:', error)
    return { success: false, error: error.message }
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
    return { success: false, error: error.message }
  }
})

ipcMain.handle('template-validate', async (_event, templateContent) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.validateTemplate(templateContent)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-validate:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('template-preview', async (_event, templateContent, data) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.previewTemplate(templateContent, data)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-preview:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('template-save', async (_event, templateData) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.saveTemplate(templateData)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-save:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('template-load', async (_event, templateId) => {
  try {
    if (!templateService) throw new Error('TemplateService no inicializado')
    const result = await templateService.loadTemplate(templateId)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en template-load:', error)
    return { success: false, error: error.message }
  }
})

// Database Service Handlers
ipcMain.handle('db-insert-repository', async (_event, repoData) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.insertRepository(repoData)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-insert-repository:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-list-repositories', async (_event, filters) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.listRepositories(filters)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-list-repositories:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-update-repository', async (_event, id, updates) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.updateRepository(id, updates)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-update-repository:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-delete-repository', async (_event, id) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.deleteRepository(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-delete-repository:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-save-template', async (_event, templateData) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.saveTemplate(templateData)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-save-template:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-get-templates', async (_event, category) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.getTemplatesByCategory(category)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-get-templates:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-set-config', async (_event, key, value) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.setConfig(key, value)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-set-config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-get-config', async (_event, key) => {
  try {
    if (!databaseService) throw new Error('DatabaseService no inicializado')
    const result = await databaseService.getConfig(key)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en db-get-config:', error)
    return { success: false, error: error.message }
  }
})

// Release Service Handlers
ipcMain.handle('release-validate-prerequisites', async (_event, config) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.validateReleasePrerequisites(config)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-validate-prerequisites:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('release-generate-changelog', async (_event, config) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.generateChangelog(config)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-generate-changelog:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('release-create', async (_event, config) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.createRelease(config)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-create:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('release-get-history', async (_event, repoPath, limit) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.getReleaseHistory(repoPath, limit)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-get-history:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('release-suggest-version', async (_event, repoPath, currentVersion) => {
  try {
    if (!releaseService) throw new Error('ReleaseService no inicializado')
    const result = await releaseService.suggestNextVersion(repoPath, currentVersion)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error en release-suggest-version:', error)
    return { success: false, error: error.message }
  }
})
