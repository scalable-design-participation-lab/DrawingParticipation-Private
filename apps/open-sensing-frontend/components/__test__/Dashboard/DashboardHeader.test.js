import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardHeader from '../../Dashboard/DashboardHeader.vue'

// Mock UBadge component
const UBadge = {
  name: 'UBadge',
  template: '<span><slot></slot></span>',
  props: ['color', 'size'],
}

const UButton = {
  name: 'UButton',
  template: '<button><slot></slot></button>',
}

describe('DashboardHeader', () => {
  const mountComponent = (props = {}) => {
    return mount(DashboardHeader, {
      props,
      global: {
        components: {
          UBadge,
          UButton,
        },
      },
    })
  }

  it('renders correctly with props', () => {
    const wrapper = mountComponent({
      title: 'Sensor Dashboard',
      badgeText: 'Last updated: 5 minutes ago',
      badgeColor: 'blue',
    })

    expect(wrapper.find('h2').text()).toBe('Sensor Dashboard')
    expect(wrapper.find('span').text()).toBe('Last updated: 5 minutes ago')
  })

  it('applies correct CSS classes', () => {
    const wrapper = mountComponent({
      title: 'Test Dashboard',
      badgeText: 'Test Badge',
    })

    expect(wrapper.find('h2').classes()).toContain('text-xl')
    expect(wrapper.find('h2').classes()).toContain('font-semibold')
  })

  it('renders UBadge component with correct props', () => {
    const wrapper = mountComponent({
      title: 'Test Dashboard',
      badgeText: 'Test Badge',
      badgeColor: 'green',
    })

    const badge = wrapper.findComponent(UBadge)
    expect(badge.exists()).toBe(true)
    expect(badge.props('color')).toBe('green')
    expect(badge.props('size')).toBe('sm')
  })

  it('uses default badge color when not provided', () => {
    const wrapper = mountComponent({
      title: 'Test Dashboard',
      badgeText: 'Test Badge',
    })

    const badge = wrapper.findComponent(UBadge)
    expect(badge.props('color')).toBeUndefined()
  })
})
