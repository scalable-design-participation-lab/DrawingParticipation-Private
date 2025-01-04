<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { useMapUIStore } from '@/stores/mapUI'

const props = defineProps({
  center: {
    type: Array as PropType<[number, number]>,
    default: () => [3172858.2941718884, 6317486.347640147],
  },
  zoom: {
    type: Number,
    default: 12.83,
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
    default: 10,
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

const emit = defineEmits(['map-click'])

const config = useRuntimeConfig()
const mapUIStore = useMapUIStore()
const { mapType } = storeToRefs(mapUIStore)
const mapInstance = ref(null)

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

function handleMapClick(event) {
  emit('map-click', event)
}

// Expose map instance to parent components
defineExpose({
  mapInstance,
})
</script>

<template>
  <ol-map
    ref="mapInstance"
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

    <ol-tile-layer>
      <ol-source-xyz
        :url="mapboxUrl"
        :attributions="mapboxAttribution"
        :max-zoom="19"
        :tile-size="512"
        :tile-pixel-ratio="2"
      />
    </ol-tile-layer>

    <!-- Slot for additional layers -->
    <slot name="layers" />

    <!-- Slot for overlays -->
    <slot name="overlays" />
  </ol-map>
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
