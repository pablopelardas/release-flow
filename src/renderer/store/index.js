import { defineStore } from 'pinia'

// Store principal de la aplicación para estado global
export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false,
    error: null,
    currentUser: null,
    appVersion: '1.0.0',
    isOnline: true,
    lastActivity: null,
    notifications: [],
  }),

  getters: {
    hasError: (state) => state.error !== null,
    hasNotifications: (state) => state.notifications.length > 0,
    unreadNotifications: (state) => state.notifications.filter(n => !n.read),
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

    addNotification(notification) {
      const newNotification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        type: 'info',
        ...notification,
      }
      
      this.notifications.unshift(newNotification)
      
      // Limitar a 50 notificaciones
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(0, 50)
      }
    },

    markNotificationAsRead(id) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },

    clearNotifications() {
      this.notifications = []
    },

    updateLastActivity() {
      this.lastActivity = new Date().toISOString()
    },

    async initializeApp() {
      this.setLoading(true)
      this.clearError()
      
      try {
        // Inicializar todos los stores necesarios
        const { useSettingsStore } = await import('./settings.js')
        const { useRepositoriesStore } = await import('./repositories.js')
        const { useTemplatesStore } = await import('./templates.js')
        
        const settingsStore = useSettingsStore()
        const repositoriesStore = useRepositoriesStore()
        const templatesStore = useTemplatesStore()
        
        // Cargar configuraciones primero
        await settingsStore.loadSettings()
        
        // Configurar auto-save
        settingsStore.setupAutoSave()
        
        // Cargar datos iniciales en paralelo
        await Promise.all([
          repositoriesStore.loadRepositories(),
          templatesStore.loadTemplates(),
          templatesStore.loadPredefinedTemplates(),
        ])
        
        this.addNotification({
          type: 'success',
          title: 'Aplicación iniciada',
          message: 'ReleaseFlow se ha inicializado correctamente',
        })
        
      } catch (error) {
        console.error('Error initializing app:', error)
        this.setError(error.message)
        
        this.addNotification({
          type: 'error',
          title: 'Error de inicialización',
          message: 'Hubo un problema al inicializar la aplicación',
        })
      } finally {
        this.setLoading(false)
        this.updateLastActivity()
      }
    },

    async handleGlobalError(error, context = 'Unknown') {
      console.error(`Global error in ${context}:`, error)
      
      this.setError(error.message || 'Error desconocido')
      
      this.addNotification({
        type: 'error',
        title: `Error en ${context}`,
        message: error.message || 'Ha ocurrido un error inesperado',
      })
    },
  },
})

// Re-exportar todos los stores para fácil acceso
export { useRepositoriesStore } from './repositories.js'
export { useTemplatesStore } from './templates.js'
export { useReleasesStore } from './releases.js'
export { useSettingsStore } from './settings.js'
