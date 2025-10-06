import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardOverlay from '../../Dashboard/DashboardOverlay.vue'

describe('DashboardOverlay', () => {
  const mountComponent = (props = {}) => {
    return mount(DashboardOverlay, {
      props,
    })
  }

  it('renders nothing when visible prop is false', () => {
    const wrapper = mountComponent({ visible: false })
    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('renders the overlay when visible prop is true', () => {
    const wrapper = mountComponent({ visible: true })
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('applies correct CSS classes to the overlay', () => {
    const wrapper = mountComponent({ visible: true })
    const overlay = wrapper.find('div')
    expect(overlay.classes()).toContain('fixed')
    expect(overlay.classes()).toContain('inset-0')
    expect(overlay.classes()).toContain('bg-black')
    expect(overlay.classes()).toContain('bg-opacity-50')
    expect(overlay.classes()).toContain('backdrop-blur-sm')
    expect(overlay.classes()).toContain('z-15')
  })

  it('applies correct transition classes', () => {
    const wrapper = mountComponent({ visible: true })
    const transition = wrapper.findComponent({ name: 'Transition' })
    expect(transition.props('enterActiveClass')).toBe(
      'transition-opacity duration-300 ease-in-out'
    )
    expect(transition.props('leaveActiveClass')).toBe(
      'transition-opacity duration-300 ease-in-out'
    )
    expect(transition.props('enterFromClass')).toBe('opacity-0')
    expect(transition.props('leaveToClass')).toBe('opacity-0')
  })

  it('toggles visibility when prop changes', async () => {
    const wrapper = mountComponent({ visible: false })
    expect(wrapper.find('div').exists()).toBe(false)

    await wrapper.setProps({ visible: true })
    expect(wrapper.find('div').exists()).toBe(true)

    await wrapper.setProps({ visible: false })
    expect(wrapper.find('div').exists()).toBe(false)
  })
})
