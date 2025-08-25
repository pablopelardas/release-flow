import { describe, test, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

describe('Configuración de Vue 3', () => {
  test('main.js renderer debe configurar Vue correctamente', () => {
    const mainPath = path.join(process.cwd(), 'src/renderer/main.js')
    expect(existsSync(mainPath)).toBe(true)
    
    const mainContent = readFileSync(mainPath, 'utf-8')
    
    // Verificar imports de Vue 3
    expect(mainContent).toContain('createApp')
    expect(mainContent).toContain('vue')
    
    // Verificar Pinia store
    expect(mainContent).toContain('createPinia')
    expect(mainContent).toContain('pinia')
    
    // Verificar Vue Router
    expect(mainContent).toContain('router')
    
    // Verificar montaje de la app
    expect(mainContent).toContain('.mount(')
    expect(mainContent).toContain('#app')
  })
  
  test('App.vue debe existir con estructura básica', () => {
    const appPath = path.join(process.cwd(), 'src/renderer/App.vue')
    expect(existsSync(appPath)).toBe(true)
    
    const appContent = readFileSync(appPath, 'utf-8')
    
    // Verificar estructura de componente Vue
    expect(appContent).toContain('<template>')
    expect(appContent).toContain('<script')
    expect(appContent).toContain('<style')
    
    // Verificar router-view
    expect(appContent).toContain('router-view')
  })
  
  test('router/index.js debe configurar Vue Router', () => {
    const routerPath = path.join(process.cwd(), 'src/renderer/router/index.js')
    expect(existsSync(routerPath)).toBe(true)
    
    const routerContent = readFileSync(routerPath, 'utf-8')
    
    // Verificar configuración del router
    expect(routerContent).toContain('createRouter')
    expect(routerContent).toContain('createWebHashHistory')
    expect(routerContent).toContain('routes')
  })
  
  test('store/index.js debe configurar Pinia', () => {
    const storePath = path.join(process.cwd(), 'src/renderer/store/index.js')
    expect(existsSync(storePath)).toBe(true)
    
    const storeContent = readFileSync(storePath, 'utf-8')
    
    // Verificar configuración de Pinia
    expect(storeContent).toContain('defineStore')
    expect(storeContent).toContain('pinia')
  })
})