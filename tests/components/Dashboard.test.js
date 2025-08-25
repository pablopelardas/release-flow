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

  it('debe mostrar mensaje de bienvenida', () => {
    expect(wrapper.text()).toContain('Bienvenido a ReleaseFlow')
  })

  it('debe mostrar el título del dashboard', () => {
    expect(wrapper.text()).toContain('ReleaseFlow Dashboard')
  })

  it('debe mostrar texto descriptivo', () => {
    expect(wrapper.text()).toContain('Desktop')
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
