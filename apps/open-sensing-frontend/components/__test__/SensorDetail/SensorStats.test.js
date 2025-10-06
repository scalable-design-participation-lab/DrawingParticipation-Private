import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SensorStats from '../../SensorDetail/SensorStats.vue'
import { createTestingPinia } from '@pinia/testing'

const mockNuxtUI = {
  // Add any necessary NuxtUI component mocks here
}

const createWrapper = (props = {}) => {
  return mount(SensorStats, {
    props,
    global: {
      plugins: [createTestingPinia()],
      stubs: mockNuxtUI,
    },
  })
}

describe('SensorStats.vue', () => {
  const sensorStats = {
    Temperature: 25,
    Humidity: 50,
    VOC: 300,
    NOx: 40,
    PM25: 12,
  }

  it('renders the correct number of statistics', () => {
    const wrapper = createWrapper({ sensorStats })
    const statItems = wrapper.findAll('.stat-item')
    expect(statItems.length).toBe(Object.keys(sensorStats).length)
  })

  it('emits "show-stat-details" with correct key when a stat is clicked', async () => {
    const wrapper = createWrapper({ sensorStats })
    const statItem = wrapper.find('.stat-item')
    await statItem.trigger('click')
    expect(wrapper.emitted()['show-stat-details']).toBeTruthy()
    expect(wrapper.emitted()['show-stat-details'][0]).toEqual([
      Object.keys(sensorStats)[0],
    ])
  })

  it('applies correct color classes based on sensor value', () => {
    const wrapper = createWrapper({ sensorStats })
    Object.entries(sensorStats).forEach(([key, value]) => {
      const statItem = wrapper.find(
        `.stat-item:nth-child(${Object.keys(sensorStats).indexOf(key) + 1}) h3`
      )
      if (key === 'Temperature') {
        if (value < 10) {
          expect(statItem.classes()).toContain('text-blue-500')
        } else if (value > 30) {
          expect(statItem.classes()).toContain('text-red-500')
        } else {
          expect(statItem.classes()).toContain('text-green-500')
        }
      }
      if (key === 'Humidity') {
        if (value < 30) {
          expect(statItem.classes()).toContain('text-yellow-500')
        } else if (value > 70) {
          expect(statItem.classes()).toContain('text-blue-500')
        } else {
          expect(statItem.classes()).toContain('text-green-500')
        }
      }
      // Add more conditions for other keys if needed
    })
  })
})
