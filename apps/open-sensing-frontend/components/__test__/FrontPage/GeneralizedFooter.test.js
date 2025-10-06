import { describe, it, expect } from 'vitest'
import { mount, config } from '@vue/test-utils'
import GeneralizedFooter from '../../FrontPage/GeneralizedFooter.vue'

// Mock NuxtUI components
const ULink = {
  name: 'ULink',
  template: '<a><slot></slot></a>',
  props: ['to'],
}

const UButton = {
  name: 'UButton',
  template: '<button>{{ label }}</button>',
  props: ['color', 'label'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  ULink,
  UButton,
}

describe('GeneralizedFooter', () => {
  const mockProps = {
    title: 'Test Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
    ],
    buttons: [{ label: 'Sign Up' }, { label: 'Login' }],
  }

  it('renders the component correctly', () => {
    const wrapper = mount(GeneralizedFooter, { props: mockProps })
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe(mockProps.title)
  })

  it('renders the correct number of links', () => {
    const wrapper = mount(GeneralizedFooter, { props: mockProps })
    const links = wrapper.findAll('nav ul li')
    expect(links).toHaveLength(mockProps.links.length)
  })

  it('renders the correct number of buttons', () => {
    const wrapper = mount(GeneralizedFooter, { props: mockProps })
    const buttons = wrapper
      .findAllComponents(UButton)
      .filter((button) => button.props('label'))
    expect(buttons).toHaveLength(mockProps.buttons.length)
  })

  it('renders the help button', () => {
    const wrapper = mount(GeneralizedFooter, { props: mockProps })
    const helpButton = wrapper.find('button[aria-label="Help"]')
    expect(helpButton.exists()).toBe(true)
    expect(helpButton.text()).toBe('?')
  })

  it('renders link labels correctly', () => {
    const wrapper = mount(GeneralizedFooter, { props: mockProps })
    const links = wrapper.findAll('nav ul li a')
    links.forEach((link, index) => {
      expect(link.text()).toBe(mockProps.links[index].label)
    })
  })

  it('renders button labels correctly', () => {
    const wrapper = mount(GeneralizedFooter, { props: mockProps })
    const buttons = wrapper
      .findAllComponents(UButton)
      .filter((button) => button.props('label'))
    buttons.forEach((button, index) => {
      expect(button.text()).toBe(mockProps.buttons[index].label)
    })
  })
})
