<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-in-out"
    leave-active-class="transition-opacity duration-300 ease-in-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showSensorDetail && selectedSensor"
      class="fixed inset-0 flex justify-center items-center z-[20]"
      data-testid="sensor-detail-modal"
      @click="closeSensorDetail"
    >
      <UCard
        class="h-[80vh] w-full max-w-[1200px] max-h-[100%] overflow-y-auto"
        data-testid="sensor-detail-content"
        @click.stop
      >
        <!-- Header -->
        <template #header>
          <SensorHeader
            :selected-sensor="selectedSensor"
            @close="closeSensorDetail"
            @go-back="goBackToDashboard"
            @select-previous="selectPreviousSensor"
            @select-next="selectNextSensor"
          />
        </template>

        <!-- Body -->
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <span class="text-sm text-gray-600">Temperature Unit:</span>
            <URadio
              v-model="temperatureUnit"
              name="temp-unit"
              value="C"
              label="Celsius (°C)"
            />
            <URadio
              v-model="temperatureUnit"
              name="temp-unit"
              value="F"
              label="Fahrenheit (°F)"
            />
          </div>

          <!-- Stats or Skeleton -->
          <div v-if="!loadingStates[selectedSensor.moduleid]">
            <SensorStats
              :sensor-stats="sensorStats"
              :temperature-unit="temperatureUnit"
              @show-stat-details="showStatDetails"
            />
          </div>
          <div
            v-else
            class="grid grid-cols-2 md:grid-cols-4 gap-4 my-4"
            data-testid="stats-skeleton"
          >
            <USkeleton
              v-for="n in Object.keys(sensorStats).length"
              :key="n"
              class="h-16 w-full rounded animate-pulse"
            />
          </div>

          <div class="flex flex-col md:flex-row gap-6 mt-8">
            <UCard class="flex-1">
              <SensorInfo
                :selected-sensor="selectedSensor"
                :sensor-info-items="sensorInfoItems"
              />
            </UCard>

            <UCard class="flex-1">
              <SensorLocation
                :selected-sensor="selectedSensor"
                @init-map="initMiniMap"
              />
            </UCard>
          </div>

          <UCard class="mt-8">
            <template #header>
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Sensor Data
                </h2>
                <GenericDateRangePicker v-model="dateRangeForSensorQuery" />
              </div>
            </template>

            <div ref="scrollContainer">
              <div
                v-if="dataLoaded && !loadingStates[selectedSensor.moduleid]"
                class="p-4 space-y-6"
              >
                <template
                  v-for="(metric, metricName) in metrics"
                  :key="metricName"
                >
                  <div v-if="shouldRenderChart(metricName)">
                    <LineChart
                      :metric="metric"
                      :data="chartData[metricName]"
                      :margin="margin"
                      :width="chartWidth"
                      :height="chartHeight"
                      :temperature-unit="temperatureUnit"
                      @date-range-update="updateGlobalDateRange"
                    />
                  </div>
                </template>
              </div>
              <div v-else class="p-4 space-y-6">
                <template
                  v-for="(metric, metricName) in metrics"
                  :key="metricName"
                >
                  <USkeleton class="h-[350px] w-full rounded animate-pulse" />
                </template>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-between items-center py-2">
                <UButton
                  class="hover:bg-blue-600 transition-colors"
                  data-testid="reset-charts-button"
                  @click="resetAllCharts"
                >
                  Reset All Charts
                </UButton>
                <div
                  v-if="globalDateRange.length === 2"
                  class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                >
                  {{ formatDateRange(globalDateRange) }}
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </UCard>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSensorDetailStore } from '../../stores/sensorDetail'
import { useDashboardStore } from '../../stores/dashboard'
import { useDatasetStore } from '../../stores/datasets'
import {
  useSensorDataStore,
  type SensorDataStore,
} from '../../stores/sensorData'
import { useResizeObserver } from '@vueuse/core'
import { SENSOR_METRICS } from '../../constants/metrics'
import GenericDateRangePicker from '../FilterSidebar/GenericDateRangePicker.vue'
import { sub } from 'date-fns'
import { isNumber } from 'util'

/**
 * Store for managing sensor detail state
 * @type {import('@/stores/sensorDetail').SensorDetailStore}
 */
const sensorDetailStore = useSensorDetailStore()

/**
 * Store for managing dashboard state
 * @type {import('@/stores/dashboard').DashboardStore}
 */
const dashboardStore = useDashboardStore()

/**
 * Store for managing dataset state
 * @type {import('@/stores/datasets').DatasetStore}
 */
const datasetStore = useDatasetStore()

/**
 * Store for managing sensor data state
 * @type {import('@/stores/sensorData').SensorDataStore}
 */
const sensorDataStore = useSensorDataStore()

/**
 * Destructured reactive references from the sensor detail store
 * @type {{selectedSensor: import('vue').Ref, showSensorDetail: import('vue').Ref, sensors: import('vue').Ref}}
 */
const { selectedSensor, showSensorDetail, sensors } =
  storeToRefs(sensorDetailStore)

/**
 * Destructured reactive references from the dashboard store
 * @type {{dataDashboardValues: import('vue').Ref}}
 */
const { dataDashboardValues } = storeToRefs(dashboardStore)

/**
 * Destructured reactive references from the dataset store
 * @type {{selectedDatasets: import('vue').Ref}}
 */
const { selectedDatasets } = storeToRefs(datasetStore)

/**
 * Destructured reactive references from the sensor data store
 * @type {{sensorData: import('vue').Ref}}
 */
const { sensorData } = storeToRefs(sensorDataStore)

/**
 * Methods destructured from the sensor detail store
 * @type {{toggleSensorDetail: Function, selectNextSensor: Function, selectPreviousSensor: Function}}
 */
const { toggleSensorDetail, selectNextSensor, selectPreviousSensor } =
  sensorDetailStore

/**
 * Methods destructured from the dashboard store
 * @type {{updateDataDashboardValues: Function}}
 */
const { updateDataDashboardValues } = dashboardStore

/**
 * Methods destructured from the sensor data store
 * @type {{loadSensorData: Function}}
 */
const { loadSensorData } = sensorDataStore

/**
 * Reference to the scroll container element
 * @type {import('vue').Ref<HTMLElement | null>}
 */
const scrollContainer = ref(null)

/**
 * Width of the chart, reactive to container size changes
 * @type {import('vue').Ref<number>}
 */
const chartWidth = ref(0)

/**
 * Height of each chart
 * @type {number}
 */
const chartHeight = 350

/**
 * Global date range for all charts
 * @type {import('vue').Ref<Date[]>}
 */
const globalDateRange = ref([])

/**
 * Margin for charts
 * @type {{top: number, right: number, bottom: number, left: number}}
 */
const margin = { top: 20, right: 20, bottom: 30, left: 40 }

/**
 * Computed property to check if data is loaded and chart width is set
 * @type {import('vue').ComputedRef<boolean>}
 */
const dataLoaded = ref(false)

/**
 * Metrics configuration for charts
 * @type {import('vue').Ref<Object>}
 */
const metrics = ref(SENSOR_METRICS)

/**
 * Computed property for sensor statistics
 * @type {import('vue').ComputedRef<Object>}
 */
const sensorStats = computed(() => {
  if (
    !selectedSensor.value ||
    !sensorData.value[selectedSensor.value.moduleid]
  ) {
    return {
      Temperature: 'N/A',
      'Relative Humidity': 'N/A',
      'VOC (ppb)': 'N/A',
      'NOx (ppb)': 'N/A',
      pm1: 'N/A',
      pm25: 'N/A',
      pm4: 'N/A',
      pm10: 'N/A',
    }
  }

  const data = sensorData.value[selectedSensor.value.moduleid]

  /**
   * Formats a sensor value with its unit
   * @param {number|null|undefined} value - The value to format
   * @param {string} unit - The unit to append
   * @returns {string} Formatted value with unit or 'N/A'
   */
  const formatValue = (value, unit) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }
    if (unit === 'Temperature') {
      const tempC = parseFloat(value)
      if (temperatureUnit.value === 'F') {
        const tempF = (tempC * 9) / 5 + 32
        return `${tempF.toFixed(1)}°F`
      }
      return `${tempC.toFixed(1)}°C`
    }
    if (unit === 'Pa') {
      return `${(value / 1000).toFixed(1)} kPa`
    }
    return `${value.toFixed(1)}${unit}`
  }

  const stats = {}

  const addStat = (key, value, unit) => {
    if (value !== null && value !== undefined && !isNaN(value)) {
      stats[key] = formatValue(value, unit)
    }
  }

  addStat('Temperature', selectedSensor.value.temperature, 'Temperature')
  addStat('Relative Humidity', selectedSensor.value.relative_humidity, '%')
  addStat('VOC (ppb)', selectedSensor.value.voc, ' ppb')
  addStat('NOx (ppb)', selectedSensor.value.nox, ' ppb')
  addStat('pm1', selectedSensor.value.pm1, ' µg/m³')
  addStat('pm25', selectedSensor.value.pm25, ' µg/m³')
  addStat('pm4', selectedSensor.value.pm4, ' µg/m³')
  addStat('pm10', selectedSensor.value.pm10, ' µg/m³')
  addStat('Humidity (BME)', selectedSensor.value.bme_humid, ' %')
  addStat('Temperature (BME)', selectedSensor.value.bme_temp, 'Temperature')
  addStat('Pressure (BME)', selectedSensor.value.bme_pressure, 'Pa')
  addStat(
    'Temperature (SCD)',
    data.scd_temp?.data?.at(-1)?.value,
    'Temperature'
  )
  addStat('Humidity (SCD)', data.scd_humid?.data?.at(-1)?.value, ' %')
  addStat('CO2 (SCD)', data.scd_co2?.data?.at(-1)?.value, ' ppm')

  return stats
})

/**
 * Gets the air quality based on temperature and humidity
 * @param {number} temperature - The temperature value
 * @param {number} humidity - The humidity value
 * @returns {string} The air quality status
 */
const getAirQuality = (temperature, humidity) => {
  if (temperature === null || humidity === null) return 'Unknown'
  if (temperature === 0 && humidity === 0) return 'Inactive'
  if (temperature > 30 || humidity > 80) return 'Poor'
  if (temperature > 25 || humidity > 70) return 'Moderate'
  return 'Good'
}

/**
 * Gets the color for air quality
 * @param {string|null} value - The air quality value
 * @returns {string} The color class for the air quality
 */
const getAirQualityColor = (value) => {
  if (!value) return 'text-gray-500'

  switch (value.toLowerCase()) {
    case 'good':
      return 'text-green-500'
    case 'moderate':
      return 'text-yellow-500'
    case 'poor':
      return 'text-orange-500'
    case 'very poor':
      return 'text-red-500'
    case 'inactive':
      return 'text-red-500'
    case 'unknown':
      return 'text-gray-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Computed property for sensor info items
 */
const sensorInfoItems = computed(() => {
  if (!selectedSensor.value) {
    return [
      { label: 'Signal Strength', value: 'N/A', color: 'text-gray-500' },
      { label: 'Air Quality', value: 'Unknown', color: 'text-gray-500' },
      { label: 'Location', value: 'N/A', color: 'text-gray-500' },
    ]
  }

  const airQuality = getAirQuality(
    selectedSensor.value.temperature,
    selectedSensor.value.relative_humidity
  )

  return [
    {
      label: 'Signal Strength',
      value: '5/5',
      color: getSignalStrengthColor(5),
    },
    {
      label: 'Air Quality',
      value: airQuality,
      color: getAirQualityColor(airQuality),
    },
    {
      label: 'Location',
      value: selectedSensor.value.ecohub_location || 'Unknown',
      color: 'text-gray-900',
    },
  ]
})

useResizeObserver(scrollContainer, (entries) => {
  const entry = entries[0]
  if (entry) {
    chartWidth.value = entry.contentRect.width - margin.left - margin.right
  }
})
const dateRangeForSensorQuery = ref({
  start: sub(new Date(), { days: 30 }),
  end: new Date(),
})
// Modify the loading states and data loaded state
const loadingStates = ref<Record<string, boolean>>({})

// Add a function to load sensor data
const loadSensorDataWithState = async (sensorId: string) => {
  if (!sensorId) return

  try {
    loadingStates.value[sensorId] = true
    dataLoaded.value = false

    // Clear existing data first
    if (sensorDataStore.clearSensorData) {
      sensorDataStore.clearSensorData(sensorId)
    }

    // Load new data
    await sensorDataStore.loadSensorData(
      sensorId,
      dateRangeForSensorQuery.value
    )

    // Wait for the next tick to ensure DOM updates
    await nextTick()

    // Reset charts only after data is loaded
    if (sensorData.value[sensorId]) {
      resetAllCharts()
      dataLoaded.value = true
    }
  } catch (error) {
    console.error(`Error loading data for sensor ${sensorId}:`, error)
    dataLoaded.value = false
  } finally {
    loadingStates.value[sensorId] = false
  }
}
watch(
  dateRangeForSensorQuery,
  async (newRange, oldRange) => {
    if (selectedSensor.value?.moduleid) {
      await loadSensorDataWithState(selectedSensor.value.moduleid)
    }
  },
  { deep: true }
)

// Modify the watch on selectedSensor
watch(
  selectedSensor,
  async (newSensor, oldSensor) => {
    if (newSensor?.moduleid) {
      // If we already have data for this sensor and it's loading, don't reload
      if (
        sensorData.value[newSensor.moduleid] &&
        loadingStates.value[newSensor.moduleid]
      ) {
        return
      }

      await loadSensorDataWithState(newSensor.moduleid)
    }
  },
  { immediate: true }
)

// Modify the onMounted hook
onMounted(async () => {
  if (selectedSensor.value?.moduleid) {
    await loadSensorDataWithState(selectedSensor.value.moduleid)
  }
})

/**
 * Closes the sensor detail modal
 */
const closeSensorDetail = () => {
  toggleSensorDetail()
}

/**
 * Navigates back to the dashboard
 */
const goBackToDashboard = () => {
  toggleSensorDetail()
  dashboardStore.toggleDashboard()
}

/**
 * Updates the global date range for all charts
 * @param {Date[]} range - The new date range
 */
const updateGlobalDateRange = (range) => {
  globalDateRange.value = range
  updateDataDashboardValues('dateRange', range)
}

/**
 * Resets all charts to their initial state
 */
const resetAllCharts = () => {
  globalDateRange.value = []
  updateDataDashboardValues('dateRange', [])

  if (selectedSensor.value && sensorData.value[selectedSensor.value.moduleid]) {
    const currentData = sensorData.value[selectedSensor.value.moduleid]
    Object.keys(metrics.value).forEach((metricName) => {
      if (currentData[metricName]) {
        updateDataDashboardValues(metricName, currentData[metricName])
      }
    })
  }

  chartWidth.value = chartWidth.value + 1
}

/**
 * Formats a date range into a string
 * @param {Date[]} range - The date range to format
 * @returns {string} Formatted date range string
 */
const formatDateRange = (range) => {
  if (range.length !== 2) return ''
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    })
  }
  return `${formatDate(range[0])} - ${formatDate(range[1])}`
}

/**
 * Shows details for a specific stat
 * @param {string} statKey - The key of the stat to show details for
 */
const showStatDetails = (statKey) => {}

/**
 * Gets the color for a value based on its key and value
 * @param {string} key - The key of the value
 * @param {string|number} value - The value to get the color for
 * @returns {string} The color class for the value
 */
const getValueColor = (key, value) => {
  if (key === 'Temperature') {
    const temp = parseFloat(value)
    if (temp < 10) return 'text-blue-500'
    if (temp > 30) return 'text-red-500'
    return 'text-green-500'
  }
  if (key === 'Humidity') {
    const humidity = parseFloat(value)
    if (humidity < 30) return 'text-yellow-500'
    if (humidity > 70) return 'text-blue-500'
    return 'text-green-500'
  }
  return 'text-blue-500'
}

/**
 * Gets the color for signal strength
 * @param {number|string} value - The signal strength value
 * @returns {string} The color class for the signal strength
 */
const getSignalStrengthColor = (value) => {
  const strength = parseInt(value)
  if (strength <= 2) return 'text-red-500'
  if (strength <= 3) return 'text-yellow-500'
  return 'text-green-500'
}

/**
 * Gets the color for soil moisture
 * @param {number|string} value - The soil moisture value
 * @returns {string} The color class for the soil moisture
 */
const getSoilMoistureColor = (value) => {
  const moisture = parseFloat(value)
  if (moisture < 30) return 'text-red-500'
  if (moisture < 60) return 'text-yellow-500'
  return 'text-green-500'
}

/**
 * Initializes the mini map
 * This is a placeholder function that can be overridden by parent components
 */
const initMiniMap = () => {}

/**
 * Computed property for chart data
 * @type {import('vue').ComputedRef<Object>}
 */
const chartData = computed(() => {
  const sensorId = selectedSensor.value?.moduleid
  if (!sensorId || !sensorData.value[sensorId]) {
    return {}
  }

  const sensorMetrics = sensorData.value[sensorId]
  const result = {}

  Object.entries(metrics.value).forEach(([metricName, metric]) => {
    const metricData = sensorMetrics[metricName]
    if (metricData?.data && Array.isArray(metricData.data)) {
      // 确保数据有效性
      const validData = metricData.data
        .filter((d) => {
          if (!d || !d.date || d.value === undefined || d.value === null) {
            console.debug(`Invalid data point for ${metricName}:`, d)
            return false
          }
          const value = Number(d.value)
          if (isNaN(value)) {
            console.debug(`NaN value for ${metricName}:`, d)
            return false
          }
          return true
        })
        .map((d) => ({
          date:
            typeof d.date === 'string' && /^\d+$/.test(d.date)
              ? new Date(parseInt(d.date)).toISOString()
              : new Date(d.date).toISOString(),
          value: Number(d.value),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      if (validData.length > 0) {
        result[metricName] = {
          data: validData,
          min: Math.min(...validData.map((d) => d.value)),
          max: Math.max(...validData.map((d) => d.value)),
        }
      } else {
        console.debug(`No valid data for ${metricName}`)
      }
    }
  })

  return result
})

const shouldRenderChart = (metricName: string) => {
  return (
    selectedDatasets.value.includes(metricName) &&
    chartData.value[metricName]?.data?.length > 0 &&
    !loadingStates.value[selectedSensor.value?.moduleid]
  )
}

/**
 * Temperature unit for sensor statistics
 * @type {import('vue').Ref<string>}
 */
const temperatureUnit = ref('C')
</script>
