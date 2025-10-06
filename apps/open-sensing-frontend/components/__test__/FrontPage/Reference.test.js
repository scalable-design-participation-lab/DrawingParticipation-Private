import { describe, it, expect } from 'vitest'
import { mount, config } from '@vue/test-utils'
import Reference from '../../FrontPage/Reference.vue'

// Mock NuxtUI components
const UAccordion = {
  name: 'UAccordion',
  template: '<div><slot></slot></div>',
  props: ['items'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  UAccordion,
}

describe('Reference', () => {
  const mockItems = [
    { label: 'Reference 1', content: 'Content 1' },
    { label: 'Reference 2', content: 'Content 2' },
    { label: 'Reference 3', content: 'Content 3' },
  ]

  it('renders the component correctly', () => {
    const wrapper = mount(Reference, {
      props: { items: mockItems },
    })
    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('References')
  })

  it('renders UAccordion component', () => {
    const wrapper = mount(Reference, {
      props: { items: mockItems },
    })
    expect(wrapper.findComponent(UAccordion).exists()).toBe(true)
  })

  it('passes correct props to UAccordion', () => {
    const wrapper = mount(Reference, {
      props: { items: mockItems },
    })
    const accordion = wrapper.findComponent(UAccordion)
    expect(accordion.props('items')).toEqual(mockItems)
  })

  it('renders correct number of items', () => {
    const wrapper = mount(Reference, {
      props: { items: mockItems },
    })
    const accordion = wrapper.findComponent(UAccordion)
    expect(accordion.props('items')).toHaveLength(mockItems.length)
  })

  it('handles empty items array', () => {
    const wrapper = mount(Reference, {
      props: { items: [] },
    })
    const accordion = wrapper.findComponent(UAccordion)
    expect(accordion.props('items')).toEqual([])
  })

  it('handles undefined items prop', () => {
    const wrapper = mount(Reference)
    const accordion = wrapper.findComponent(UAccordion)
    expect(accordion.props('items')).toBeUndefined()
  })
})
