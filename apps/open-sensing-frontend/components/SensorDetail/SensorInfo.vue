<!--
 * SensorInfo Component
 * 
 * This component displays detailed information about a sensor,
 * including signal strength, air quality, soil moisture, and timestamps.
 * 
 * @displayName SensorInfo
 * @usage
 * <SensorInfo :selected-sensor="sensorData" />
 -->

<template>
  <UCard class="flex-1">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Sensor Information
      </h3>
    </template>

    <div class="space-y-4">
      <div
        v-for="item in sensorInfoItems"
        :key="item.label"
        class="flex justify-between items-center"
      >
        <span class="text-gray-600 dark:text-gray-300">{{ item.label }}</span>
        <span
          v-if="item.label === 'Air Quality Index'"
          class="font-semibold"
          :style="{ color: item.color || 'inherit' }"
        >
          {{ item.value || 'N/A' }}
        </span>
        <span v-else :class="[item.color, 'dark:text-white']">
          {{ item.value || 'N/A' }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Sensor } from '../../stores/sensorDetail'
import { useAqiStore } from '../../stores/useAqi'

interface Props {
  selectedSensor: Sensor | null
}
const props = defineProps<Props>()

/**
 * Gets the color for signal strength
 * @param {number} value - The signal strength value
 * @returns {string} The color class for the signal strength
 */
const getSignalStrengthColor = (value: number | null): string => {
  if (value === null) return 'text-gray-500'
  if (value <= 2) return 'text-red-500'
  if (value <= 3) return 'text-yellow-500'
  return 'text-green-500'
}

const aqiStore = useAqiStore()
const moduleId = computed(() => props.selectedSensor?.moduleid ?? '')

watch(
  moduleId,
  async (id) => {
    if (!id) return
    if (!aqiStore.byModule[id]) {
      await aqiStore.fetchAQI(id)
    }
  },
  { immediate: true }
)

const aqiData = computed(() =>
  moduleId.value ? aqiStore.byModule[moduleId.value] ?? null : null
)
const aqiLoading = computed(() => aqiStore.loading)
const aqiError = computed(() => aqiStore.error)

const sensorInfoItems = computed(() => {
  if (!props.selectedSensor) {
    return [
      { label: 'Signal Strength', value: 'N/A', color: 'text-gray-500' },
      { label: 'Air Quality Index', value: 'Unknown', color: '#9ca3af' },
      { label: 'Location', value: 'N/A', color: 'text-gray-500' },
    ]
  }

  let aqiLabel = 'Loading…'
  let aqiColor = '#9ca3af'

  if (!aqiLoading.value) {
    if (aqiError.value) {
      aqiLabel = 'Unavailable'
    } else if (aqiData.value && aqiData.value.aqi != null) {
      aqiLabel = `${aqiData.value.aqi} (${aqiData.value.category})`
      aqiColor = aqiData.value.color || '#9ca3af'
    } else {
      aqiLabel = 'Unavailable'
    }
  }

  return [
    {
      label: 'Signal Strength',
      value: '5/5',
      color: getSignalStrengthColor(5),
    },
    {
      label: 'Air Quality Index',
      value: aqiLabel,
      color: aqiColor,
    },
    {
      label: 'Location',
      value: props.selectedSensor.ecohub_location || 'Unknown',
      color: 'text-gray-900',
    },
  ]
})
</script>
