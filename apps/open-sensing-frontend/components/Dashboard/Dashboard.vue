<!--
 * Dashboard Component
 * 
 * This is the main dashboard component that provides an overview of all sensors.
 * It includes a header with summary statistics, and a grid of SensorTile components
 * representing individual sensors. The dashboard is responsive and handles the
 * overall layout and data management for the sensor monitoring system.
 * 
 * @displayName Dashboard
 * @usage
 * <Dashboard />
 -->

<template>
  <div
    class="fixed inset-0 flex justify-center items-center"
    @click="closeDashboard"
  >
    <div
      class="w-[85%] h-[73vh] max-w-[1800px] flex flex-col gap-5 overflow-hidden rounded-lg"
      @click.stop
    >
      <UCard
        class="flex-shrink-0 bg-white rounded-lg shadow-md hover:shadow-lg"
      >
        <template #header>
          <DashboardHeader
            title="Sensor Overview"
            :badge-text="`Updated: ${lastUpdated}`"
            badge-color="gray"
            @close="closeDashboard"
          />
        </template>
        <OverviewContent
          :description="overviewDescription"
          :stats="overviewStats"
        />
      </UCard>

      <div class="flex-grow overflow-y-auto">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <SensorTile
            v-for="sensor in sensors"
            :key="sensor.moduleid"
            :sensor="formatSensorData(sensor)"
            :show-details="true"
            :custom-colors="customColors"
            :display-fields="displayFields"
            class="w-full h-full"
            @open-details="openSensorDetail"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSensorDetailStore } from '../../stores/sensorDetail'
import { useDashboardStore } from '../../stores/dashboard'
import SensorTile from './SensorTile.vue'
import OverviewContent from './OverviewContent.vue'
import DashboardHeader from './DashboardHeader.vue'

/**
 * Sensor Detail store instance
 * @type {import('@/stores/sensorDetail').SensorDetailStore}
 */
const sensorDetailStore = useSensorDetailStore()

/**
 * Dashboard store instance
 * @type {import('@/stores/dashboard').DashboardStore}
 */
const dashboardStore = useDashboardStore()

/**
 * Destructured sensors from the sensor detail store
 * @type {import('vue').Ref<Array<import('@/types').Sensor>>}
 */
const { sensors } = storeToRefs(sensorDetailStore)

/**
 * Description of the sensor data overview
 * @type {import('vue').Ref<string>}
 */
const overviewDescription = ref(
  'This dashboard provides an overview of all sensor data across the Northeastern University campus.'
)

/**
 * Computed property to get the latest update timestamp
 * @returns {string} Formatted date string of the latest update
 */
const lastUpdated = computed(() => {
  if (!sensors.value.length) return 'No data'
  const dates = sensors.value.map((sensor) => {
    const timestamp = new Date(sensor.timestamp)
    timestamp.setHours(timestamp.getHours() - 5)
    return timestamp.getTime()
  })
  const latestDate = new Date(Math.max(...dates))
  return latestDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
})

/**
 * Computed property to generate overview statistics
 * @returns {Array<{value: number, label: string}>} Array of statistic objects
 */
const overviewStats = computed(() => [
  {
    value: sensors.value.length,
    label: 'Total Sensors',
  },
  {
    value: displayFields.value.length,
    label: 'Measured Values',
  },
  {
    value: sensors.value.filter(
      (sensor) => sensor.temperature === 0 && sensor.relative_humidity === 0
    ).length,
    label: 'Inactive Sensors',
  },
])

/**
 * Opens the detail view for a specific sensor
 * @param {string} sensorId - The ID of the sensor to display details for
 */
const openSensorDetail = (sensorId: string): void => {
  sensorDetailStore.updateSelectedSensor(sensorId)
  sensorDetailStore.toggleSensorDetail()
}

/**
 * Custom color configurations for various sensor data representations
 * @type {Object}
 */
const customColors = {
  status: {
    Active: 'green',
    Inactive: 'red',
    Maintenance: 'yellow',
  },
  battery: {
    low: 'text-red-500',
    medium: 'text-yellow-500',
    high: 'text-green-500',
  },
  values: {
    temperature: {
      '0-15': 'text-blue-500',
      '16-25': 'text-green-500',
      '26-100': 'text-red-500',
    },
    humidity: {
      '0-30': 'text-yellow-500',
      '31-70': 'text-green-500',
      '71-100': 'text-blue-500',
    },
  },
}

/**
 * List of sensor data fields to display in the tiles
 * @type {import('vue').Ref<string[]>}
 */
const displayFields = ref([
  'temperature',
  'humidity',
  'airQuality',
  'soilMoisture',
])

const closeDashboard = () => {
  dashboardStore.toggleDashboard()
}

interface Sensor {
  moduleid: string
  ecohub_location: string
  lat: number
  lon: number
  temperature: number
  relative_humidity: number
  voc: number
  nox: number
  pm1: number
  pm25: number
  pm4: number
  pm10: number
  scd_temp: number
  scd_humid: number
  scd_co2: number
  timestamp: string
}

interface FormattedSensor {
  id: string
  moduleid: string
  location: string
  temperature: number
  humidity: number
  voc: number
  nox: number
  pm25: number
  scd_temp: number
  scd_humid: number
  scd_co2: number
  coordinates: [number, number] | null
  timestamp: string
  status: 'Active' | 'Inactive'
}

onMounted(async () => {
  await sensorDetailStore.loadSensors()
})

const formatSensorData = (sensor: Sensor): FormattedSensor => {
  // Convert UTC timestamp to UTC-5
  const timestamp = new Date(sensor.timestamp)
  timestamp.setHours(timestamp.getHours())

  return {
    id: sensor.moduleid,
    moduleid: sensor.moduleid,
    location: sensor.ecohub_location,
    temperature: sensor.temperature,
    humidity: sensor.relative_humidity,
    voc: sensor.voc,
    nox: sensor.nox,
    pm25: sensor.pm25,
    scd_temp: sensor.scd_temp,
    scd_humid: sensor.scd_humid,
    scd_co2: sensor.scd_co2,
    coordinates: sensor.lon && sensor.lat ? [sensor.lon, sensor.lat] : null,
    timestamp: timestamp.toLocaleString('en-US', {
      timeZone: 'America/New_York',
    }),
    status:
      sensor.temperature === 0 && sensor.relative_humidity === 0
        ? 'Inactive'
        : 'Active',
  }
}

defineOptions({
  name: 'SensorDashboard',
})
</script>
