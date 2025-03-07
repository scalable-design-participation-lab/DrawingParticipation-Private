<script setup lang="ts">
import GeoJSON from 'ol/format/GeoJSON'
import { click, pointerMove } from 'ol/events/condition'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Map } from 'ol'

// Define the props type
interface ToolTipsProps {
  mapInstance?: Map | null
  data?: FeatureCollection<Geometry>
  pointStyle?: {
    radius: number
    fill: string
    stroke: {
      color: string
      width: number
    }
  }
  clickTolerance?: number
  popupClass?: string
  hoverPopupClass?: string
  dataProjection?: string
  featuresProjection?: string
}

// Use withDefaults to set default values
const props = withDefaults(defineProps<ToolTipsProps>(), {
  mapInstance: null,
  data: () => ({} as FeatureCollection<Geometry>),
  pointStyle: () => ({
    radius: 6,
    fill: 'rgba(0, 100, 255, 0.8)',
    stroke: {
      color: 'white',
      width: 2,
    },
  }),
  clickTolerance: 10,
  popupClass:
    'bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-[300px]',
  hoverPopupClass: 'bg-gray-50 border-gray-300',
  dataProjection: 'EPSG:4326',
  featuresProjection: 'EPSG:3857',
})

const hoverCoordinate = ref(null)
const pinnedCoordinate = ref(null)
const currentHoverFeature = ref(null)
const hoverPopupVisible = ref(false)
const pinnedPopupVisible = ref(false)
const selectedFeature = ref(null)
const popupContent = ref({})
const popupX = ref(0)
const popupY = ref(0)
const mapInstance = ref<Map | null>(null)

watch(() => props.mapInstance, (newInstance) => {
  if (newInstance) {
    mapInstance.value = newInstance

    // Ensure that postrender is set only when a valid instance exists
    mapInstance.value.on('postrender', () => {
      if (pinnedCoordinate.value) {
        updatePopupPosition(pinnedCoordinate.value)
      }
    })
  }
}, { immediate: true }) // This ensures it runs when the component is mounted

const geoJson = new GeoJSON()
const features = computed(() => {
  return geoJson.readFeatures(props.data, {
    dataProjection: props.dataProjection,
    featureProjection: props.featuresProjection,
  })
})

function isInteractive(feature) {
  return true
}
const highlightedStyle = new Style({
  image: new CircleStyle({
    radius: 8, // Increase size
    fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }), // Red fill
    stroke: new Stroke({ color: 'yellow', width: 3 }), // Yellow border
  }),
})

function updatePopupPosition(coordinate) {
  if (!mapInstance.value) {
    console.warn('Map instance is not available yet.')
    return
  }

  const pixel = mapInstance.value.getPixelFromCoordinate(coordinate)
  popupX.value = pixel[0]
  popupY.value = pixel[1]
}

// Handle feature click
function handleClick(event) {
  // Clear any existing popup
  pinnedPopupVisible.value = false

  if (event.selected.length > 0) {
    const feature = event.selected[0]

    // Transform coordinates to view projection
    const geometry = feature.getGeometry()
    const coordinates = geometry.getCoordinates()

    // Update state
    pinnedCoordinate.value = coordinates
    const properties = feature.getProperties()

    // Remove OpenLayers-specific metadata
    const excludedKeys = ['geometry'] // Add more OpenLayers keys if needed
    const filteredProperties = Object.fromEntries(
      Object.entries(properties).filter(([key]) => !excludedKeys.includes(key)),
    )
    popupContent.value = filteredProperties

    // Position and show popup
    updatePopupPosition(coordinates)
    pinnedPopupVisible.value = true
    hoverPopupVisible.value = false
  }
  else {
    pinnedPopupVisible.value = false
    pinnedCoordinate.value = null
    popupX.value = 0
    popupY.value = 0
  }
}

// Handle hover interactions
function handleHoverSelect(event) {
  // Ignore hover if a feature is already pinned
  if (pinnedPopupVisible.value)
    return
  if (selectedFeature.value) {
    selectedFeature.value.setStyle(null) // Reset previous feature style
  }

  if (event.selected.length > 0) {
    const feature = event.selected[0]
    selectedFeature.value = feature
    selectedFeature.value.setStyle(highlightedStyle)
    currentHoverFeature.value = feature

    const geometry = feature.getGeometry()
    const coordinates = geometry.getCoordinates()

    hoverCoordinate.value = coordinates
    popupContent.value = feature.getProperties()

    const properties = feature.getProperties()

    // Remove OpenLayers-specific metadata
    const excludedKeys = ['geometry']
    const filteredProperties = Object.fromEntries(
      Object.entries(properties).filter(([key]) => !excludedKeys.includes(key)),
    )
    popupContent.value = filteredProperties

    updatePopupPosition(coordinates)
    hoverPopupVisible.value = true
  }
  else {
    hoverPopupVisible.value = false
    currentHoverFeature.value = null
    pinnedPopupVisible.value = false
    selectedFeature.value = null
  }
}
</script>

<template>
  <!-- Vector Layer with Interactions -->
  <ol-vector-layer>
    <ol-source-vector
      :features="features"
      :format="geoJson"
    />

    <ol-style>
      <ol-style-circle :radius="pointStyle.radius">
        <ol-style-fill :color="pointStyle.fill" />
        <ol-style-stroke
          :color="pointStyle.stroke.color"
          :width="pointStyle.stroke.width"
        />
      </ol-style-circle>
    </ol-style>

    <!-- Interactions -->
    <ol-interaction-select
      :condition="pointerMove"
      :filter="isInteractive"
      :toggle-condition="false"
      :hit-tolerance="clickTolerance"
      @select="handleHoverSelect"
    >
      <ol-style>
        <ol-style-circle :radius="pointStyle.radius">
          <ol-style-fill :color="pointStyle.fill" />
          <ol-style-stroke
            :color="pointStyle.stroke.color"
            :width="pointStyle.stroke.width"
          />
        </ol-style-circle>
      </ol-style>
    </ol-interaction-select>

    <ol-interaction-select
      :condition="click"
      :filter="isInteractive"
      :toggle-condition="false"
      :hit-tolerance="clickTolerance"
      @select="handleClick"
    >
      <ol-style>
        <ol-style-circle :radius="pointStyle.radius">
          <ol-style-fill :color="pointStyle.fill" />
          <ol-style-stroke
            :color="pointStyle.stroke.color"
            :width="pointStyle.stroke.width"
          />
        </ol-style-circle>
      </ol-style>
    </ol-interaction-select>
  </ol-vector-layer>

  <!-- Popup part -->
  <Teleport to="#map-overlays">
    <div
      v-if="hoverPopupVisible && !pinnedPopupVisible || pinnedPopupVisible"
      class="absolute z-[1000] bg-white p-4 rounded-lg shadow-lg"
      :style="{
        left: `${popupX}px`,
        top: `${popupY}px`,
        transform: 'translate(-50%, -120%)',
      }"
    >
      <div v-for="(value, key) in popupContent" :key="key">
        <strong class="capitalize">{{ key }}:</strong> {{ value }}
      </div>
    </div>
  </Teleport>
</template>
