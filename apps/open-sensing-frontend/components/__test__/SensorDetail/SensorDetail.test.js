import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SensorDetail from '../../SensorDetail/SensorDetail.vue'
import { useSensorDetailStore } from '../../../stores/sensorDetail'
import { useDashboardStore } from '../../../stores/dashboard'
import { useDatasetStore } from '../../../stores/datasets'
import { useSensorDataStore } from '../../../stores/sensorData'
import { nextTick } from 'vue'

const mockComponents = {
  SensorHeader: { name: 'SensorHeader', template: '<div>SensorHeader</div>' },
  SensorStats: { name: 'SensorStats', template: '<div>SensorStats</div>' },
  SensorInfo: { name: 'SensorInfo', template: '<div>SensorInfo</div>' },
  SensorLocation: {
    name: 'SensorLocation',
    template: '<div>SensorLocation</div>',
  },
  LineChart: { name: 'LineChart', template: '<div>LineChart</div>' },
}

const mockNuxtUI = {
  UButton: { template: '<button class="u-button"><slot></slot></button>' },
  USpinner: { template: '<div class="u-spinner"></div>' },
}

const createWrapper = () => {
  return mount(SensorDetail, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            sensorDetail: {
              selectedSensor: {
                id: '1',
                temperature: 25,
                humidity: 50,
                voc: 100,
                nox: 50,
                pm25: 10,
                signalStrength: 4,
                airQuality: 'Good',
                soilMoisture: '45%',
              },
              showSensorDetail: true,
            },
            dashboard: {
              dataDashboardValues: { dateRange: [] },
            },
            datasets: {
              selectedDatasets: ['Temperature', 'Relative Humidity'],
            },
            sensorData: {
              sensorData: {
                Temperature: [
                  /* mock data */
                ],
                'Relative Humidity': [
                  /* mock data */
                ],
              },
            },
          },
        }),
      ],
      components: {
        ...mockNuxtUI,
        ...mockComponents,
      },
      stubs: {
        transition: false,
      },
      mocks: {
        initMiniMap: vi.fn(),
      },
    },
  })
}

describe('SensorDetail', () => {
  let wrapper
  let sensorDetailStore
  let dashboardStore

  beforeEach(() => {
    wrapper = createWrapper()
    sensorDetailStore = useSensorDetailStore()
    vi.spyOn(wrapper.vm, 'resetAllCharts')
    dashboardStore = useDashboardStore()

    sensorDetailStore.selectedSensor = {
      id: '1',
      temperature: 25,
      humidity: 50,
      voc: 100,
      nox: 50,
      pm25: 10,
      signalStrength: 4,
      airQuality: 'Good',
      soilMoisture: '45%',
    }
  })

  it('renders the sensor detail modal correctly', async () => {
    await nextTick()

    expect(wrapper.find('[data-testid="sensor-detail-modal"]').exists()).toBe(
      true
    )
    expect(wrapper.findComponent({ name: 'SensorHeader' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SensorStats' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SensorInfo' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SensorLocation' }).exists()).toBe(
      true
    )
    expect(wrapper.findComponent({ name: 'LineChart' }).exists()).toBe(true)
  })

  it('calls closeSensorDetail when the modal is clicked outside', async () => {
    await nextTick()
    await wrapper.find('[data-testid="sensor-detail-modal"]').trigger('click')
    expect(sensorDetailStore.toggleSensorDetail).toHaveBeenCalled()
  })

  it('does not close the modal when the inner content is clicked', async () => {
    await nextTick()
    await wrapper.find('[data-testid="sensor-detail-content"]').trigger('click')
    expect(sensorDetailStore.toggleSensorDetail).not.toHaveBeenCalled()
  })

  it('computes sensorStats correctly', async () => {
    await nextTick()
    const sensorStats = wrapper.vm.sensorStats
    expect(sensorStats).toEqual({
      Temperature: '25.0°C',
      Humidity: '50.0%',
      'VOC (ppb)': 100,
      'NOx (ppb)': 50,
      'PM2.5 (µg/m³)': 10,
    })
  })

  it('calls resetAllCharts when the reset button is clicked', async () => {
    await nextTick()
    await wrapper.find('[data-testid="reset-charts-button"]').trigger('click')
    expect(wrapper.vm.resetAllCharts).toHaveBeenCalled()
  })

  it('updates global date range when updateGlobalDateRange is called', async () => {
    const newDateRange = [new Date('2023-01-01'), new Date('2023-01-31')]
    wrapper.vm.updateGlobalDateRange(newDateRange)
    expect(dashboardStore.updateDataDashboardValues).toHaveBeenCalledWith(
      'dateRange',
      newDateRange
    )
  })
})
