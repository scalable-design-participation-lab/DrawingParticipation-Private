import { describe, it, expect } from 'vitest'
import { mount, config } from '@vue/test-utils'
import HeroSection from '../../FrontPage/HeroSection.vue'

// Mock NuxtUI components
const ULandingHero = {
  name: 'ULandingHero',
  template: '<div><slot name="headline"></slot><slot></slot></div>',
  props: ['title', 'description', 'links'],
}

const UButton = {
  name: 'UButton',
  template: '<button><slot></slot></button>',
  props: ['color', 'to', 'label', 'trailing-icon', 'size'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  ULandingHero,
  UButton,
}

describe('HeroSection', () => {
  const mockProps = {
    title: 'Welcome to Our App',
    description: 'Discover amazing features',
    links: [
      { label: 'Get Started', to: '/start' },
      { label: 'Learn More', to: '/learn' },
    ],
    headlineButton: {
      to: '/headline',
      label: 'Headline Button',
      icon: 'i-heroicons-arrow-right',
    },
    imageSrc: '/hero-image.jpg',
    imageAlt: 'Hero Image',
  }

  it('renders the component correctly', () => {
    const wrapper = mount(HeroSection, { props: mockProps })
    expect(wrapper.findComponent(ULandingHero).exists()).toBe(true)
  })

  it('passes correct props to ULandingHero', () => {
    const wrapper = mount(HeroSection, { props: mockProps })
    const landingHero = wrapper.findComponent(ULandingHero)
    expect(landingHero.props('title')).toBe(mockProps.title)
    expect(landingHero.props('description')).toBe(mockProps.description)
    expect(landingHero.props('links')).toEqual(mockProps.links)
  })

  it('renders the headline button correctly', () => {
    const wrapper = mount(HeroSection, { props: mockProps })
    const button = wrapper.findComponent(UButton)
    expect(button.exists()).toBe(true)
    expect(button.props('to')).toBe(mockProps.headlineButton.to)
    expect(button.props('label')).toBe(mockProps.headlineButton.label)
    expect(button.props('trailingIcon')).toBe(mockProps.headlineButton.icon)
    expect(button.props('size')).toBe('xs')
    expect(button.props('color')).toBe('gray')
    expect(button.classes()).toContain('rounded-full')
  })

  it('renders the hero image correctly', () => {
    const wrapper = mount(HeroSection, { props: mockProps })
    const image = wrapper.find('img')
    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe(mockProps.imageSrc)
    expect(image.attributes('alt')).toBe(mockProps.imageAlt)
    expect(image.classes()).toContain('w-full')
    expect(image.classes()).toContain('rounded-md')
    expect(image.classes()).toContain('shadow-xl')
    expect(image.classes()).toContain('ring-1')
    expect(image.classes()).toContain('ring-gray-300')
    expect(image.classes()).toContain('dark:ring-gray-700')
  })
})
