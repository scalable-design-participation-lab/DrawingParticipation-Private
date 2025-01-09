import { defineStore } from 'pinia'
import { ref } from 'vue'

// Store for managing the UI state , eg. colors of buttons, map type, etc.
export const useMapStore = defineStore('map', () => {
  const mapType = ref('vector')
  function setMapType(type) {
    mapType.value = type
  }

  return {
    mapType,
    setMapType,
  }
})
