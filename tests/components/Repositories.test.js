import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import Repositories from '../../src/renderer/views/Repositories.vue'
import { globalMountOptions, setupTestEnvironment } from '../test-utils.js'

describe('Repositories Vista', () => {
  let wrapper

  beforeEach(() => {
    setupTestEnvironment()
    wrapper = mount(Repositories, globalMountOptions)
  })

  it('debe renderizar el componente correctamente', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('debe mostrar texto sobre repositorios', () => {
    expect(wrapper.text()).toContain('repositorios')
  })

  it('debe mostrar la descripción con Git', () => {
    expect(wrapper.text()).toContain('Git')
  })

  it('debe tener estructura HTML', () => {
    const content = wrapper.html()
    expect(content).toContain('class=')
  })

  it('debe tener texto descriptivo sobre repositorios Git', () => {
    expect(wrapper.text()).toContain('Git')
  })

  it('debe verificar propiedades básicas de data', () => {
    expect(wrapper.vm.repositories).toBeDefined()
    expect(Array.isArray(wrapper.vm.repositories)).toBe(true)
  })

  it('debe tener estructura HTML con elementos básicos', () => {
    const content = wrapper.html()
    expect(content).toContain('class=')
  })

  it('debe tener funciones definidas', () => {
    // Verificar que al menos algunas funciones existen
    expect(typeof wrapper.vm.addRepository).toBe('function')
  })

  it('debe tener estado para controlar diálogos', () => {
    expect(typeof wrapper.vm.showAddDialog).toBe('boolean')
  })
})
