import { createPinia } from 'pinia'
import { vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

// Router mock básico
export const createMockRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
      {
        path: '/repositories',
        name: 'Repositories',
        component: { template: '<div>Repositories</div>' },
      },
      { path: '/templates', name: 'Templates', component: { template: '<div>Templates</div>' } },
      { path: '/releases', name: 'Releases', component: { template: '<div>Releases</div>' } },
    ],
  })
}

// Pinia mock
export const createMockPinia = () => {
  return createPinia()
}

// Global mount options
export const globalMountOptions = {
  global: {
    plugins: [createMockRouter(), createMockPinia()],
    stubs: {
      'router-link': true,
      'router-view': true,
      Button: true,
      Card: true,
      Dialog: true,
      InputText: true,
      Checkbox: true,
      ProgressBar: true,
      Splitter: true,
      SplitterPanel: true,
    },
  },
}

// Mock window.electronAPI
export const mockElectronAPI = {
  // File operations
  openFolder: () => Promise.resolve({ filePaths: ['/mock/path'] }),
  showInExplorer: () => Promise.resolve({ success: true }),
  openFileDialog: () => Promise.resolve({ filePaths: ['/mock/file.txt'] }),
  saveFileDialog: () => Promise.resolve({ filePath: '/mock/save.txt' }),
  readFile: () => Promise.resolve({ success: true, content: 'mock content' }),
  writeFile: () => Promise.resolve({ success: true }),

  // Git operations
  gitStatus: () => Promise.resolve({ success: true, data: { isClean: true, currentBranch: 'main' } }),
  gitValidateRepository: () => Promise.resolve({ success: true, data: { isValid: true } }),
  gitCreateTag: () => Promise.resolve({ success: true, data: { name: 'v1.0.0' } }),
  gitGetTags: () => Promise.resolve({ success: true, data: ['v1.0.0', 'v0.9.0'] }),
  gitCommit: () => Promise.resolve({ success: true, data: { commit: 'abc123' } }),
  gitGetCurrentBranch: () => Promise.resolve({ success: true, data: 'main' }),
  gitIsClean: () => Promise.resolve({ success: true, data: true }),

  // Template operations
  templateRender: () => Promise.resolve({ success: true, data: { output: 'Rendered template' } }),
  templateValidate: () => Promise.resolve({ success: true, data: { isValid: true } }),
  templatePreview: () => Promise.resolve({ success: true, data: { preview: 'Preview HTML' } }),
  templateSave: () => Promise.resolve({ success: true, data: { id: 1 } }),
  templateLoad: () => Promise.resolve({ success: true, data: { templates: [] } }),

  // Database operations
  dbInsertRepository: () => Promise.resolve({ success: true, data: { id: 1 } }),
  dbListRepositories: () => Promise.resolve({ success: true, data: { repositories: [] } }),
  dbUpdateRepository: () => Promise.resolve({ success: true, data: { changes: 1 } }),
  dbDeleteRepository: () => Promise.resolve({ success: true }),
  dbSaveTemplate: () => Promise.resolve({ success: true, data: { id: 1 } }),
  dbGetTemplates: () => Promise.resolve({ success: true, data: { templates: [] } }),
  dbSetConfig: () => Promise.resolve({ success: true }),
  dbGetConfig: () => Promise.resolve({ success: true, data: { value: 'test' } }),

  // Release operations
  releaseValidatePrerequisites: () => Promise.resolve({ success: true, data: { valid: true } }),
  releaseGenerateChangelog: () => Promise.resolve({ success: true, data: { changelog: 'Changelog' } }),
  releaseCreate: () => Promise.resolve({ success: true, data: { tag: 'v1.0.0' } }),
  releaseGetHistory: () => Promise.resolve({ success: true, data: [] }),
  releaseSuggestVersion: () => Promise.resolve({ success: true, data: '1.1.0' }),
}

// Setup function for tests
export const setupTestEnvironment = () => {
  Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
  })

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
  })

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
