import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDatasetStore = defineStore('dataset', () => {
  const locations = [
    'Architecture Studios',
    'Cabot Center',
    'Cargill Hall',
    'Carter Playground',
    'Centennial Common',
    'Columbus Garage',
    'Curry Student Center',
    'Forsyth Building',
    'Gainsborough Garage',
    'Gainsborough Garage Roof',
    'ISEC Terrace',
    'Matthews Arena',
    'Robinson Hall',
    'Snell Library Quad',
  ]

  const existingHubs = ref(
    Object.fromEntries(locations.map((loc) => [loc, true]))
  )
  const existingDatasets = ref({
    Temperature: true,
    'Relative Humidity': true,
    'VOC (ppb)': true,
    'NOx (ppb)': true,
    pm1: true,
    pm25: true,
    pm4: true,
    pm10: true,
    scd_temp: true,
    scd_humid: true,
    scd_co2: true,
  })

  const updateExistingHubs = (newHubs) => {
    existingHubs.value = { ...newHubs }
  }

  const updateExistingDatasets = (newDatasets) => {
    existingDatasets.value = { ...newDatasets }
  }

  const toggleDataset = (datasetKey) => {
    existingDatasets.value[datasetKey] = !existingDatasets.value[datasetKey]
  }

  const toggleHub = (hubKey) => {
    existingHubs.value[hubKey] = !existingHubs.value[hubKey]
  }

  const selectedHubs = computed(() =>
    Object.keys(existingHubs.value).filter(
      (hub) => existingHubs.value[hub] == true
    )
  )

  const selectedDatasets = computed(() => {
    if (Object.keys(existingDatasets.value).length === 0) return []
    return Object.keys(existingDatasets.value).filter(
      (dataset) => existingDatasets.value[dataset] === true
    )
  })

  const hubsList = computed(() => Object.keys(existingHubs.value))

  return {
    existingHubs,
    existingDatasets,
    updateExistingHubs,
    updateExistingDatasets,
    toggleDataset,
    toggleHub,
    selectedHubs,
    selectedDatasets,
    hubsList,
  }
})
