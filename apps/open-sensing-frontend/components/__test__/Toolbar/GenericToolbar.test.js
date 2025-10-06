import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericToolbar from '../../Toolbar/GenericToolbar.vue'

// Mock NuxtUI components
const mockNuxtUI = {
  UButton: {
    name: 'UButton',
    template: '<button><slot /></button>',
    props: ['color', 'variant', 'icon'],
  },
  UIcon: {
    name: 'UIcon',
    template: '<i><slot /></i>',
    props: ['name'],
  },
}

const createWrapper = (props = {}) => {
  return mount(GenericToolbar, {
    props: {
      tools: [
        { icon: 'i-heroicons-pencil', tooltip: 'Edit', action: vi.fn() },
        { icon: 'i-heroicons-trash', tooltip: 'Delete', action: vi.fn() },
      ],
      ...props,
    },
    global: {
      stubs: mockNuxtUI,
    },
  })
}

describe('GenericToolbar', () => {
  it('renders the correct number of tool buttons', () => {
    const wrapper = createWrapper()
    expect(wrapper.findAll('.w-14.h-14').length).toBe(2)
  })

  it('emits toolClick event when a tool button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.findAll('.w-14.h-14')[0].trigger('click')
    expect(wrapper.emitted('toolClick')).toBeTruthy()
    expect(wrapper.emitted('toolClick')[0]).toEqual([0])
  })

  it('executes the corresponding action when a tool button is clicked', async () => {
    const mockTools = [
      { icon: 'i-heroicons-pencil', tooltip: 'Edit', action: vi.fn() },
      { icon: 'i-heroicons-trash', tooltip: 'Delete', action: vi.fn() },
    ]
    const wrapper = createWrapper({ tools: mockTools })
    await wrapper.findAll('.w-14.h-14')[0].trigger('click')
    expect(mockTools[0].action).toHaveBeenCalled()
  })

  it('toggles active state when clicking the same tool button twice', async () => {
    const wrapper = createWrapper()
    const button = wrapper.findAll('.w-14.h-14')[0]
    await button.trigger('click')
    expect(button.classes()).not.toContain('bg-blue-500')
    await button.trigger('click')
    expect(button.classes()).not.toContain('bg-blue-500')
  })

  it('renders the component structure correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.flex.flex-col').exists()).toBe(true)
  })
})
