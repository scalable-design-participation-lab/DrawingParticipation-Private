<!--
 * SensorStats Component
 * 
 * This component displays a grid of sensor statistics, including temperature,
 * humidity, VOC, NOx, and PM2.5 levels. Each statistic is clickable to show more details.
 * 
 * @displayName SensorStats
 * @usage
 * <SensorStats :sensor-stats="sensorStatistics" @show-stat-details="handleStatDetails" />
 -->

<template>
  <UCard>
    <div class="sensor-stats grid grid-cols-5 gap-6">
      <div
        v-for="(value, key) in sensorStats"
        :key="key"
        class="stat-item bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center transform hover:scale-105 transition-transform cursor-pointer"
        :data-testid="`stat-item-${key}`"
        @click="$emit('show-stat-details', key)"
      >
        <h3
          class="text-2xl font-bold"
          :class="[getValueColor(key, value), 'dark:text-white']"
          data-testid="stat-value"
        >
          {{ value }}
        </h3>
        <p
          class="text-sm text-gray-600 dark:text-gray-300 mt-2"
          data-testid="stat-key"
        >
          {{ key }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
/**
 * Props for the SensorStats component
 * @typedef {Object} SensorStatsProps
 * @property {Object.<string, string|number>} sensorStats - Object containing sensor statistics
 */

/**
 * Component props
 * @type {SensorStatsProps}
 */
const props = defineProps({
  sensorStats: {
    type: Object,
    required: true,
  },
  temperatureUnit: {
    type: String,
    default: 'C',
  },
})

/**
 * Emits an event when a statistic is clicked
 */
defineEmits(['show-stat-details'])

/**
 * Gets the color for a sensor value based on its key and value
 * @param {string} key - The key of the sensor value
 * @param {string|number} value - The sensor value
 * @returns {string} The CSS color class
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
</script>
