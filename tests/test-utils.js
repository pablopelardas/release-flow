import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

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
  openFolder: () => Promise.resolve({ filePaths: ['/mock/path'] }),
  showInExplorer: () => Promise.resolve({ success: true }),
  gitStatus: () => Promise.resolve({ status: 'clean' }),
  openFileDialog: () => Promise.resolve({ filePaths: ['/mock/file.txt'] }),
  saveFileDialog: () => Promise.resolve({ filePath: '/mock/save.txt' }),
  readFile: () => Promise.resolve({ success: true, content: 'mock content' }),
  writeFile: () => Promise.resolve({ success: true }),
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
