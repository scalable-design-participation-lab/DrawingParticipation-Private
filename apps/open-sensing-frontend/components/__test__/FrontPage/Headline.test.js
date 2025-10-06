import { describe, it, expect, vi } from 'vitest'
import { mount, config } from '@vue/test-utils'
import Headline from '../../FrontPage/Headline.vue'

// Mock NuxtUI components
const UCard = {
  name: 'UCard',
  template: '<div><slot></slot></div>',
}

const UTabs = {
  name: 'UTabs',
  template: '<div></div>',
  props: ['items'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  UCard,
  UTabs,
}

describe('Headline', () => {
  it('renders the title correctly', () => {
    const wrapper = mount(Headline, {
      props: {
        title: 'Test Title',
        type: 'paragraph',
        content: 'Test content',
      },
    })
    expect(wrapper.find('h2').text()).toBe('Test Title')
  })

  it('renders diagram content correctly', () => {
    const diagramContent = [
      { label: 'Tab 1', content: 'Content 1' },
      { label: 'Tab 2', content: 'Content 2' },
    ]
    const wrapper = mount(Headline, {
      props: {
        title: 'Diagram Title',
        type: 'diagram',
        content: diagramContent,
      },
    })
    expect(wrapper.findComponent(UCard).exists()).toBe(true)
    expect(wrapper.findComponent(UTabs).exists()).toBe(true)
    expect(wrapper.findComponent(UTabs).props('items')).toEqual(diagramContent)
  })

  it('renders chart content correctly', () => {
    const wrapper = mount(Headline, {
      props: {
        title: 'Chart Title',
        type: 'chart',
        content: 'Chart content',
      },
    })
    expect(wrapper.findComponent(UCard).exists()).toBe(true)
    expect(wrapper.find('.bg-gray-100').exists()).toBe(true)
    expect(wrapper.find('.bg-gray-100').text()).toBe('Chart content')
  })

  it('renders paragraph content correctly', () => {
    const wrapper = mount(Headline, {
      props: {
        title: 'Paragraph Title',
        type: 'paragraph',
        content: 'Paragraph content',
      },
    })
    expect(wrapper.find('p').exists()).toBe(true)
    expect(wrapper.find('p').text()).toBe('Paragraph content')
  })
})
