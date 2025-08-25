const { app, BrowserWindow } = require('electron')
const path = require('path')

// Configuración de desarrollo
const isDev = process.env.NODE_ENV === 'development'

// Referencias globales de ventanas
let mainWindow

function createWindow() {
  // Crear ventana principal del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    titleBarStyle: 'default',
    show: false
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
    mainWindow.show()
  })

  // Limpiar referencia cuando se cierre
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

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

// Manejo de esquema de protocolo en macOS
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})