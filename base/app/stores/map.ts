import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MapType } from './types/store'

/**
 * Pinia store for managing the UI state of a map.
 * This includes properties like the map type, button colors, etc.
 */
export const useMapStore = defineStore('map', () => {
  /**
   * The current type of the map.
   * Possible values: `'vector'` | `'satellite'`.
   */
  const mapType = ref<MapType>('vector')

  /**
   * Sets the type of the map.
   *
   * @param type - The type of map to set. Must be one of `'vector'`, `'satellite'`.
   */
  function setMapType(type: MapType): void {
    mapType.value = type
  }

  return {
    mapType,
    setMapType,
  }
})
