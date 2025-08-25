import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false,
    repositories: [],
    templates: [],
    releases: [],
    currentUser: null,
    settings: {
      theme: 'light',
      autoSave: true,
      notifications: true,
    },
  }),

  getters: {
    repositoriesCount: (state) => state.repositories.length,
    templatesCount: (state) => state.templates.length,
    releasesCount: (state) => state.releases.length,
    isDarkTheme: (state) => state.settings.theme === 'dark',
  },

  actions: {
    setLoading(loading) {
      this.loading = loading
    },

    async loadRepositories() {
      this.loading = true
      try {
        // TODO: Implementar carga desde API/DB
        this.repositories = []
      } catch (error) {
        console.error('Error loading repositories:', error)
      } finally {
        this.loading = false
      }
    },

    async loadTemplates() {
      this.loading = true
      try {
        // TODO: Implementar carga desde API/DB
        this.templates = []
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        this.loading = false
      }
    },

    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      // TODO: Persistir en base de datos local
    },
  },
})
