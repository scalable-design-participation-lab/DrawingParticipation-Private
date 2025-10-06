<!--
 * SensorTile Component
 * 
 * This component represents an individual sensor tile in the dashboard.
 * It displays key information about a sensor, including its location,
 * status, battery level, and specific sensor readings (e.g., temperature,
 * humidity). The component is designed to be reusable and customizable,
 * allowing for custom color schemes and configurable display fields.
 * 
 * @displayName SensorTile
 * @usage
 * <SensorTile
 *   :sensor="sensorData"
 *   :showDetails="true"
 *   :customColors="colorScheme"
 *   :displayFields="['temperature', 'humidity']"
 *   @open-details="handleOpenDetails"
 * />
 -->
<template>
  <UCard
    class="flex flex-col h-full min-h-[250px] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
    hover
  >
    <div class="flex flex-col h-full">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ sensor.location }}
          </h3>
          <UBadge :color="getStatusColor(sensor.status)" class="mt-1">
            {{ sensor.status }}
          </UBadge>
        </div>
        <div class="flex items-center">
          <UIcon
            name="i-heroicons-battery-50"
            class="w-6 h-6 mr-1"
            :class="getBatteryIconColor(sensor.batteryLevel)"
          />
          <span class="text-sm font-semibold">{{ sensor.batteryLevel }}%</span>
        </div>
      </div>

      <UCard class="bg-gray-50 p-3 flex-grow">
        <div class="grid grid-cols-2 gap-4 text-sm h-full">
          <div
            v-for="field in displayFields"
            :key="field"
            class="text-center flex flex-col justify-center"
          >
            <span
              class="text-xl font-bold"
              :class="getValueColor(field, sensor[field])"
            >
              {{ formatValue(field, sensor[field]) }}
            </span>
            <p class="text-xs text-gray-600 dark:text-white">
              {{ formatLabel(field) }}
            </p>
          </div>
        </div>
      </UCard>

      <UButton
        v-if="showDetails"
        color="primary"
        variant="ghost"
        class="mt-4 self-center transition-colors duration-300 hover:bg-blue-100"
        @click="$emit('open-details', sensor.id)"
      >
        Details
        <template #trailing>
          <UIcon name="i-heroicons-arrow-right" />
        </template>
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Represents a sensor with its properties.
 * @typedef {Object} Sensor
 * @property {string} id - Unique identifier for the sensor
 * @property {string} location - Location of the sensor
 * @property {string} status - Current status of the sensor
 * @property {number} batteryLevel - Battery level of the sensor (0-100)
 * @property {number} [temperature] - Temperature reading in Celsius (optional)
 * @property {number} [humidity] - Humidity reading in percentage (optional)
 * @property {string} [airQuality] - Air quality status (optional)
 * @property {string} [soilMoisture] - Soil moisture level (optional)
 */

/**
 * Custom color configurations for the sensor tile.
 * @typedef {Object} CustomColors
 * @property {Object.<string, string>} [status] - Custom colors for status
 * @property {Object.<string, string>} [battery] - Custom colors for battery levels
 * @property {Object.<string, Object.<string, string>>} [values] - Custom colors for sensor values
 */

/**
 * Props for the SensorTile component.
 * @typedef {Object} SensorTileProps
 * @property {Sensor} sensor - The sensor object to display
 * @property {boolean} [showDetails=true] - Whether to show the details button
 * @property {CustomColors} [customColors={}] - Custom color configurations
 * @property {string[]} [displayFields=['temperature', 'humidity', 'airQuality', 'soilMoisture']] - Fields to display
 */

/**
 * SensorTile component props
 * @type {SensorTileProps}
 */
const props = defineProps({
  sensor: {
    type: Object as () => Sensor,
    required: true,
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
  customColors: {
    type: Object as () => CustomColors,
    default: () => ({}),
  },
  displayFields: {
    type: Array as () => string[],
    default: () => ['temperature', 'humidity', 'airQuality', 'soilMoisture'],
  },
})

const emit = defineEmits(['open-details'])

/**
 * Determines the color for the battery icon based on the battery level.
 * @param {number} value - The battery level (0-100)
 * @returns {string} The CSS class for the battery icon color
 */
const getBatteryIconColor = (value: number) => {
  if (props.customColors.battery) {
    return props.customColors.battery[
      value < 30 ? 'low' : value < 70 ? 'medium' : 'high'
    ]
  }
  if (value < 30) return 'text-red-500'
  if (value < 70) return 'text-yellow-500'
  return 'text-green-500'
}

/**
 * Determines the color for the status badge based on the sensor status.
 * @param {string} status - The sensor status
 * @returns {string} The color for the status badge
 */
const getStatusColor = (status: string) => {
  if (props.customColors.status && props.customColors.status[status]) {
    return props.customColors.status[status]
  }
  switch (status) {
    case 'Active':
      return 'green'
    case 'Inactive':
      return 'red'
    case 'Maintenance':
      return 'yellow'
    default:
      return 'gray'
  }
}

/**
 * Formats the sensor value for display.
 * @param {string} key - The sensor field key
 * @param {number|string} value - The sensor value
 * @returns {string} The formatted value for display
 */
const formatValue = (key: string, value: number | string) => {
  if (key === 'temperature') return `${Number(value).toFixed(1)}°C`
  if (key === 'humidity') return `${Number(value).toFixed(1)}%`
  return value
}

/**
 * Formats the label for a sensor field.
 * @param {string} key - The sensor field key
 * @returns {string} The formatted label
 */
const formatLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
}

/**
 * Determines the color for a sensor value based on its range.
 * @param {string} key - The sensor field key
 * @param {number} value - The sensor value
 * @returns {string} The CSS class for the value color
 */
const getValueColor = (key: string, value: number) => {
  if (props.customColors.values && props.customColors.values[key]) {
    const colorRanges = props.customColors.values[key]
    for (const [range, color] of Object.entries(colorRanges)) {
      const [min, max] = range.split('-').map(Number)
      if (value >= min && value <= max) return color
    }
  }

  if (key === 'temperature') {
    if (value < 10) return 'text-blue-500'
    if (value > 30) return 'text-red-500'
    return 'text-green-500'
  }
  if (key === 'humidity') {
    if (value < 30) return 'text-yellow-500'
    if (value > 70) return 'text-blue-500'
    return 'text-green-500'
  }
  return 'text-blue-500'
}
</script>
