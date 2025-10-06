import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SensorInfo from '../../SensorDetail/SensorInfo.vue'

const mockNuxtUI = {
  UBadge: {
    template: '<span :color="color"><slot></slot></span>',
    props: ['color'],
  },
}

const createWrapper = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(SensorInfo, {
    props: {
      selectedSensor: {
        signalStrength: 4,
        airQuality: 'Good',
        soilMoisture: '45.0%',
        timestamp: '2023-04-01T12:00:00Z',
        lastMaintenance: '2023-03-15T09:30:00Z',
      },
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: mockNuxtUI,
    },
  })
}

describe('SensorInfo', () => {
  it('renders sensor information title correctly', () => {
    const wrapper = createWrapper()
    const title = wrapper.find('[data-testid="sensor-info-title"]')
    expect(title.text()).toBe('Sensor Information')
  })

  it('renders signal strength with correct value and color', () => {
    const wrapper = createWrapper()
    const value = wrapper.find(
      '[data-testid="sensor-info-value-signal-strength"]'
    )
    const label = wrapper.find(
      '[data-testid="sensor-info-label-signal-strength"]'
    )
    expect(value.text()).toBe('4/5')
    expect(label.text()).toBe('Signal Strength')
    expect(value.classes()).toContain('text-green-500') // Assuming 4/5 maps to green
  })

  it('renders air quality with correct value and color', () => {
    const wrapper = createWrapper()
    const value = wrapper.find('[data-testid="sensor-info-value-air-quality"]')
    const label = wrapper.find('[data-testid="sensor-info-label-air-quality"]')
    expect(value.text()).toBe('Good')
    expect(label.text()).toBe('Air Quality')
    expect(value.classes()).toContain('text-green-500')
  })

  it('renders soil moisture with correct value and color', () => {
    const wrapper = createWrapper()
    const value = wrapper.find(
      '[data-testid="sensor-info-value-soil-moisture"]'
    )
    const label = wrapper.find(
      '[data-testid="sensor-info-label-soil-moisture"]'
    )
    expect(value.text()).toBe('45.0%')
    expect(label.text()).toBe('Soil Moisture')
    expect(value.classes()).toContain('text-yellow-500') // Assuming 45.0% maps to yellow
  })

  it('renders last updated date correctly', () => {
    const wrapper = createWrapper()
    const lastUpdated = wrapper.find('[data-testid="last-updated"]')
    expect(lastUpdated.text()).toContain('Last Updated: Apr 1, 2023, 08:00 AM')
  })

  it('renders last maintenance date correctly', () => {
    const wrapper = createWrapper()
    const lastMaintenance = wrapper.find('[data-testid="last-maintenance"]')
    expect(lastMaintenance.text()).toContain(
      'Last Maintenance: Mar 15, 2023, 05:30 AM'
    )
  })
})
