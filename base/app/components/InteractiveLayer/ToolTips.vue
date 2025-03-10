<script setup lang="ts">
import { click, pointerMove } from 'ol/events/condition'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import type { Feature, Map } from 'ol'
import * as turf from '@turf/turf'

// Define TypeScript types
interface PopupState {
  coordinate: number[] | null
  feature: Feature | null
  content: Record<string, any>
  visible: boolean
  position: { x: number, y: number }
}

interface StyleOptions {
  radius: number
  fill: string
  stroke: {
    color: string
    width: number
  }
}

interface ToolTipsProps {
  mapInstance?: Map | null
  pointStyle?: StyleOptions
  clickTolerance?: number
  popupClass?: string
  hoverPopupClass?: string
  dataProjection?: string
  featuresProjection?: string
}

// Props with defaults
const props = withDefaults(defineProps<ToolTipsProps>(), {
  mapInstance: null,
  pointStyle: () => ({
    radius: 6,
    fill: 'rgba(0, 100, 255, 0.8)',
    stroke: {
      color: 'white',
      width: 2,
    },
  }),
  clickTolerance: 10,
  popupClass: 'bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-[300px]',
  hoverPopupClass: 'bg-gray-50 border-gray-300',
  dataProjection: 'EPSG:4326',
  featuresProjection: 'EPSG:3857',
})

// Setup state management using composable pattern
function usePopupState() {
  const state = reactive<PopupState>({
    coordinate: null,
    feature: null,
    content: {},
    visible: false,
    position: { x: 0, y: 0 },
  })

  const reset = () => {
    state.coordinate = null
    state.feature = null
    state.content = {}
    state.visible = false
    state.position = { x: 0, y: 0 }
  }

  const update = (feature: Feature | null, coordinates: number[] | null) => {
    if (!feature || !coordinates) {
      reset()
      return
    }

    state.coordinate = coordinates
    state.feature = feature

    // Extract properties
    const properties = feature.getProperties()
    const excludedKeys = ['geometry']
    state.content = Object.fromEntries(
      Object.entries(properties).filter(([key]) => !excludedKeys.includes(key)),
    )

    state.visible = true
  }

  return {
    state,
    reset,
    update,
  }
}

// Create separate states for hover and pinned popups
const hoverPopup = usePopupState()
const pinnedPopup = usePopupState()

// Store map instance and setup features
const mapInstance = ref<Map | null>(null)
function createHighlightStyle(feature: Feature) {
  const geomType = feature.getGeometry()?.getType()
  const styles = []

  if (geomType === 'Polygon') {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: 'yellow',
          width: 3,
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 0, 0.3)',
        }),
      }),
    )
  }
  if (geomType === 'MultiPolygon') {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: 'yellow',
          width: 3,
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 0, 0.3)',
        }),
      }),
    )
  }
  if (geomType === 'LineString') {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: 'yellow',
          width: 3,
        }),
      }),
    )
  }

  if (geomType === 'Point') {
    styles.push(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
          stroke: new Stroke({ color: 'yellow', width: 3 }),
        }),
      }),
    )
  }

  return styles
}

// Helper functions
const isInteractive = (feature: Feature) => Boolean(feature)

function getFeatureCentroid(feature: Feature): number[] | null {
  if (!feature)
    return null

  const geometry = feature.getGeometry()
  if (!geometry)
    return null

  const geomType = geometry.getType()
  const coordinates = geometry.getCoordinates()

  try {
    if (geomType === 'Polygon') {
      const polygon = turf.polygon(coordinates)
      const centroid = turf.centroid(polygon)
      return centroid.geometry.coordinates
    }
    if (geomType === 'MultiPolygon') {
      const multiPolygon = turf.multiPolygon(coordinates)
      const centroid = turf.centroid(multiPolygon)
      return centroid.geometry.coordinates
    }
    if (geomType === 'LineString') {
      const line = turf.lineString(coordinates)
      const centroid = turf.centroid(line)
      return centroid.geometry.coordinates
    }
    return coordinates
  }
  catch (error) {
    console.error('Error calculating centroid:', error)
    return coordinates
  }
}

function updatePopupPosition(coordinate: number[]) {
  if (!mapInstance.value || !coordinate)
    return

  const pixel = mapInstance.value.getPixelFromCoordinate(coordinate)

  // Update both popup states with the calculated position
  if (pinnedPopup.state.visible) {
    pinnedPopup.state.position = { x: pixel[0], y: pixel[1] }
  }
  else if (hoverPopup.state.visible) {
    hoverPopup.state.position = { x: pixel[0], y: pixel[1] }
  }
}

// Event handlers
function handleClick(event: { selected: Feature[] }) {
  // Clear any existing hover popup
  hoverPopup.reset()

  if (event.selected.length > 0) {
    const feature = event.selected[0]
    const coordinates = getFeatureCentroid(feature)

    if (coordinates) {
      pinnedPopup.update(feature, coordinates)
      updatePopupPosition(coordinates)
    }
  }
  else {
    pinnedPopup.reset()
  }
}

function handleHoverSelect(event: { selected: Feature[] }) {
  // Don't process hover when pinned popup is visible
  if (pinnedPopup.state.visible)
    return

  const feature = event.selected.length > 0 ? event.selected[0] : null

  if (feature) {
    // Apply highlight styling
    feature.setStyle(createHighlightStyle(feature))

    const coordinates = getFeatureCentroid(feature)
    if (coordinates) {
      hoverPopup.update(feature, coordinates)
      updatePopupPosition(coordinates)
    }
  }
  else {
    // Reset hover state
    if (hoverPopup.state.feature) {
      hoverPopup.state.feature.setStyle(null)
    }
    hoverPopup.reset()
  }
}

// Setup map instance and listeners
watch(() => props.mapInstance, (newInstance) => {
  if (newInstance) {
    mapInstance.value = newInstance

    // Add postrender event to update popup positions
    mapInstance.value.on('postrender', () => {
      if (pinnedPopup.state.visible && pinnedPopup.state.coordinate) {
        updatePopupPosition(pinnedPopup.state.coordinate)
      }
      else if (hoverPopup.state.visible && hoverPopup.state.coordinate) {
        updatePopupPosition(hoverPopup.state.coordinate)
      }
    })
  }
}, { immediate: true })

// Calculate active popup content and position
const activePopup = computed(() => {
  return pinnedPopup.state.visible ? pinnedPopup.state : hoverPopup.state
})

const isPopupVisible = computed(() => {
  return pinnedPopup.state.visible || hoverPopup.state.visible
})
</script>

<template>
  <slot />

  <!-- Hover Interaction -->
  <ol-interaction-select
    v-if="!pinnedPopup.state.visible"
    :condition="pointerMove"
    :filter="isInteractive"
    @select="handleHoverSelect"
  >
    <ol-style>
      <ol-style-fill color="rgba(0, 0, 0, 0)" />
      <ol-style-stroke color="green" :width="10" />
      <ol-style-circle :radius="pointStyle.radius">
        <ol-style-fill :color="pointStyle.fill" />
        <ol-style-stroke
          :color="pointStyle.stroke.color"
          :width="pointStyle.stroke.width"
        />
      </ol-style-circle>
    </ol-style>
  </ol-interaction-select>

  <!-- Click Interaction -->
  <ol-interaction-select
    :condition="click"
    :filter="isInteractive"
    @select="handleClick"
  >
    <ol-style>
      <ol-style-fill color="rgba(0, 0, 0, 0)" />
      <ol-style-stroke color="green" :width="10" />
      <ol-style-circle :radius="pointStyle.radius">
        <ol-style-fill :color="pointStyle.fill" />
        <ol-style-stroke
          :color="pointStyle.stroke.color"
          :width="pointStyle.stroke.width"
        />
      </ol-style-circle>
    </ol-style>
  </ol-interaction-select>

  <!-- Unified Popup Component -->
  <Teleport to="#map-overlays">
    <div
      v-if="isPopupVisible"
      class="absolute z-[1000]"
      :class="[
        popupClass,
        pinnedPopup.state.visible ? '' : hoverPopupClass,
      ]"
      :style="{
        left: `${activePopup.position.x}px`,
        top: `${activePopup.position.y}px`,
        transform: 'translate(-50%, -120%)',
      }"
    >
      <div v-for="(value, key) in activePopup.content" :key="key">
        <strong class="capitalize">{{ key }}:</strong> {{ value }}
      </div>
    </div>
  </Teleport>
</template>
