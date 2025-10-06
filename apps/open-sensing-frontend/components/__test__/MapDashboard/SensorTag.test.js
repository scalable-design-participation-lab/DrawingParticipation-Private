import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SensorTag from '../../MapDashboard/SensorTag.vue'
import { useSensorDetailStore } from '../../../stores/sensorDetail'

const mockNuxtUI = {
  UCard: {
    template: '<div><slot></slot><slot name="header"></slot></div>',
  },
  UButton: {
    template: '<button><slot></slot></button>',
    props: ['icon'],
  },
  UIcon: {
    template: '<i></i>',
    props: ['name'],
  },
}

const createWrapper = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useSensorDetailStore()
  store.selectedSensorId = 1
  store.sensors = [
    {
      id: 1,
      location: 'Test Location',
      timestamp: '2023-04-01 12:00:00',
      temperature: 25.5,
      humidity: 60,
      airQuality: 'Good',
      batteryLevel: 80,
    },
  ]

  store.selectPreviousSensor = vi.fn()
  store.selectNextSensor = vi.fn()
  store.toggleSensorDetail = vi.fn()
  store.closeSensorInfo = vi.fn()

  return mount(SensorTag, {
    props: {
      markerPosition: { x: 100, y: 200 },
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: mockNuxtUI,
    },
  })
}

describe('SensorTag', () => {
  test('renders the component correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  test('displays correct sensor information', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Test Location')
    expect(wrapper.text()).toContain('2023-04-01 12:00:00')
    expect(wrapper.text()).toContain('25.5°C')
    expect(wrapper.text()).toContain('60.0%')
    expect(wrapper.text()).toContain('Good')
    expect(wrapper.text()).toContain('80%')
  })

  test('computes position style correctly', async () => {
    const wrapper = createWrapper({ markerPosition: { x: 100, y: 200 } })
    await wrapper.vm.$nextTick()
    const card = wrapper.find('.absolute')
    expect(card.attributes('style')).toContain('left: 110px')
    expect(card.attributes('style')).toContain('top: 210px')
  })

  test('calls selectPreviousSensor when left arrow is clicked', async () => {
    const wrapper = createWrapper()
    const store = useSensorDetailStore()
    const button = wrapper.find('[data-testid="previous-sensor"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(store.selectPreviousSensor).toHaveBeenCalled()
  })

  test('calls selectNextSensor when right arrow is clicked', async () => {
    const wrapper = createWrapper()
    const store = useSensorDetailStore()
    const button = wrapper.find('[data-testid="next-sensor"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(store.selectNextSensor).toHaveBeenCalled()
  })

  test('calls toggleSensorDetail when detail button is clicked', async () => {
    const wrapper = createWrapper()
    const store = useSensorDetailStore()
    const button = wrapper.find('[data-testid="open-detail"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(store.toggleSensorDetail).toHaveBeenCalled()
  })

  test('calls closeSensorInfo when close button is clicked', async () => {
    const wrapper = createWrapper()
    const store = useSensorDetailStore()
    const button = wrapper.find('[data-testid="close-info"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(store.closeSensorInfo).toHaveBeenCalled()
  })
})
