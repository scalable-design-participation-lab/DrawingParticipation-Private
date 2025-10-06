import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SENSOR_METRICS } from '../constants/metrics'
import { processDataPoint, validateAndSortData } from '../utils/dataProcessing'
import { subMonths } from 'date-fns'

export interface SensorDataPoint {
  date: string
  value: number
}

export interface MetricData {
  data: SensorDataPoint[]
  min: number
  max: number
}

export interface SensorMetrics {
  [key: string]: MetricData
}

export interface SensorDataStore {
  sensorData: Record<string, SensorMetrics>
  isLoading: boolean
  loadSensorData: (
    sensorId: string,
    dateRange?: { start: Date; end: Date },
    force?: boolean
  ) => Promise<void>
  clearSensorData: (sensorId: string) => void
  clearAllSensorData: () => void
}

export const useSensorDataStore = defineStore('sensorData', () => {
  const sensorData = ref<Record<string, SensorMetrics>>({})
  const isLoading = ref(false)
  const lastFetchTime = ref<Record<string, number>>({})
  const cacheTime = 5400000 // 1h30m

  const loadSensorData = async (
    moduleId: string,
    dateRange: { start: Date; end: Date } = {
      start: subMonths(new Date(), 1),
      end: new Date(),
    },
    force = false
  ) => {
    if (isLoading.value) return

    // Check cache
    if (
      !force &&
      sensorData.value[moduleId] &&
      lastFetchTime.value[moduleId] &&
      Date.now() - lastFetchTime.value[moduleId] < cacheTime
    ) {
      return
    }

    isLoading.value = true
    try {
      const response = await $fetch('/api/sensor-data', {
        params: {
          moduleId,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      })

      if (!response || typeof response !== 'object') {
        console.warn(`Invalid response for sensor ${moduleId}`)
        return
      }

      const { moduleInfo: info, sensorData: data } = response

      if (!Array.isArray(data)) {
        console.warn(`Invalid data format for sensor ${moduleId}`)
        return
      }

      const processedData: SensorMetrics = {}

      Object.entries(SENSOR_METRICS).forEach(([key, metric]) => {
        const processedPoints = data
          .map((d) => processDataPoint(d, metric.name))
          .filter((d): d is ProcessedDataPoint => d !== null)

        if (processedPoints.length > 0) {
          const sortedData = validateAndSortData(processedPoints)
          const values = sortedData.map((d) => d.value)

          processedData[key] = {
            data: sortedData,
            min: Math.min(...values),
            max: Math.max(...values),
          }
        }
      })

      if (Object.keys(processedData).length > 0) {
        sensorData.value[moduleId] = processedData
        lastFetchTime.value[moduleId] = Date.now()
      } else {
        console.warn(`No valid data found for sensor ${moduleId}`)
      }
    } catch (error) {
      console.error(`Error loading data for sensor ${moduleId}:`, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const clearSensorData = (sensorId: string) => {
    if (sensorData.value[sensorId]) {
      delete sensorData.value[sensorId]
      delete lastFetchTime.value[sensorId]
    }
  }

  const clearAllSensorData = () => {
    sensorData.value = {}
    lastFetchTime.value = {}
  }

  return {
    sensorData,
    isLoading,
    loadSensorData,
    clearSensorData,
    clearAllSensorData,
  }
})
