const { contextBridge, ipcRenderer } = require('electron')

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema de notificaciones
  notify: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Operaciones de archivos
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog-advanced', options),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  saveFile: (content) => ipcRenderer.invoke('save-file-dialog', content),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog-advanced', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // Sistema
  showInExplorer: (path) => ipcRenderer.invoke('show-in-explorer', path),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Operaciones Git
  gitStatus: (repoPath) => ipcRenderer.invoke('git-status', repoPath),
  gitValidateRepository: (repoPath) => ipcRenderer.invoke('git-validate-repository', repoPath),
  gitCreateTag: (repoPath, tagName, message) => ipcRenderer.invoke('git-create-tag', repoPath, tagName, message),
  gitGetTags: (repoPath, sortBySemver) => ipcRenderer.invoke('git-get-tags', repoPath, sortBySemver),
  gitCommit: (repoPath, message) => ipcRenderer.invoke('git-commit', repoPath, message),
  gitGetCurrentBranch: (repoPath) => ipcRenderer.invoke('git-get-current-branch', repoPath),
  gitIsClean: (repoPath) => ipcRenderer.invoke('git-is-clean', repoPath),

  // Template engine
  templateRender: (templateContent, data) => ipcRenderer.invoke('template-render', templateContent, data),
  templateValidate: (templateContent) => ipcRenderer.invoke('template-validate', templateContent),
  templatePreview: (templateContent, data) => ipcRenderer.invoke('template-preview', templateContent, data),
  templateSave: (templateData) => ipcRenderer.invoke('template-save', templateData),
  templateLoad: (templateId) => ipcRenderer.invoke('template-load', templateId),

  // Base de datos
  dbInsertRepository: (repoData) => ipcRenderer.invoke('db-insert-repository', repoData),
  dbListRepositories: (filters) => ipcRenderer.invoke('db-list-repositories', filters),
  dbUpdateRepository: (id, updates) => ipcRenderer.invoke('db-update-repository', id, updates),
  dbDeleteRepository: (id) => ipcRenderer.invoke('db-delete-repository', id),
  dbSaveTemplate: (templateData) => ipcRenderer.invoke('db-save-template', templateData),
  dbGetTemplates: (category) => ipcRenderer.invoke('db-get-templates', category),
  dbSetConfig: (key, value) => ipcRenderer.invoke('db-set-config', key, value),
  dbGetConfig: (key) => ipcRenderer.invoke('db-get-config', key),

  // Releases
  releaseValidatePrerequisites: (config) => ipcRenderer.invoke('release-validate-prerequisites', config),
  releaseGenerateChangelog: (config) => ipcRenderer.invoke('release-generate-changelog', config),
  releaseCreate: (config) => ipcRenderer.invoke('release-create', config),
  releaseGetHistory: (repoPath, limit) => ipcRenderer.invoke('release-get-history', repoPath, limit),
  releaseSuggestVersion: (repoPath, currentVersion) => ipcRenderer.invoke('release-suggest-version', repoPath, currentVersion),

  // Configuración
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),

  // Eventos del sistema
  onAppUpdate: (callback) => ipcRenderer.on('app-update-available', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})

// Información del entorno
contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
})
