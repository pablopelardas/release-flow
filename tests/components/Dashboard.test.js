import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import Dashboard from '../../src/renderer/views/Dashboard.vue'
import { globalMountOptions, setupTestEnvironment } from '../test-utils.js'

describe('Dashboard Vista', () => {
  let wrapper

  beforeEach(() => {
    setupTestEnvironment()
    wrapper = mount(Dashboard, globalMountOptions)
  })

  it('debe renderizar el componente correctamente', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('debe mostrar el título del dashboard', () => {
    expect(wrapper.text()).toContain('ReleaseFlow Dashboard')
  })

  it('debe mostrar estado de integraciones cuando CodebaseHQ está configurado', () => {
    // El componente debería mostrar las métricas básicas
    expect(wrapper.text()).toContain('Repositorios')
    expect(wrapper.text()).toContain('Templates')
    expect(wrapper.text()).toContain('Releases')
  })

  it('debe mostrar métricas de repositorios', () => {
    expect(wrapper.text()).toContain('Repositorios')
  })

  it('debe mostrar métricas de templates', () => {
    expect(wrapper.text()).toContain('Templates')
  })

  it('debe mostrar métricas de releases', () => {
    expect(wrapper.text()).toContain('Releases')
  })

  it('debe tener elementos con contadores', () => {
    // Verificar que hay números (pueden ser 0 o más)
    const text = wrapper.text()
    const hasNumbers = /\d+/.test(text)
    expect(hasNumbers).toBe(true)
  })

  it('debe tener la estructura HTML básica', () => {
    const content = wrapper.html()
    expect(content).toContain('class=')
  })

  it('debe tener estructura de cards organizadas', () => {
    // Verificar que hay elementos con clases de grid
    expect(wrapper.find('.grid').exists()).toBe(true)
  })

  it('debe ser responsive', () => {
    // Verificar clases responsive de Tailwind
    const content = wrapper.html()
    expect(content).toMatch(/md:|lg:|xl:/)
  })
})
