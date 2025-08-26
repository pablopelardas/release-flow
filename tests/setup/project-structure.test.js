import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

describe('Estructura del Proyecto', () => {
  test('package.json debe existir con configuración correcta', () => {
    const packagePath = path.join(process.cwd(), 'package.json')
    expect(existsSync(packagePath)).toBe(true)

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    // Verificar campos básicos
    expect(packageJson.name).toBe('releaseflow-electron')
    expect(packageJson.main).toBe('src/main/main.ts')
    expect(packageJson.description).toContain('ReleaseFlow Desktop')

    // Verificar scripts necesarios
    expect(packageJson.scripts).toHaveProperty('dev')
    expect(packageJson.scripts).toHaveProperty('build')
    expect(packageJson.scripts).toHaveProperty('electron')
    expect(packageJson.scripts).toHaveProperty('test')

    // Verificar dependencias core
    expect(packageJson.dependencies).toHaveProperty('vue')
    expect(packageJson.dependencies).toHaveProperty('vue-router')
    expect(packageJson.dependencies).toHaveProperty('pinia')

    // Verificar devDependencies de Electron y desarrollo
    expect(packageJson.devDependencies).toHaveProperty('electron')
    expect(packageJson.devDependencies).toHaveProperty('@vitejs/plugin-vue')
    expect(packageJson.devDependencies).toHaveProperty('vitest')
    expect(packageJson.devDependencies).toHaveProperty('typescript')
  })

  test('tsconfig.json debe existir con configuración TypeScript correcta', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    expect(existsSync(tsconfigPath)).toBe(true)

    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))

    // Verificar target y módulos
    expect(tsconfig.compilerOptions.target).toBe('ES2020')
    expect(tsconfig.compilerOptions.module).toBe('ESNext')
    expect(tsconfig.compilerOptions.strict).toBe(true)

    // Verificar paths de alias
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*')
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@main/*')
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@renderer/*')
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@preload/*')
  })

  test('estructura de carpetas debe existir según especificación', () => {
    const folders = ['src', 'src/main', 'src/renderer', 'src/preload', 'tests']

    folders.forEach((folder) => {
      const folderPath = path.join(process.cwd(), folder)
      expect(existsSync(folderPath), `La carpeta ${folder} debe existir`).toBe(true)
    })
  })

  test('archivos de configuración principales deben existir', () => {
    const configFiles = ['package.json', 'tsconfig.json', 'tsconfig.node.json', 'vitest.config.js']

    configFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file)
      expect(existsSync(filePath), `El archivo ${file} debe existir`).toBe(true)
    })
  })

  test('archivo main de Electron debe existir', () => {
    const mainPath = path.join(process.cwd(), 'src/main/main.ts')
    expect(existsSync(mainPath), 'src/main/main.ts debe existir').toBe(true)
  })

  test('archivo preload debe existir', () => {
    const preloadPath = path.join(process.cwd(), 'src/preload/preload.ts')
    expect(existsSync(preloadPath), 'src/preload/preload.ts debe existir').toBe(true)
  })

  test('archivo principal de Vue debe existir', () => {
    const appPath = path.join(process.cwd(), 'src/renderer/main.js')
    expect(existsSync(appPath), 'src/renderer/main.js debe existir').toBe(true)
  })

  test('archivo HTML principal debe existir', () => {
    const indexPath = path.join(process.cwd(), 'index.html')
    expect(existsSync(indexPath), 'index.html debe existir').toBe(true)
  })
})
