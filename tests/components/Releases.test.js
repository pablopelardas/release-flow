import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import Releases from '../../src/renderer/views/Releases.vue'
import { globalMountOptions, setupTestEnvironment } from '../test-utils.js'

describe('Releases Vista', () => {
  let wrapper

  beforeEach(() => {
    setupTestEnvironment()
    wrapper = mount(Releases, globalMountOptions)
  })

  it('debe renderizar el componente correctamente', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('debe mostrar el título principal', () => {
    expect(wrapper.text()).toContain('Generación de Releases')
  })

  it('debe mostrar la descripción', () => {
    expect(wrapper.text()).toContain('Crea releases automáticos con templates personalizados')
  })

  it('debe tener botones en el template', () => {
    // Como los botones están stubbed, verificamos que hay contenido HTML
    const content = wrapper.html()
    expect(content).toContain('button')
  })

  it('debe tener estructura de layout', () => {
    // Verificar que hay elementos con clases de Tailwind
    const content = wrapper.html()
    expect(content).toContain('class=')
  })

  it('no debe mostrar el wizard inicialmente', () => {
    expect(wrapper.vm.showWizard).toBe(false)
  })

  it('debe tener configuración de pasos del wizard', () => {
    expect(wrapper.vm.steps).toBeDefined()
    expect(Array.isArray(wrapper.vm.steps)).toBe(true)
    expect(wrapper.vm.steps.length).toBe(4)
  })

  it('debe tener paso actual en 1 inicialmente', () => {
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('debe tener total de 4 pasos', () => {
    expect(wrapper.vm.totalSteps).toBe(4)
  })

  it('debe iniciar el wizard al llamar startNewRelease', async () => {
    await wrapper.vm.startNewRelease()
    expect(wrapper.vm.showWizard).toBe(true)
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('debe cancelar el wizard al llamar cancelWizard', async () => {
    wrapper.vm.showWizard = true
    await wrapper.vm.cancelWizard()
    expect(wrapper.vm.showWizard).toBe(false)
  })

  it('debe resetear datos al cancelar wizard', async () => {
    wrapper.vm.selectedRepository = { id: 1 }
    wrapper.vm.selectedTemplate = { id: 1 }
    await wrapper.vm.resetWizardData()
    expect(wrapper.vm.selectedRepository).toBe(null)
    expect(wrapper.vm.selectedTemplate).toBe(null)
  })

  it('debe avanzar al siguiente paso', async () => {
    wrapper.vm.selectedRepository = { id: 1, currentVersion: '1.0.0' }
    await wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(2)
  })

  it('debe retroceder al paso anterior', async () => {
    wrapper.vm.currentStep = 2
    await wrapper.vm.previousStep()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('debe calcular correctamente versiones patch', () => {
    wrapper.vm.currentVersion = '1.2.3'
    expect(wrapper.vm.getVersionPreview('patch')).toBe('1.2.4')
  })

  it('debe calcular correctamente versiones minor', () => {
    wrapper.vm.currentVersion = '1.2.3'
    expect(wrapper.vm.getVersionPreview('minor')).toBe('1.3.0')
  })

  it('debe calcular correctamente versiones major', () => {
    wrapper.vm.currentVersion = '1.2.3'
    expect(wrapper.vm.getVersionPreview('major')).toBe('2.0.0')
  })

  it('debe seleccionar repositorio correctamente', async () => {
    const repo = { id: 1, name: 'test-repo', currentVersion: '1.0.0' }
    await wrapper.vm.selectRepository(repo)
    expect(wrapper.vm.selectedRepository).toStrictEqual(repo)
    expect(wrapper.vm.currentVersion).toBe('1.0.0')
  })

  it('debe seleccionar template correctamente', async () => {
    const template = { id: 1, name: 'test-template' }
    await wrapper.vm.selectTemplate(template)
    expect(wrapper.vm.selectedTemplate).toStrictEqual(template)
  })

  it('debe tener templates disponibles', () => {
    expect(wrapper.vm.availableTemplates).toBeDefined()
    expect(Array.isArray(wrapper.vm.availableTemplates)).toBe(true)
    expect(wrapper.vm.availableTemplates.length).toBeGreaterThan(0)
  })

  it('debe validar si puede proceder en cada paso', () => {
    // Step 1: necesita repositorio
    expect(wrapper.vm.canProceed).toBe(false)
    wrapper.vm.selectedRepository = { id: 1 }
    expect(wrapper.vm.canProceed).toBe(true)

    // Step 2: necesita tipo de versión (minor es el default)
    wrapper.vm.currentStep = 2
    expect(wrapper.vm.versionType).toBe('minor') // verificar valor por defecto
    // Como versionType existe, canProceed es true
    expect(wrapper.vm.canProceed).toBeTruthy()

    // Step 3: necesita template
    wrapper.vm.currentStep = 3
    expect(wrapper.vm.canProceed).toBe(false)
    wrapper.vm.selectedTemplate = { id: 1 }
    expect(wrapper.vm.canProceed).toBe(true)

    // Step 4: siempre puede proceder
    wrapper.vm.currentStep = 4
    expect(wrapper.vm.canProceed).toBe(true)
  })
})
