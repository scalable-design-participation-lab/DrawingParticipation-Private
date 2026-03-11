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

  // default values
  const originalCenter = ref([3172858.2941718884, 6317486.347640147])
  const originalZoom = ref(12.83)

  /**
   * Sets the original center of the map in Web Mercator coords.
   *
   * @param center - The coords in web mercator style.
   */
  function setOriginalCenter(center: number[]): void {
    originalCenter.value = center
  }

    /**
   * Sets the original center of the map in Web Mercator coords.
   *
   * @param zoom - the zoom ratio
   */
  function setOriginalZoom(zoom: number): void {
    originalZoom.value = zoom
  }


  return {
    mapType,
    setMapType,
    originalCenter,
    originalZoom,
    setOriginalCenter,
    setOriginalZoom
  }
})
