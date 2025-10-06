import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapStore = defineStore('map', () => {
  const mapType = ref('satellite')
  const mapCenter = ref(null)

  const setMapType = (type) => {
    mapType.value = type
  }

  const updateMapCenter = (center) => {
    mapCenter.value = center
  }

  return {
    mapType,
    mapCenter,
    setMapType,
    updateMapCenter,
  }
})
