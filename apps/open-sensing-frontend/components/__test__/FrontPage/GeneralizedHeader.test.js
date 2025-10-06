import { describe, it, expect } from 'vitest'
import { mount, config } from '@vue/test-utils'
import GeneralizedHeader from '../../FrontPage/GeneralizedHeader.vue'

// Mock NuxtUI components
const UButton = {
  name: 'UButton',
  template: '<button :class="$attrs.class"><slot></slot></button>',
  props: ['variant', 'color', 'icon'],
}

const UDropdown = {
  name: 'UDropdown',
  template: '<div><slot></slot></div>',
}

// Mock NuxtLink
const NuxtLink = {
  name: 'NuxtLink',
  template: '<a><slot></slot></a>',
  props: ['to'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  UButton,
  UDropdown,
  NuxtLink,
}

describe('GeneralizedHeader', () => {
  const mockProps = {
    leftItems: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
    ],
    rightItems: [
      { label: 'Login', onClick: vi.fn() },
      { label: 'Sign Up', to: '/signup' },
    ],
    logoSrc: '/logo.png',
    logoAlt: 'Test Logo',
    showIcon: true,
    shape: 'rounded',
  }

  it('renders the component correctly', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('renders the logo when logoSrc is provided', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const logo = wrapper.find('img')
    expect(logo.exists()).toBe(true)
    expect(logo.attributes('src')).toBe(mockProps.logoSrc)
    expect(logo.attributes('alt')).toBe(mockProps.logoAlt)
  })

  it('renders the icon when showIcon is true', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const icon = wrapper.findAll('button').at(1)
    expect(icon.exists()).toBe(true)
    expect(icon.text()).toBe('🤲')
  })

  it('does not render the icon when showIcon is false', () => {
    const wrapper = mount(GeneralizedHeader, {
      props: { ...mockProps, showIcon: false },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(
      mockProps.leftItems.length + mockProps.rightItems.length + 1
    ) // +1 for logo button
  })

  it('renders the correct number of left items', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const leftItems = wrapper
      .findAllComponents(UButton)
      .filter((button) =>
        mockProps.leftItems.some((item) => item.label === button.text())
      )
    expect(leftItems.length).toBe(mockProps.leftItems.length)
  })

  it('renders the correct number of right items', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const rightItems = wrapper.findAll(
      '.flex.items-center.space-x-2:last-child > *'
    )
    expect(rightItems.length).toBe(mockProps.rightItems.length)
  })

  it('applies the correct shape class based on the shape prop', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const buttons = wrapper.findAllComponents(UButton)
    buttons.forEach((button) => {
      expect(button.attributes('class')).toContain('rounded-full')
    })

    const rectangularWrapper = mount(GeneralizedHeader, {
      props: { ...mockProps, shape: 'rectangular' },
    })
    const rectangularButtons = rectangularWrapper.findAllComponents(UButton)
    rectangularButtons.forEach((button) => {
      expect(button.attributes('class')).toContain('rounded-2xl')
    })
  })

  it('renders NuxtLink for items with "to" prop', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const links = wrapper.findAllComponents(NuxtLink)
    expect(links.length).toBe(3) // 2 from leftItems, 1 from rightItems
  })

  it('renders UButton for items without "to" prop', () => {
    const wrapper = mount(GeneralizedHeader, { props: mockProps })
    const buttons = wrapper.findAllComponents(UButton)
    expect(buttons.length).toBe(
      mockProps.leftItems.length + mockProps.rightItems.length + 2
    ) // +2 for logo and icon
  })

  it('renders UDropdown for items with dropdown prop', () => {
    const propsWithDropdown = {
      ...mockProps,
      rightItems: [
        ...mockProps.rightItems,
        { label: 'More', dropdown: { items: [{ label: 'Submenu' }] } },
      ],
    }
    const wrapper = mount(GeneralizedHeader, { props: propsWithDropdown })
    const dropdowns = wrapper.findAllComponents(UDropdown)
    expect(dropdowns.length).toBe(1)
  })
})
