import { defineStore } from 'pinia'
import * as semver from 'semver'

export const useReleasesStore = defineStore('releases', {
  state: () => ({
    releases: [],
    currentRelease: null,
    releaseHistory: [],
    loading: false,
    error: null,
    wizardState: {
      currentStep: 1,
      totalSteps: 4,
      selectedRepository: null,
      versionType: 'minor',
      customVersion: '',
      selectedTemplate: null,
      releaseNotes: '',
      createTag: true,
      saveToFile: true,
      filePath: '',
    },
  }),

  getters: {
    releasesCount: (state) => state.releases.length,
    canProceedWizard: (state) => {
      switch (state.wizardState.currentStep) {
        case 1:
          return state.wizardState.selectedRepository !== null
        case 2:
          return state.wizardState.versionType !== null || state.wizardState.customVersion !== ''
        case 3:
          return state.wizardState.selectedTemplate !== null
        case 4:
          return true // Siempre puede proceder en el paso final
        default:
          return false
      }
    },
    nextVersion: (state) => {
      if (!state.wizardState.selectedRepository?.currentVersion) return '1.0.0'
      
      const currentVersion = state.wizardState.selectedRepository.currentVersion
      const versionType = state.wizardState.versionType
      
      if (state.wizardState.customVersion) {
        return state.wizardState.customVersion
      }
      
      try {
        return semver.inc(currentVersion, versionType) || '1.0.0'
      } catch (error) {
        console.error('Error calculating next version:', error)
        return '1.0.0'
      }
    },
    isWizardComplete: (state) => state.wizardState.currentStep >= state.wizardState.totalSteps,
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

    // Wizard Actions
    startWizard() {
      this.wizardState = {
        currentStep: 1,
        totalSteps: 4,
        selectedRepository: null,
        versionType: 'minor',
        customVersion: '',
        selectedTemplate: null,
        releaseNotes: '',
        createTag: true,
        saveToFile: true,
        filePath: '',
      }
    },

    nextStep() {
      if (this.canProceedWizard && this.wizardState.currentStep < this.wizardState.totalSteps) {
        this.wizardState.currentStep++
      }
    },

    previousStep() {
      if (this.wizardState.currentStep > 1) {
        this.wizardState.currentStep--
      }
    },

    setWizardRepository(repository) {
      this.wizardState.selectedRepository = repository
    },

    setWizardVersionType(versionType) {
      this.wizardState.versionType = versionType
      this.wizardState.customVersion = ''
    },

    setWizardCustomVersion(version) {
      this.wizardState.customVersion = version
      this.wizardState.versionType = null
    },

    setWizardTemplate(template) {
      this.wizardState.selectedTemplate = template
    },

    updateWizardOptions(options) {
      Object.assign(this.wizardState, options)
    },

    // Release Management
    async validateReleasePrerequisites(config) {
      this.clearError()
      
      try {
        const response = await window.electronAPI.releaseValidatePrerequisites(config)
        
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Error validating release prerequisites')
        }
      } catch (error) {
        console.error('Error validating release prerequisites:', error)
        this.setError(error.message)
        throw error
      }
    },

    async generateChangelog(config) {
      this.setLoading(true)
      this.clearError()
      
      try {
        const response = await window.electronAPI.releaseGenerateChangelog(config)
        
        if (response.success) {
          this.wizardState.releaseNotes = response.data.changelog || response.data
          return response.data
        } else {
          throw new Error(response.error || 'Error generating changelog')
        }
      } catch (error) {
        console.error('Error generating changelog:', error)
        this.setError(error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async createRelease(config) {
      this.setLoading(true)
      this.clearError()
      
      try {
        const response = await window.electronAPI.releaseCreate(config)
        
        if (response.success) {
          // Añadir a la lista de releases
          const newRelease = {
            id: Date.now(),
            version: config.version,
            repository: config.repository,
            notes: config.notes,
            tag: config.createTag ? `v${config.version}` : null,
            created_at: new Date().toISOString(),
            ...response.data,
          }
          
          this.releases.unshift(newRelease)
          this.currentRelease = newRelease
          
          return newRelease
        } else {
          throw new Error(response.error || 'Error creating release')
        }
      } catch (error) {
        console.error('Error creating release:', error)
        this.setError(error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async loadReleaseHistory(repoPath, limit = 10) {
      this.setLoading(true)
      this.clearError()
      
      try {
        const response = await window.electronAPI.releaseGetHistory(repoPath, limit)
        
        if (response.success) {
          this.releaseHistory = response.data || []
        } else {
          throw new Error(response.error || 'Error loading release history')
        }
      } catch (error) {
        console.error('Error loading release history:', error)
        this.setError(error.message)
      } finally {
        this.setLoading(false)
      }
    },

    async suggestNextVersion(repoPath, currentVersion) {
      this.clearError()
      
      try {
        const response = await window.electronAPI.releaseSuggestVersion(repoPath, currentVersion)
        
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.error || 'Error suggesting next version')
        }
      } catch (error) {
        console.error('Error suggesting next version:', error)
        this.setError(error.message)
        throw error
      }
    },

    // Utility Methods
    calculateVersionPreview(currentVersion, versionType) {
      if (!currentVersion) return '1.0.0'
      
      try {
        return semver.inc(currentVersion, versionType) || '1.0.0'
      } catch (error) {
        console.error('Error calculating version preview:', error)
        return '1.0.0'
      }
    },

    isValidVersion(version) {
      return semver.valid(version) !== null
    },

    compareVersions(version1, version2) {
      return semver.compare(version1, version2)
    },

    async saveReleaseToFile(release, filePath) {
      this.clearError()
      
      try {
        const content = `# Release ${release.version}

${release.notes}

---
Created: ${release.created_at}
Repository: ${release.repository}
${release.tag ? `Tag: ${release.tag}` : ''}
`
        
        const response = await window.electronAPI.writeFile(filePath, content)
        
        if (!response.success) {
          throw new Error(response.error || 'Error saving release to file')
        }
        
        return true
      } catch (error) {
        console.error('Error saving release to file:', error)
        this.setError(error.message)
        throw error
      }
    },

    resetWizard() {
      this.startWizard()
    },

    setCurrentRelease(release) {
      this.currentRelease = release
    },

    clearCurrentRelease() {
      this.currentRelease = null
    },
  },
})