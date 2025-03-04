<script setup>
import { ref } from 'vue'
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

const geoJson = new GeoJSON()
const mapRef = ref(null)
const hoverCoordinate = ref(null)
const pinnedCoordinate = ref(null)
const currentHoverFeature = ref(null)
const viewProjection = 'EPSG:3857'

// Popup States
const hoverPopupVisible = ref(false)
const pinnedPopupVisible = ref(false)
const popupContent = ref({})
const popupX = ref(0)
const popupY = ref(0)

// Convert initial center to view projection
const initialCenter = transform(props.center, 'EPSG:4326', viewProjection)

function isInteractive(feature) {
  return feature.get('name') !== undefined
}

function handleClick(event) {
  // Always clear previous selection first
  pinnedPopupVisible.value = false
  popupX.value = 0
  popupY.value = 0

  if (event.selected.length > 0) {
    const feature = event.selected[0]
    const geometry = feature.getGeometry()
    pinnedCoordinate.value = geometry.getCoordinates()

    popupContent.value = feature.getProperties()
    updatePopupPosition(pinnedCoordinate.value)
    pinnedPopupVisible.value = true
  }
}

function handleHoverSelect(event) {
  if (event.selected.length > 0 && !pinnedPopupVisible.value) {
    const feature = event.selected[0]
    currentHoverFeature.value = feature
    const geometry = feature.getGeometry()
    hoverCoordinate.value = geometry.getCoordinates()

    popupContent.value = feature.getProperties()
    updatePopupPosition(hoverCoordinate.value)
    hoverPopupVisible.value = true
  }
  else {
    // No feature is hovered over, hide the hover popup
    hoverPopupVisible.value = false
    currentHoverFeature.value = null
  }
}

function handleHoverDeselect() {
  hoverPopupVisible.value = false
  currentHoverFeature.value = null
}

function updatePopupPosition(coordinate) {
  const map = mapRef.value.map
  const pixel = map.getPixelFromCoordinate(coordinate)
  popupX.value = pixel[0]
  popupY.value = pixel[1]
}

function closePopup() {
  pinnedPopupVisible.value = false
  pinnedCoordinate.value = null
}
</script>

<template>
  <div class="relative h-screen">
    <ol-map
      ref="mapRef"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      class="h-full"
    >
      <ol-view :center="initialCenter" :zoom="zoom" :projection="viewProjection" />

      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <ol-vector-layer>
        <ol-source-vector
          :url="geoJsonUrl"
          :format="geoJson"
          data-projection="EPSG:4326"
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
      </ol-vector-layer>

      <ol-interaction-select
        :condition="pointerMove"
        :filter="isInteractive"
        :toggle-condition="false"
        :hit-tolerance="props.clickTolerance"
        @select="handleHoverSelect"
        @deselect="handleHoverDeselect"
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
        :multi="false"
        :hit-tolerance="props.clickTolerance"
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
    </ol-map>

    <!-- Hover Popup -->
    <div
      v-if="hoverPopupVisible && !pinnedPopupVisible"
      class="absolute transition-opacity duration-150 pointer-events-auto"
      :class="[props.popupClass, props.hoverPopupClass]"
      :style="{
        left: `${popupX}px`,
        top: `${popupY}px`,
        transform: 'translate(-50%, -120%)',
      }"
      @mouseleave="handlePopupMouseLeave"
    >
      <slot name="hover-popup" :content="popupContent">
        <strong>{{ popupContent.name }}</strong>
      </slot>
    </div>

    <!-- Pinned Popup -->
    <div
      v-if="pinnedPopupVisible"
      class="absolute transition-opacity duration-150 pointer-events-auto"
      :class="props.popupClass"
      :style="{
        left: `${popupX}px`,
        top: `${popupY}px`,
        transform: 'translate(-50%, -120%)',
      }"
    >
      <slot name="pinned-popup" :content="popupContent" :close="closePopup">
        <div class="relative">
          <strong>{{ popupContent.name }}</strong>
        </div>
      </slot>
    </div>
  </div>
</template>
