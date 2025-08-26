import { defineStore } from 'pinia'

export const useRepositoriesStore = defineStore('repositories', {
  state: () => ({
    repositories: [],
    currentRepository: null,
    loading: false,
    error: null,
  }),

  getters: {
    repositoriesCount: (state) => state.repositories.length,
    activeRepositories: (state) => state.repositories.filter((repo) => repo.active),
    getRepositoryById: (state) => (id) => state.repositories.find((repo) => repo.id === id),
    hasRepositories: (state) => state.repositories.length > 0,
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

    async loadRepositories(filters = { active: 1 }) {
      this.setLoading(true)
      this.clearError()

      try {
        const response = await window.electronAPI.dbListRepositories(filters)

        if (response.success) {
          this.repositories = response.data.repositories || []

          // Actualizar estado Git para repositorios que no tienen información
          for (const repo of this.repositories) {
            if (repo.current_branch === null || repo.is_clean === null) {
              // No esperar la respuesta para no bloquear la UI
              this.refreshRepositoryStatus(repo.id).catch((error) => {
                console.warn(`Failed to refresh status for ${repo.name}:`, error)
              })
            }
          }
        } else {
          throw new Error(response.error || 'Error loading repositories')
        }
      } catch (error) {
        console.error('Error loading repositories:', error)
        this.setError(error.message)
      } finally {
        this.setLoading(false)
      }
    },

    async addRepository(repositoryData) {
      this.setLoading(true)
      this.clearError()

      try {
        // Primero validar que sea un repositorio Git válido
        const validationResponse = await window.electronAPI.gitValidateRepository(
          repositoryData.path
        )

        if (!validationResponse.success || !validationResponse.data.isValid) {
          throw new Error(validationResponse.data?.message || 'No es un repositorio Git válido')
        }

        // Obtener información adicional del repositorio
        const statusResponse = await window.electronAPI.gitStatus(repositoryData.path)
        const branchResponse = await window.electronAPI.gitGetCurrentBranch(repositoryData.path)

        const enrichedRepoData = {
          ...repositoryData,
          current_branch: branchResponse.success ? branchResponse.data : 'main',
          is_clean: statusResponse.success ? statusResponse.data.isClean : false,
          active: 1,
          created_at: new Date().toISOString(),
        }

        // Insertar en la base de datos
        const response = await window.electronAPI.dbInsertRepository(enrichedRepoData)

        if (response.success) {
          // Recargar la lista completa desde la base de datos para asegurar consistencia
          await this.loadRepositories()

          // Encontrar el repositorio recién agregado
          const newRepo = this.repositories.find((repo) => repo.id === response.data.id)
          return newRepo
        } else {
          throw new Error(response.error || 'Error adding repository')
        }
      } catch (error) {
        console.error('Error adding repository:', error)
        this.setError(error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async updateRepository(id, updates) {
      this.clearError()

      try {
        const response = await window.electronAPI.dbUpdateRepository(id, updates)

        if (response.success) {
          // Actualizar en la lista local
          const index = this.repositories.findIndex((repo) => repo.id === id)
          if (index !== -1) {
            this.repositories[index] = { ...this.repositories[index], ...updates }
          }
        } else {
          throw new Error(response.error || 'Error updating repository')
        }
      } catch (error) {
        console.error('Error updating repository:', error)
        this.setError(error.message)
        throw error
      }
    },

    async deleteRepository(id) {
      this.clearError()

      try {
        const response = await window.electronAPI.dbDeleteRepository(id)

        if (response.success) {
          // Remover de la lista local
          const index = this.repositories.findIndex((repo) => repo.id === id)
          if (index !== -1) {
            this.repositories.splice(index, 1)
          }

          // Si era el repositorio actual, limpiar
          if (this.currentRepository?.id === id) {
            this.currentRepository = null
          }
        } else {
          throw new Error(response.error || 'Error deleting repository')
        }
      } catch (error) {
        console.error('Error deleting repository:', error)
        this.setError(error.message)
        throw error
      }
    },

    async refreshRepositoryStatus(repositoryId) {
      const repo = this.getRepositoryById(repositoryId)
      if (!repo) return

      try {
        const statusResponse = await window.electronAPI.gitStatus(repo.path)
        const branchResponse = await window.electronAPI.gitGetCurrentBranch(repo.path)

        const updates = {
          current_branch: branchResponse.success ? branchResponse.data : repo.current_branch,
          is_clean: statusResponse.success ? statusResponse.data.isClean : repo.is_clean,
          last_updated: new Date().toISOString(),
        }

        await this.updateRepository(repositoryId, updates)
      } catch (error) {
        console.error('Error refreshing repository status:', error)
        this.setError(error.message)
      }
    },

    setCurrentRepository(repository) {
      this.currentRepository = repository
    },

    clearCurrentRepository() {
      this.currentRepository = null
    },

    async openRepositoryInExplorer(repositoryPath) {
      try {
        const response = await window.electronAPI.showInExplorer(repositoryPath)
        if (!response.success) {
          throw new Error(response.error || 'Error opening repository in explorer')
        }
      } catch (error) {
        console.error('Error opening repository in explorer:', error)
        this.setError(error.message)
        throw error
      }
    },
  },
})
