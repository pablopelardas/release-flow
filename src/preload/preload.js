const { contextBridge, ipcRenderer } = require('electron')

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema de notificaciones
  notify: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Operaciones de archivos
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (content) => ipcRenderer.invoke('save-file-dialog', content),
  
  // Operaciones Git
  gitStatus: (repoPath) => ipcRenderer.invoke('git-status', repoPath),
  gitCommit: (repoPath, message) => ipcRenderer.invoke('git-commit', repoPath, message),
  gitTag: (repoPath, tagName, message) => ipcRenderer.invoke('git-tag', repoPath, tagName, message),
  
  // Template engine
  renderTemplate: (template, data) => ipcRenderer.invoke('render-template', template, data),
  validateTemplate: (template) => ipcRenderer.invoke('validate-template', template),
  
  // Base de datos
  dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
  dbInsert: (table, data) => ipcRenderer.invoke('db-insert', table, data),
  dbUpdate: (table, id, data) => ipcRenderer.invoke('db-update', table, id, data),
  
  // Configuración
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  
  // Eventos del sistema
  onAppUpdate: (callback) => ipcRenderer.on('app-update-available', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})

// Información del entorno
contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0'
})