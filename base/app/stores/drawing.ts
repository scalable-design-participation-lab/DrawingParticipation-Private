import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useSideBarStore } from './sidebar'
import { useUserStore } from './user'
import type { DrawType, Feature, FrequencyType, IconType } from './types/store'
import { useFeatureStore } from './features'

/**
 * Pinia store for managing drawing-related functionality.
 * This store allows enabling/disabling drawing modes, setting drawing types,
 * and storing geospatial features such as Points, LineStrings, and Polygons.
 */
export const useDrawingStore = defineStore('drawing', () => {
  // Reactive state variables
  const drawEnable = ref(false) // Whether drawing is enabled
  const drawType = ref<DrawType>('Point') // Current drawing geometry type
  const isProhibitDrawing = ref(false) // Indicates if the current drawing is a prohibited feature

  // External stores
  const sideBarStore = useSideBarStore()
  const {
    currentBelongingIcon,
    currentSafetyIcon,
    currentEnvironmentIcon,
    currentFrequency,
  } = storeToRefs(sideBarStore)
  const { setBelongingIcon, setSafetyIcon, setEnvironmentIcon, setFrequency } = sideBarStore
  const { userData } = useUserStore()
  const { features } = useFeatureStore()

  /**
   * Activates a drawing mode for a specific geometry type.
   *
   * @param frequency - The frequency of the geometry type (e.g., "every day", "every week", etc).
   */
  function activateDrawing(frequency: FrequencyType): void {
    setFrequency(frequency)
    drawType.value = 'Point'
    drawEnable.value = true
  }

  /**
   * Handles the completion of a drawing operation.
   * Adds the drawn feature (Point, LineString, or Polygon) to the `features` array.
   *
   * @param event - The event object emitted by the drawing library.
   * @param event.feature - The drawn feature object.
   * @param event.feature.getGeometry - A function to retrieve the geometry of the drawn feature.
   */
  function handleDrawEnd(event: { feature: { getGeometry: () => { getType: () => string, getCoordinates: () => [number, number][] | [number, number] } } }): void {
    const feature = event.feature
    const geometryType = feature.getGeometry().getType()
    const timestamp = new Date().toISOString()
    const coordinates = feature.getGeometry().getCoordinates()

    switch (geometryType) {
      case 'Point': {
        const pointCoordinates = coordinates as [number, number]
        const feature: Feature = {
          id: Date.now(),
          type: 'Point' as DrawType,
          coordinates: pointCoordinates,
          comment: '',
          name: userData
            ? {
                firstname: userData.firstname,
                lastname: userData.lastname,
              }
            : null,
          timestamp,
        }

        // Add conditional properties
        if (isProhibitDrawing.value) {
          feature.isProhibit = true
          isProhibitDrawing.value = false
        }
        else {
          feature.iconName = currentSafetyIcon.value || currentBelongingIcon.value || currentEnvironmentIcon.value
          feature.frequency = currentFrequency.value
        }
        // Push the feature to the array
        features.push(feature)
        break
      }
      case 'LineString': {
        const lineCoordinates = coordinates as [number, number][]
        const feature: Feature = {
          id: Date.now(),
          type: 'LineString',
          coordinates: lineCoordinates,
          comment: '',
          name: userData
            ? {
                firstname: userData.firstname,
                lastname: userData.lastname,
              }
            : null,
          timestamp,
        }

        features.push(feature)
        break
      }
      case 'Polygon': {
        const polygonCoordinates = coordinates as [number, number][]
        const feature: Feature = {
          id: Date.now(),
          type: 'Polygon',
          coordinates: polygonCoordinates,
          comment: '',
          name: userData
            ? {
                firstname: userData.firstname,
                lastname: userData.lastname,
              }
            : null,
          timestamp,
        }

        features.push(feature)
        break
      }
      default:
        console.warn(`Unsupported geometry type: ${geometryType}`)
        break
    }

    // Reset drawing state
    drawEnable.value = false
    setBelongingIcon(null)
    setSafetyIcon(null)
    setEnvironmentIcon(null)
    setFrequency(null)
  }

  /**
   * Logs the start of a drawing operation.
   *
   * @param event - The event object emitted by the drawing library.
   */
  function handleDrawStart(event: unknown): void {
    console.log('Drawing started', event)
  }

  /**
   * Activates the drawing mode for a belonging-related Point feature.
   *
   * @param iconName - The icon name associated with the belonging feature.
   */
  function activateBelongingDrawing(iconName: IconType): void {
    setBelongingIcon(iconName)
    drawType.value = 'Point'
    drawEnable.value = true
  }

  /**
   * Activates the drawing mode for a safety-related Point feature.
   *
   * @param iconName - The icon name associated with the safety feature.
   */
  function activateSafetyDrawing(iconName: IconType): void {
    setSafetyIcon(iconName)
    drawType.value = 'Point'
    drawEnable.value = true
  }

  /**
   * Activates the drawing mode for an environment-related Point feature.
   *
   * @param iconName - The icon name associated with the environment feature.
   */
  function activateEnvironmentDrawing(iconName: IconType): void {
    setEnvironmentIcon(iconName)
    drawType.value = 'Point'
    drawEnable.value = true
  }

  /**
   * Activates the drawing mode for a Polygon feature.
   */
  function activatePolygonDrawing(): void {
    drawType.value = 'Polygon'
    drawEnable.value = true
    setFrequency(null)
  }

  /**
   * Activates the drawing mode for a LineString feature.
   */
  function activateLineStringDrawing(): void {
    drawType.value = 'LineString'
    drawEnable.value = true
    setFrequency(null)
  }

  /**
   * Activates the drawing mode for a prohibited Point feature.
   */
  function activateProhibitDrawing(): void {
    drawType.value = 'Point'
    drawEnable.value = true
    isProhibitDrawing.value = true
  }

  return {
    drawEnable,
    drawType,
    isProhibitDrawing,
    activateDrawing,
    handleDrawEnd,
    handleDrawStart,
    activateBelongingDrawing,
    activateSafetyDrawing,
    activateEnvironmentDrawing,
    activatePolygonDrawing,
    activateLineStringDrawing,
    activateProhibitDrawing,
  }
})
