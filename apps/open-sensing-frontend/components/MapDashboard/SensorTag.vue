<!--
 * SensorTag Component
 * 
 * This component displays detailed information about a selected sensor on a map.
 * It is designed to be positioned dynamically based on the sensor's location on the screen.
 * The component shows various sensor readings such as temperature, humidity, air quality,
 * and battery level, and provides navigation controls to switch between sensors.
 * 
 * @displayName SensorTag
 * @usage
 * <SensorTag
 *   :markerPosition="{ x: 100, y: 200 }"
 * />
 -->
<template>
  <UCard
    class="w-[280px] z-[1000] pointer-events-auto absolute"
    :ui="cardStyle"
    :style="positionStyle"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex gap-2">
          <UButton
            data-testid="previous-sensor"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            @click="sensorDetailStore.selectPreviousSensor"
          />
          <UButton
            data-testid="next-sensor"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-right"
            @click="sensorDetailStore.selectNextSensor"
          />
        </div>
        <div class="flex gap-2">
          <UButton
            data-testid="open-detail"
            color="primary"
            variant="ghost"
            icon="i-heroicons-arrow-top-right-on-square"
            @click="openSensorDetail"
          />
          <UButton
            data-testid="close-info"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="sensorDetailStore.closeSensorInfo"
          />
        </div>
      </div>
    </template>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-1">{{ selectedSensor.location }}</h3>
      <span class="text-sm text-gray-500 block mb-4">
        Last updated: {{ selectedSensor.timestamp }}
      </span>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center">
          <UIcon name="i-heroicons-beaker" class="mr-2 text-gray-600" />
          <span>{{ selectedSensor.temperature.toFixed(1) }}°C</span>
        </div>
        <div class="flex items-center">
          <UIcon name="i-heroicons-cloud" class="mr-2 text-gray-600" />
          <span>{{ selectedSensor.humidity.toFixed(1) }}%</span>
        </div>
        <div class="flex items-center">
          <UIcon name="i-heroicons-sparkles" class="mr-2 text-gray-600" />
          <span>{{ selectedSensor.airQuality }}</span>
        </div>
        <div class="flex items-center">
          <UIcon name="i-heroicons-battery-50" class="mr-2 text-gray-600" />
          <span>{{ selectedSensor.batteryLevel }}%</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import { useSensorDetailStore } from '../../stores/sensorDetail'
import type { Sensor } from '../../stores/sensorDetail'

interface MarkerPosition {
  x: number
  y: number
}

interface FormattedSensor {
  id: string
  moduleid: string
  location: string
  temperature: number
  humidity: number
  airQuality: string
  batteryLevel: number
  timestamp: string
}

const props = defineProps({
  markerPosition: {
    type: Object as PropType<MarkerPosition>,
    required: true,
  },
})

const sensorDetailStore = useSensorDetailStore()

const selectedSensor = computed(() => {
  const sensor = sensorDetailStore.selectedSensor
  if (!sensor) return null

  const timestamp = new Date(sensor.timestamp)
  timestamp.setHours(timestamp.getHours())

  return {
    id: sensor.moduleid,
    moduleid: sensor.moduleid,
    location: sensor.ecohub_location,
    temperature: sensor.temperature,
    humidity: sensor.relative_humidity,
    airQuality: getAirQuality(sensor.temperature, sensor.relative_humidity),
    batteryLevel: 100,
    timestamp: timestamp.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }
})

function getAirQuality(temperature: number, humidity: number): string {
  if (temperature === 0 && humidity === 0) return 'Inactive'
  if (temperature > 30 || humidity > 80) return 'Poor'
  if (temperature > 25 || humidity > 70) return 'Moderate'
  return 'Good'
}

const {
  toggleSensorDetail,
  closeSensorInfo,
  selectNextSensor,
  selectPreviousSensor,
} = sensorDetailStore

const positionStyle = computed(() => {
  const { x, y } = props.markerPosition
  const offset = 10
  const infoWidth = 280
  const infoHeight = 250

  let left = x + offset
  let top = y + offset

  if (typeof window !== 'undefined') {
    const { innerWidth, innerHeight } = window
    if (left + infoWidth > innerWidth) {
      left = x - infoWidth - offset
    }
    if (top + infoHeight > innerHeight) {
      top = y - infoHeight - offset
    }
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

const cardStyle = {
  base: 'bg-white dark:bg-gray-800 shadow-lg',
  body: 'p-0',
  header: 'p-3 border-b border-gray-200 dark:border-gray-700',
}

const openSensorDetail = () => {
  sensorDetailStore.toggleSensorDetail()
}
</script>
