import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MainLayout from '../../src/renderer/layouts/MainLayout.vue'
import { globalMountOptions, setupTestEnvironment } from '../test-utils.js'

describe('MainLayout', () => {
  let wrapper

  beforeEach(() => {
    setupTestEnvironment()
    wrapper = mount(MainLayout, globalMountOptions)
  })

  it('debe renderizar el componente correctamente', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('debe mostrar el título de la aplicación', () => {
    expect(wrapper.text()).toContain('ReleaseFlow')
  })

  it('debe mostrar el título ReleaseFlow', () => {
    expect(wrapper.text()).toContain('ReleaseFlow')
    expect(wrapper.text()).toContain('Dashboard')
  })

  it('debe tener sidebar con navegación', () => {
    expect(wrapper.find('aside').exists()).toBe(true)
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('debe tener área de contenido principal', () => {
    expect(wrapper.find('main').exists()).toBe(true)
  })

  it('debe tener header con título de página', () => {
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('debe tener botón de toggle de tema', () => {
    const themeButton = wrapper.find('button')
    expect(themeButton.exists()).toBe(true)
  })

  it('debe calcular el título de página correctamente', () => {
    expect(wrapper.vm._pageTitle).toBe('Dashboard')
  })

  it('debe cambiar el tema al hacer toggle', async () => {
    const initialTheme = wrapper.vm.isDark
    await wrapper.vm._toggleTheme()
    expect(wrapper.vm.isDark).toBe(!initialTheme)
  })

  it('debe tener función de toggle de tema', () => {
    expect(wrapper.vm._toggleTheme).toBeDefined()
    expect(typeof wrapper.vm._toggleTheme).toBe('function')
  })

  it('debe inicializar correctamente el tema', () => {
    expect(wrapper.vm.isDark).toBeDefined()
    expect(typeof wrapper.vm.isDark).toBe('boolean')
  })

  it('debe tener estructura HTML completa', () => {
    const content = wrapper.html()
    expect(content).toContain('class=')
    expect(content).toContain('aside')
    expect(content).toContain('main')
  })

  it('debe tener estructura correcta del layout', () => {
    expect(wrapper.find('.flex.h-screen').exists()).toBe(true)
    expect(wrapper.find('aside.w-64').exists()).toBe(true)
    expect(wrapper.find('main.flex-1').exists()).toBe(true)
  })
})
