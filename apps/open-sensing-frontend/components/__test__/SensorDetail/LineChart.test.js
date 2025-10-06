import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue' // Import nextTick
import LineChart from '../../SensorDetail/LineChart.vue'
import { useDashboardStore } from '../../../stores/dashboard'

const mockNuxtUI = {
  UButton: {
    template: '<button><slot></slot></button>',
    props: ['icon'],
  },
}

const createWrapper = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useDashboardStore()
  const spy = vi.spyOn(store, 'updateDataDashboardValues')

  return mount(LineChart, {
    props: {
      metric: { label: 'Temperature (°C)' },
      data: {
        data: [{ date: new Date().toISOString(), value: 25 }], // date is a string
        min: 0,
        max: 100,
      },
      width: 600,
      height: 300,
      margin: { top: 20, right: 20, bottom: 30, left: 40 },
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: mockNuxtUI,
    },
  })
}

describe('LineChart', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('renders the component correctly', async () => {
    const wrapper = createWrapper()
    await nextTick() // Wait for DOM updates
    expect(wrapper.exists()).toBe(true)
    const chartContainer = wrapper.find('[data-testid="chart-container"]')
    expect(chartContainer.exists()).toBe(true)
  })

  test('renders reset button', () => {
    const wrapper = createWrapper()
    const resetButton = wrapper.find('[data-testid="reset-button"]')
    expect(resetButton.exists()).toBe(true)
  })

  test('calls resetChart when reset button is clicked', async () => {
    const wrapper = createWrapper()
    const resetButton = wrapper.find('[data-testid="reset-button"]')
    await resetButton.trigger('click')

    const store = useDashboardStore()
    expect(store.updateDataDashboardValues).toHaveBeenCalledWith(
      'dateRange',
      expect.any(Array)
    )
  })

  test('renders tooltip element', () => {
    const wrapper = createWrapper()
    const tooltip = wrapper.find('.tooltip')
    expect(tooltip.exists()).toBe(true)
  })

  test('updates chart when props.data changes', async () => {
    const wrapper = createWrapper()
    const newData = {
      data: [{ date: new Date().toISOString(), value: 30 }],
      min: 0,
      max: 100,
    }
    await wrapper.setProps({ data: newData })
    expect(wrapper.props('data')).toEqual(newData)
  })
})
