<script setup lang="ts">
import { computed, ref } from 'vue'
import type Feature from 'ol/Feature'
import { useMapStore } from '../stores/map'
import { useRuntimeConfig } from '#app'

const props = defineProps({
  center: {
    type: Array,
    default: () => [-7912281, 5214952],
  },
  zoom: {
    type: Number,
    default: 4,
  },
  projection: {
    type: String,
    default: 'EPSG:3857',
  },
  rotation: {
    type: Number,
    default: 0,
  },
  pitch: {
    type: Number,
    default: 0,
  },
  bearing: {
    type: Number,
    default: 0,
  },
  maxZoom: {
    type: Number,
    default: 19,
  },
  minZoom: {
    type: Number,
    default: 2,
  },
  mapHeight: {
    type: String,
    default: '100vh',
  },
  showZoomControl: {
    type: Boolean,
    default: true,
  },
  mapboxStyleLight: {
    type: String,
    default: 'restartukraine/cm3p0s3gw00yd01seasye5jdw',
  },
  mapboxStyleDark: {
    type: String,
    default: 'restartukraine/cm3p4jqnj009y01s79ngdah4r',
  },
})

const emit = defineEmits(['map-click', 'toggle-icon-details'])

const config = useRuntimeConfig()
const { mapType } = storeToRefs(useMapStore())
const mapInstance = ref(null)
const mapRef = ref(null)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const mapboxToken = config.public.mapboxToken

const mapboxUrl = computed(() => {
  let style
  if (mapType.value === 'vector' && isDark.value) {
    style = props.mapboxStyleDark
  }
  else if (mapType.value === 'vector' && !isDark.value) {
    style = props.mapboxStyleLight
  }
  else {
    style = 'mapbox/satellite-v9'
  }
  return `https://api.mapbox.com/styles/v1/${style}/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
})

const mapboxAttribution = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function handleMapClick(event: any) {
  const olFeature = event.map.forEachFeatureAtPixel(
    event.pixel,
    (f: Feature) => f,
  ) as Feature | undefined

  if (olFeature) {
    const iconName = olFeature.get('iconName')
    const sourceFeature = olFeature.get('sourceFeature') // your original store feature
    console.log('clicked icon name:', iconName)

    const coordinate = olFeature.getGeometry().getCoordinates()

    let markerPosition: { x: number, y: number } | undefined

    // Preferred: convert map coordinate to viewport pixel using OpenLayers map + container bounds.
    if (Array.isArray(coordinate) && coordinate.length === 2 && event?.map?.getPixelFromCoordinate) {
      const mapPixel = event.map.getPixelFromCoordinate(coordinate)
      const targetEl = event.map.getTargetElement?.()
      const rect = targetEl?.getBoundingClientRect?.()
      if (Array.isArray(mapPixel) && mapPixel.length === 2 && rect) {
        markerPosition = {
          x: rect.left + mapPixel[0],
          y: rect.top + mapPixel[1],
        }
      }
    }

    // Fallback: DOM click viewport coordinates.
    if (!markerPosition) {
      const clickX = event?.originalEvent?.clientX
      const clickY = event?.originalEvent?.clientY
      if (Number.isFinite(clickX) && Number.isFinite(clickY)) {
        markerPosition = { x: clickX, y: clickY }
      }
    }

    // Last fallback: map pixel relative to viewport origin.
    if (!markerPosition && Array.isArray(event?.pixel) && event.pixel.length === 2) {
      markerPosition = { x: event.pixel[0], y: event.pixel[1] }
    }

    emit('toggle-icon-details', {
      feature: sourceFeature,
      markerPosition,
    })
    console.log(coordinate)
    return
  }

  emit('map-click', event)
}

// Expose map instance to parent components
defineExpose({
  mapInstance,
})
onMounted(() => {
  nextTick(() => {
    if (mapRef.value) {
      mapInstance.value = mapRef.value.map
      // Force map to update its size after mounting
      setTimeout(() => {
        if (mapInstance.value) {
          mapInstance.value.updateSize()
        }
      }, 100)
    }
  })
})
</script>

<template>
  <client-only>
    <ol-map
      ref="mapRef"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      :controls="[]"
      :style="{ width: '100%', height: mapHeight }"
      @click="handleMapClick"
    >
      <ol-zoom-control
        v-if="showZoomControl"
        class="custom-zoom-control"
        zoom-in-label="➕"
        zoom-out-label="➖"
        :duration="250"
      />

      <ol-view
        ref="view"
        :center="center"
        :zoom="zoom"
        :projection="projection"
        :rotation="rotation"
        :pitch="pitch"
        :bearing="bearing"
        :max-zoom="maxZoom"
        :min-zoom="minZoom"
      />

      <!-- preload=2 keeps a couple of lower-zoom levels ready so panning/zooming
           shows low-res tiles instead of blank, without the main-thread jank of
           preloading every level. A larger cacheSize keeps recently-seen tiles. -->
      <ol-tile-layer :preload="2">
        <ol-source-xyz
          :url="mapboxUrl"
          :attributions="mapboxAttribution"
          :max-zoom="19"
          :tile-size="512"
          :tile-pixel-ratio="2"
          :cache-size="2048"
          :transition="0"
        />
      </ol-tile-layer>

      <!-- Slot for additional layers -->
      <slot name="layers" />

      <!-- Slot for overlays -->
      <slot name="overlays" />
    </ol-map>
  </client-only>
  <div id="map-overlays" class="absolute inset-0 pointer-events-none" />
</template>

<style>
.ol-zoom {
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  left: 20px !important;
  bottom: unset !important;
  background: none !important;
  z-index: 1500 !important;
  box-shadow: none !important;
}

.ol-control button {
  @apply text-black dark:text-white !important;
}

.ol-zoom .ol-zoom-in,
.ol-zoom .ol-zoom-out {
  @apply bg-white dark:bg-black !important;
  border-radius: 50px !important;
  border: none !important;
  margin-top: 5px !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  font-size: 16px !important;
}

.ol-zoom .ol-zoom-in:hover,
.ol-zoom .ol-zoom-out:hover {
  @apply bg-black dark:bg-white !important;
  @apply text-white dark:text-black !important;
  outline: 0 !important;
}
</style>
