import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MapDashboard from '../../MapDashboard/MapDashboard.vue'
import { useSensorDetailStore } from '../../../stores/sensorDetail'
import { useMapStore } from '../../../stores/map'
import mapboxgl from 'mapbox-gl'

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(),
      addLayer: vi.fn(),
      setStyle: vi.fn(),
      flyTo: vi.fn(),
      once: vi.fn(),
      getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
      project: vi.fn(() => ({ x: 0, y: 0 })),
    })),
    accessToken: '',
  },
}))

vi.mock('@deck.gl/mapbox', () => ({
  MapboxLayer: vi.fn(),
}))

vi.mock('@deck.gl/layers', () => ({
  IconLayer: vi.fn(),
}))

const mockNuxtUI = {
  SensorTag: {
    template: '<div data-testid="sensor-tag"></div>',
    props: ['markerPosition'],
  },
}

const createWrapper = () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const sensorDetailStore = useSensorDetailStore()
  const mapStore = useMapStore()

  sensorDetailStore.sensors = [
    { id: 1, coordinates: [-71.0892, 42.3398], status: 'Active' },
  ]
  sensorDetailStore.selectedSensorId = 1
  sensorDetailStore.showSensorInfo = true
  mapStore.mapType = 'satellite'

  const wrapper = mount(MapDashboard, {
    global: {
      plugins: [pinia],
      stubs: mockNuxtUI,
    },
  })

  wrapper.vm.map = {
    flyTo: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
    project: vi.fn(() => ({ x: 0, y: 0 })),
    addLayer: vi.fn(),
    setStyle: vi.fn(),
  }

  return wrapper
}

describe('MapDashboard', () => {
  test('renders the component correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('#main-container').exists()).toBe(true)
  })

  test('renders SensorTag when showSensorInfo is true', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="sensor-tag"]').exists()).toBe(true)
  })

  test('initializes map on mount', () => {
    createWrapper()
    expect(mapboxgl.Map).toHaveBeenCalled()
  })

  test('updates marker position when map moves', async () => {
    const wrapper = createWrapper()

    await wrapper.vm.$nextTick()
    wrapper.vm.updateMarkerPosition()

    expect(wrapper.vm.markerPosition).toEqual({ x: 0, y: 0 })
  })

  test('updates marker position when map moves', async () => {
    const wrapper = createWrapper()

    await wrapper.vm.$nextTick()
    wrapper.vm.updateMarkerPosition()

    expect(wrapper.vm.markerPosition).toEqual({ x: 0, y: 0 })
  })
})
