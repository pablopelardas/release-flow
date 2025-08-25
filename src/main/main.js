import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de desarrollo
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Referencias globales de ventanas
let mainWindow

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
app.whenReady().then(() => {
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
