import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import SensorLocation from '../../SensorDetail/SensorLocation.vue'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    Map: vi.fn(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      flyTo: vi.fn(),
      setPitch: vi.fn(),
      setBearing: vi.fn(),
    })),
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn(),
    })),
    accessToken: '',
  },
}))

const createWrapper = (props = {}) => {
  return shallowMount(SensorLocation, {
    props,
    global: {
      plugins: [createTestingPinia()],
      stubs: ['NuxtUIComponent'], // Replace with actual NuxtUI components if any
    },
  })
}

describe('SensorLocation.vue', () => {
  let wrapper
  const mockSensor = {
    coordinates: [12.34, 56.78],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    wrapper = createWrapper({ selectedSensor: mockSensor })
  })

  it('renders correctly', () => {
    expect(wrapper.find('[data-testid="location-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mini-map"]').exists()).toBe(true)
  })
})
