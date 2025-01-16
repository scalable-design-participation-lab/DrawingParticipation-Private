import { describe, expect, it } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { config, mount } from '@vue/test-utils'
import GeneralizedFooter from '@components/GeneralizedFooter.vue'
import Nop from '@components/Nop.vue'

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

describe('generalizedFooter', () => {
  let wrapper: VueWrapper<any>
  const mockProps = {
    title: 'Test Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
    ],
    buttons: [{ label: 'Sign Up' }, { label: 'Login' }],
  }

  beforeEach(
    () => {
      vi.clearAllMocks()
      wrapper = mount(GeneralizedFooter, {
        props: {
          ...mockProps,
        },
        global: {
          components: {
            SupportModal: Nop,
          },
        },
      })
    },
  )

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders the component correctly', () => {
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe(mockProps.title)
  })

  it('renders the correct number of links', () => {
    const links = wrapper.findAll('nav ul li')
    expect(links).toHaveLength(mockProps.links.length)
  })

  it('renders the correct number of buttons', () => {
    const buttons = wrapper
      .findAllComponents(UButton)
      .filter(button => button.props('label'))
    expect(buttons).toHaveLength(mockProps.buttons.length)
  })

  it('renders the help button', () => {
    const helpButton = wrapper.find('button[aria-label="Help"]')
    expect(helpButton.exists()).toBe(true)
    expect(helpButton.text()).toBe('?')
  })

  it('renders link labels correctly', () => {
    const links = wrapper.findAll('nav ul li a')
    links.forEach((link, index) => {
      expect(link.text()).toBe(mockProps.links[index].label)
    })
  })

  it('renders button labels correctly', () => {
    const buttons = wrapper
      .findAllComponents(UButton)
      .filter(button => button.props('label'))
    buttons.forEach((button, index) => {
      expect(button.text()).toBe(mockProps.buttons[index].label)
    })
  })
})
