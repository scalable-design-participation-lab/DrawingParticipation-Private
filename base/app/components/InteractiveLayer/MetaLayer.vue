<script setup>
import { onMounted, ref } from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import { click, pointerMove } from 'ol/events/condition'
import { transform } from 'ol/proj'

const props = defineProps({
  center: {
    type: Array,
    default: () => [35, 39],
  },
  zoom: {
    type: Number,
    default: 6,
  },
  geoJsonUrl: {
    type: String,
    default: 'https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities-airports.json',
  },
  pointStyle: {
    type: Object,
    default: () => ({
      radius: 6,
      fill: 'rgba(0, 100, 255, 0.8)',
      stroke: {
        color: 'white',
        width: 2,
      },
    }),
  },
  hoverDebounce: {
    type: Number,
    default: 150,
  },
  clickTolerance: {
    type: Number,
    default: 10,
  },
  popupClass: {
    type: String,
    default: 'bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-[300px]',
  },
  hoverPopupClass: {
    type: String,
    default: 'bg-gray-50 border-gray-300',
  },
})

// Coordinate system constants
const sourceProjection = 'EPSG:4326'
const viewProjection = 'EPSG:3857'

// References and reactive state
const mapRef = ref(null)
const mapInstance = ref(null)
const hoverCoordinate = ref(null)
const pinnedCoordinate = ref(null)
const currentHoverFeature = ref(null)

// Popup States
const hoverPopupVisible = ref(false)
const pinnedPopupVisible = ref(false)
const popupContent = ref({})
const popupX = ref(0)
const popupY = ref(0)

// Convert initial center to view projection
const initialCenter = transform(props.center, sourceProjection, viewProjection)

// GeoJSON format for parsing features
const geoJson = new GeoJSON()

// Determine if a feature is interactive
function isInteractive(feature) {
  return feature.get('name') !== undefined
}

// Update popup position based on map coordinates
function updatePopupPosition(coordinate) {
  if (!mapInstance.value)
    return

  const pixel = mapInstance.value.getPixelFromCoordinate(coordinate)
  if (pixel) {
    popupX.value = pixel[0]
    popupY.value = pixel[1]
  }
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

  if (event.selected.length > 0) {
    const feature = event.selected[0]
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
  }
}

// Set up map listeners after mounting
onMounted(() => {
  if (mapRef.value) {
    mapInstance.value = mapRef.value.map

    // Add map move listener to update popup positions
    mapInstance.value.on('postrender', () => {
      if (pinnedCoordinate.value) {
        updatePopupPosition(pinnedCoordinate.value)
      }
    })
  }
})
</script>

<template>
  <div class="relative h-screen">
    <ol-map
      ref="mapRef"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      class="h-full"
    >
      <ol-view
        :center="initialCenter"
        :zoom="zoom"
        :projection="viewProjection"
      />

      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <ol-vector-layer>
        <ol-source-vector
          :url="geoJsonUrl"
          :format="geoJson"
          :data-projection="sourceProjection"
          :projection="viewProjection"
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
        <ol-vector-layer>
          <!-- Hover Interaction -->
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

          <!-- Click Interaction -->
          <ol-interaction-select
            :condition="click"
            :filter="isInteractive"
            :toggle-condition="false"
            :multi="false"
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
      </ol-vector-layer>
    </ol-map>

    <!-- Popup -->
    <div
      v-if="hoverPopupVisible && !pinnedPopupVisible || pinnedPopupVisible"
      class="absolute transition-opacity duration-150 pointer-events-auto"
      :class="[popupClass, hoverPopupClass]"
      :style="{
        left: `${popupX}px`,
        top: `${popupY}px`,
        transform: 'translate(-50%, -120%)',
      }"
    >
      <slot name="hover-popup" :content="popupContent">
        <div class="relative">
          <div v-for="key in Object.keys(popupContent)" :key="key">
            <strong class="capitalize">{{ key }}: </strong>
            <span>{{ popupContent[key] }}</span>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
