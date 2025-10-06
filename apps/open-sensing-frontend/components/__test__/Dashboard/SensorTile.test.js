import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SensorTile from '../../Dashboard/SensorTile.vue'

// Mock UCard, UBadge, UIcon, and UButton components
const UCard = {
  name: 'UCard',
  template: '<div><slot></slot></div>',
  props: ['hover'],
}

const UBadge = {
  name: 'UBadge',
  template: '<span><slot></slot></span>',
  props: ['color'],
}

const UIcon = {
  name: 'UIcon',
  template: '<i></i>',
  props: ['name'],
}

const UButton = {
  name: 'UButton',
  template: '<button><slot></slot></button>',
  props: ['color', 'variant'],
}

describe('SensorTile', () => {
  const defaultSensor = {
    id: '1',
    location: 'Test Location',
    status: 'Active',
    batteryLevel: 75,
    temperature: 22.5,
    humidity: 45,
    airQuality: 'Good',
    soilMoisture: '30%',
  }

  const mountComponent = (props = {}) => {
    return mount(SensorTile, {
      props: {
        sensor: defaultSensor,
        ...props,
      },
      global: {
        components: {
          UCard,
          UBadge,
          UIcon,
          UButton,
        },
      },
    })
  }

  it('renders sensor location correctly', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('h3').text()).toBe('Test Location')
  })

  it('displays correct status badge', () => {
    const wrapper = mountComponent()
    const badge = wrapper.findComponent(UBadge)
    expect(badge.text()).toBe('Active')
    expect(badge.props('color')).toBe('green')
  })

  it('shows battery level correctly', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('75%')
  })

  it('renders correct number of display fields', () => {
    const wrapper = mountComponent({
      displayFields: ['temperature', 'humidity'],
    })
    const fields = wrapper.findAll('.grid > div')
    expect(fields).toHaveLength(2)
  })

  it('formats and displays sensor values correctly', () => {
    const wrapper = mountComponent({
      displayFields: ['temperature', 'humidity'],
    })
    const values = wrapper.findAll('.text-xl')
    expect(values[0].text()).toBe('22.5°C')
    expect(values[1].text()).toBe('45.0%')
  })

  it('shows details button when showDetails is true', () => {
    const wrapper = mountComponent({ showDetails: true })
    expect(wrapper.findComponent(UButton).exists()).toBe(true)
  })

  it('hides details button when showDetails is false', () => {
    const wrapper = mountComponent({ showDetails: false })
    expect(wrapper.findComponent(UButton).exists()).toBe(false)
  })

  it('emits open-details event when details button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findComponent(UButton).trigger('click')
    expect(wrapper.emitted('open-details')).toBeTruthy()
    expect(wrapper.emitted('open-details')[0]).toEqual(['1'])
  })

  it('applies custom colors when provided', () => {
    const customColors = {
      status: { Active: 'blue' },
      battery: { high: 'text-purple-500' },
      values: { temperature: { '20-25': 'text-orange-500' } },
    }
    const wrapper = mountComponent({
      customColors,
      displayFields: ['temperature'],
    })

    const badge = wrapper.findComponent(UBadge)
    expect(badge.props('color')).toBe('blue')

    const batteryIcon = wrapper.findComponent(UIcon)
    expect(batteryIcon.classes()).toContain('text-purple-500')

    const temperatureValue = wrapper.find('.text-xl')
    expect(temperatureValue.classes()).toContain('text-orange-500')
  })
})
