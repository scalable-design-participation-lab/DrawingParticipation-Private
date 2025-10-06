import { describe, it, expect } from 'vitest'
import { mount, config } from '@vue/test-utils'
import MoreInThisSeries from '../../FrontPage/MoreInThisSeries.vue'

// Mock NuxtUI components
const ULandingGrid = {
  name: 'ULandingGrid',
  template: '<div><slot></slot></div>',
  props: ['cols', 'gap'],
}

const ULandingCard = {
  name: 'ULandingCard',
  template: '<div><slot></slot></div>',
  props: ['title', 'description', 'icon'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  ULandingGrid,
  ULandingCard,
}

describe('MoreInThisSeries', () => {
  const mockItems = [
    { title: 'Item 1', description: 'Description 1', icon: 'icon-1' },
    { title: 'Item 2', description: 'Description 2', icon: 'icon-2' },
    { title: 'Item 3', description: 'Description 3', icon: 'icon-3' },
  ]

  it('renders the component correctly', () => {
    const wrapper = mount(MoreInThisSeries, {
      props: { items: mockItems },
    })
    expect(wrapper.find('section').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('More in this series')
  })

  it('renders the correct number of ULandingCard components', () => {
    const wrapper = mount(MoreInThisSeries, {
      props: { items: mockItems },
    })
    const cards = wrapper.findAllComponents(ULandingCard)
    expect(cards).toHaveLength(mockItems.length)
  })

  it('passes correct props to ULandingGrid', () => {
    const wrapper = mount(MoreInThisSeries, {
      props: { items: mockItems, cols: 4 },
    })
    const grid = wrapper.findComponent(ULandingGrid)
    expect(grid.props('cols')).toBe(4)
    expect(grid.props('gap')).toBe(5)
  })

  it('passes correct props to ULandingCard components', () => {
    const wrapper = mount(MoreInThisSeries, {
      props: { items: mockItems },
    })
    const cards = wrapper.findAllComponents(ULandingCard)
    cards.forEach((card, index) => {
      expect(card.props('title')).toBe(mockItems[index].title)
      expect(card.props('description')).toBe(mockItems[index].description)
      expect(card.props('icon')).toBe(mockItems[index].icon)
    })
  })

  it('applies correct classes to ULandingCard components', () => {
    const wrapper = mount(MoreInThisSeries, {
      props: { items: mockItems },
    })
    const cards = wrapper.findAllComponents(ULandingCard)
    cards.forEach((card) => {
      expect(card.classes()).toContain('col-span-6')
      expect(card.classes()).toContain('row-span-2')
    })
  })

  it('uses default value for cols prop when not provided', () => {
    const wrapper = mount(MoreInThisSeries, {
      props: { items: mockItems },
    })
    const grid = wrapper.findComponent(ULandingGrid)
    expect(grid.props('cols')).toBe(3)
  })
})
