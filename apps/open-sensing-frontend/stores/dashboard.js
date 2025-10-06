import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSensorDetailStore } from './sensorDetail'

export const useDashboardStore = defineStore('dashboard', () => {
  const sensorDetailStore = useSensorDetailStore()
  const showDashboard = ref(false)
  const dataDashboardValues = ref({
    time: [0, 24],
    temperature: [],
    heat_index: [],
    relative_humidity: [],
    pm25: [],
    pm10: [],
    dateRange: [],
    dateRangeValues: [],
  })
  const dateRangeUpdate = ref(null)

  const toggleDashboard = () => {
    showDashboard.value = !showDashboard.value
    sensorDetailStore.showSensorDetail = false
    sensorDetailStore.showSensorInfo = false
  }

  const updateDataDashboardValues = (dataType, data) => {
    dataDashboardValues.value[dataType] = data
  }

  const updateDateRangeUpdate = (date) => {
    dateRangeUpdate.value = date
  }

  return {
    showDashboard,
    dataDashboardValues,
    dateRangeUpdate,
    toggleDashboard,
    updateDataDashboardValues,
    updateDateRangeUpdate,
  }
})
