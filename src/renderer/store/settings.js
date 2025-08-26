import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      // Tema y UI
      theme: 'light',
      language: 'es',

      // Comportamiento de la aplicación
      autoSave: true,
      autoSaveInterval: 30000, // 30 segundos
      notifications: true,
      confirmDestructiveActions: true,

      // Git y Repositorios
      defaultBranch: 'main',
      autoCommit: false,
      commitMessageTemplate: 'Release v{{version}}',

      // Templates
      defaultTemplateCategory: 'release',
      templatePreviewAutoRefresh: true,

      // Releases
      defaultVersionType: 'minor',
      autoCreateTags: true,
      tagPrefix: 'v',
      autoSaveReleaseNotes: true,

      // Paths y archivos
      defaultExportPath: '',
      backupEnabled: true,
      backupInterval: 86400000, // 24 horas
    },

    // CodebaseHQ configuration cache
    codebaseConfig: {
      accountName: null,
      username: null,
      apiKey: null,
      projectPermalink: null,
    },

    loading: false,
    error: null,
    unsavedChanges: false,
  }),

  getters: {
    isDarkTheme: (state) => state.settings.theme === 'dark',
    hasUnsavedChanges: (state) => state.unsavedChanges,
    
    // Check if CodebaseHQ is configured globally
    isCodebaseConfigured: (state) => {
      return !!(
        state.codebaseConfig.accountName &&
        state.codebaseConfig.username &&
        state.codebaseConfig.apiKey
      )
    },

    getSettingValue: (state) => (key) => {
      return key.split('.').reduce((obj, k) => obj?.[k], state.settings)
    },
  },

  actions: {
    setLoading(loading) {
      this.loading = loading
    },

    setError(error) {
      this.error = error
    },

    clearError() {
      this.error = null
    },

    async loadSettings() {
      this.setLoading(true)
      this.clearError()

      try {
        // Cargar todas las configuraciones desde la base de datos
        const response = await window.electronAPI.dbGetConfig('all')

        if (response.success && response.data.value) {
          const dbSettings = JSON.parse(response.data.value)
          this.settings = { ...this.settings, ...dbSettings }
        }
        
        // Also load CodebaseHQ configuration
        await this.loadCodebaseConfig()
      } catch (error) {
        console.error('Error loading settings:', error)
        // No es crítico si no se pueden cargar las configuraciones
        // Se usarán los valores por defecto
      } finally {
        this.setLoading(false)
      }
    },
    
    async loadCodebaseConfig() {
      try {
        const [accountName, username, apiKey, projectPermalink] = await Promise.all([
          window.electronAPI.dbGetConfig('codebase_account_name'),
          window.electronAPI.dbGetConfig('codebase_username'),
          window.electronAPI.dbGetConfig('codebase_api_key'),
          window.electronAPI.dbGetConfig('codebase_project_permalink'),
        ])
        
        this.codebaseConfig = {
          accountName: accountName?.success ? accountName.data?.value : null,
          username: username?.success ? username.data?.value : null,
          apiKey: apiKey?.success ? apiKey.data?.value : null,
          projectPermalink: projectPermalink?.success ? projectPermalink.data?.value : null,
        }
        
        console.log('[Settings] CodebaseHQ configured:', this.isCodebaseConfigured)
      } catch (error) {
        console.error('Error loading CodebaseHQ config:', error)
      }
    },

    async saveSetting(key, value) {
      this.clearError()

      try {
        // Actualizar en el estado local
        this.setSetting(key, value)

        // Guardar configuración específica
        const response = await window.electronAPI.dbSetConfig(key, JSON.stringify(value))

        if (!response.success) {
          throw new Error(response.error || 'Error saving setting')
        }

        this.unsavedChanges = false
      } catch (error) {
        console.error('Error saving setting:', error)
        this.setError(error.message)
        throw error
      }
    },

    async saveAllSettings() {
      this.setLoading(true)
      this.clearError()

      try {
        // Guardar todas las configuraciones como un objeto
        const response = await window.electronAPI.dbSetConfig('all', JSON.stringify(this.settings))

        if (response.success) {
          this.unsavedChanges = false
        } else {
          throw new Error(response.error || 'Error saving settings')
        }
      } catch (error) {
        console.error('Error saving all settings:', error)
        this.setError(error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    setSetting(key, value) {
      // Soporte para claves anidadas como 'ui.theme'
      const keys = key.split('.')
      let current = this.settings

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      this.unsavedChanges = true
    },

    toggleTheme() {
      const newTheme = this.settings.theme === 'light' ? 'dark' : 'light'
      this.saveSetting('theme', newTheme)
    },

    async resetSettings() {
      this.clearError()

      try {
        // Resetear al estado inicial
        const defaultSettings = {
          theme: 'light',
          language: 'es',
          autoSave: true,
          autoSaveInterval: 30000,
          notifications: true,
          confirmDestructiveActions: true,
          defaultBranch: 'main',
          autoCommit: false,
          commitMessageTemplate: 'Release v{{version}}',
          defaultTemplateCategory: 'release',
          templatePreviewAutoRefresh: true,
          defaultVersionType: 'minor',
          autoCreateTags: true,
          tagPrefix: 'v',
          autoSaveReleaseNotes: true,
          defaultExportPath: '',
          backupEnabled: true,
          backupInterval: 86400000,
        }

        this.settings = defaultSettings
        await this.saveAllSettings()
      } catch (error) {
        console.error('Error resetting settings:', error)
        this.setError(error.message)
        throw error
      }
    },

    async exportSettings(filePath) {
      this.clearError()

      try {
        const settingsJson = JSON.stringify(this.settings, null, 2)
        const response = await window.electronAPI.writeFile(filePath, settingsJson)

        if (!response.success) {
          throw new Error(response.error || 'Error exporting settings')
        }

        return true
      } catch (error) {
        console.error('Error exporting settings:', error)
        this.setError(error.message)
        throw error
      }
    },

    async importSettings(filePath) {
      this.clearError()

      try {
        const response = await window.electronAPI.readFile(filePath)

        if (response.success) {
          const importedSettings = JSON.parse(response.content)
          this.settings = { ...this.settings, ...importedSettings }
          await this.saveAllSettings()

          return true
        } else {
          throw new Error(response.error || 'Error reading settings file')
        }
      } catch (error) {
        console.error('Error importing settings:', error)
        this.setError(error.message)
        throw error
      }
    },

    // Watchers y auto-save
    setupAutoSave() {
      if (this.settings.autoSave && this.settings.autoSaveInterval > 0) {
        setInterval(() => {
          if (this.unsavedChanges) {
            this.saveAllSettings()
          }
        }, this.settings.autoSaveInterval)
      }
    },

    // Getters específicos para configuraciones comunes
    getTheme() {
      return this.settings.theme
    },

    getDefaultVersionType() {
      return this.settings.defaultVersionType
    },

    getTagPrefix() {
      return this.settings.tagPrefix
    },

    shouldAutoCreateTags() {
      return this.settings.autoCreateTags
    },

    shouldConfirmDestructiveActions() {
      return this.settings.confirmDestructiveActions
    },

    getCommitMessageTemplate() {
      return this.settings.commitMessageTemplate
    },
  },
})
