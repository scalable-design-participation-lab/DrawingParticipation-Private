import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OverviewContent from '../../Dashboard/OverviewContent.vue'

// Mock UButton and UCard components
const UButton = {
  name: 'UButton',
  template: '<button><slot></slot></button>',
  props: ['color', 'size'],
}

const UCard = {
  name: 'UCard',
  template: '<div><slot></slot></div>',
}

const UIcon = {
  name: 'UIcon',
  template: '<i></i>',
  props: ['name'],
}

describe('OverviewContent', () => {
  const mountComponent = (props = {}) => {
    return mount(OverviewContent, {
      props,
      global: {
        components: {
          UButton,
          UCard,
          UIcon,
        },
      },
    })
  }

  it('renders the description correctly', () => {
    const description = 'This is a test description'
    const wrapper = mountComponent({ description, stats: [] })
    expect(wrapper.find('p').text()).toBe(description)
  })

  it('renders the correct number of stat cards', () => {
    const stats = [
      { value: 10, label: 'Active Sensors' },
      { value: 5, label: 'Alerts' },
      { value: 95, label: 'Uptime %' },
    ]
    const wrapper = mountComponent({ description: '', stats })
    const cards = wrapper.findAllComponents(UCard)
    expect(cards).toHaveLength(3)
  })

  it('displays correct stat values and labels', () => {
    const stats = [
      { value: 10, label: 'Active Sensors' },
      { value: 5, label: 'Alerts' },
    ]
    const wrapper = mountComponent({ description: '', stats })
    const cards = wrapper.findAllComponents(UCard)

    stats.forEach((stat, index) => {
      const card = cards[index]
      expect(card.find('h3').text()).toBe(stat.value.toString())
      expect(card.find('p').text()).toBe(stat.label)
    })
  })

  it('renders three action buttons', () => {
    const wrapper = mountComponent({ description: '', stats: [] })
    const buttons = wrapper.findAllComponents(UButton)
    expect(buttons).toHaveLength(3)
  })

  it('renders correct button text and icons', () => {
    const wrapper = mountComponent({ description: '', stats: [] })
    const buttons = wrapper.findAllComponents(UButton)

    const expectedButtons = [
      { text: 'Export', icon: 'i-heroicons-arrow-down-tray' },
      { text: 'Share', icon: 'i-heroicons-share' },
      { text: 'Edit', icon: 'i-heroicons-pencil' },
    ]

    buttons.forEach((button, index) => {
      expect(button.text()).toContain(expectedButtons[index].text)
      expect(button.findComponent(UIcon).props('name')).toBe(
        expectedButtons[index].icon
      )
    })
  })
})
