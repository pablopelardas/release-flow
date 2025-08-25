import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

describe('Configuración de Electron', () => {
  test('main.js debe tener configuración básica de ventana', () => {
    const mainPath = path.join(process.cwd(), 'src/main/main.js')
    expect(existsSync(mainPath)).toBe(true)

    const mainContent = readFileSync(mainPath, 'utf-8')

    // Verificar imports básicos de Electron
    expect(mainContent).toContain('electron')
    expect(mainContent).toContain('BrowserWindow')
    expect(mainContent).toContain('app')

    // Verificar configuración de seguridad
    expect(mainContent).toContain('nodeIntegration: false')
    expect(mainContent).toContain('contextIsolation: true')
    expect(mainContent).toContain('preload:')
  })

  test('preload script debe implementar context bridge', () => {
    const preloadPath = path.join(process.cwd(), 'src/preload/preload.js')
    expect(existsSync(preloadPath)).toBe(true)

    const preloadContent = readFileSync(preloadPath, 'utf-8')

    // Verificar context bridge
    expect(preloadContent).toContain('contextBridge')
    expect(preloadContent).toContain('ipcRenderer')
    expect(preloadContent).toContain('exposeInMainWorld')
  })

  test('index.html debe tener estructura básica para Electron', () => {
    const indexPath = path.join(process.cwd(), 'index.html')
    expect(existsSync(indexPath)).toBe(true)

    const indexContent = readFileSync(indexPath, 'utf-8')

    // Verificar estructura HTML
    expect(indexContent).toContain('<!DOCTYPE html>')
    expect(indexContent).toContain('<html')
    expect(indexContent).toContain('<head>')
    expect(indexContent).toContain('<body>')
    expect(indexContent).toContain('<div id="app">')

    // Verificar meta tags de seguridad
    expect(indexContent).toContain('Content-Security-Policy')

    // Verificar script de Vue
    expect(indexContent).toContain('src/renderer/main.js')
  })

  test('vite.config.js debe existir con configuración para Electron', () => {
    const vitePath = path.join(process.cwd(), 'vite.config.js')
    expect(existsSync(vitePath)).toBe(true)

    const viteContent = readFileSync(vitePath, 'utf-8')

    // Verificar plugins básicos
    expect(viteContent).toContain('@vitejs/plugin-vue')
    expect(viteContent).toContain('vite-plugin-electron')
  })
})
