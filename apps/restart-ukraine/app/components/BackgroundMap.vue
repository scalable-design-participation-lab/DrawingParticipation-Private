<template>
  <ol-map
    ref="mapInstance"
    :load-tiles-while-animating="true"
    :load-tiles-while-interacting="true"
    :controls="[]"
    style="width: 100%; height: 100vh"
    @click="handleMapClick"
  >
    <ol-zoom-control
      class="custom-zoom-control"
      zoomInLabel="➕"
      zoomOutLabel="➖"
      :duration="250"
    />

    <ol-view
      ref="view"
      :center="[3172858.2941718884, 6317486.347640147]"
      :zoom="12.83"
      :projection="projection"
      :rotation="0"
      :pitch="0"
      :bearing="0"
      :maxZoom="19"
      :minZoom="10"
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

    <ol-layer-vector>
      <ol-source-vector>
        <DrawingLayer
          :projection="projection"
          :show-all-plus-icons="showAllPlusIcons"
          :show-comment-icons="showCommentIcons"
          :enable-click="isMapPage"
          :is-map-page="isMapPage"
          :show-delete-button="!isMapPage"
          @toggle-comment-popup="toggleCommentModal"
          @toggle-image-upload-popup="toggleImageUploadModal"
          @show-comment-display="handleShowCommentDisplay"
        />
      </ol-source-vector>
    </ol-layer-vector>

    <ol-overlay
      v-if="CommentModalVisible"
      :position="CommentModalPosition"
      :offset="CommentModalOffset"
    >
      <CommentModal
        :is-visible="CommentModalVisible"
        :feature-id="selectedFeatureId"
        class="z-10"
        @close="closeCommentModal"
      />
    </ol-overlay>

    <ol-overlay
      v-if="showCommentDisplay"
      :position="commentDisplayPosition"
      :offset="commentDisplayOffset"
      :positioning="'center-center'"
    >
      <CommentDisplay
        :model-value="showCommentDisplay"
        :feature="selectedFeatureForDisplay"
        @update:model-value="updateShowCommentDisplay"
      />
    </ol-overlay>
  </ol-map>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, watch } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'
import { useRuntimeConfig } from '#app'
import { useRoute } from 'vue-router'
import DrawingLayer from '../../base/app/components/DrawingLayer/DrawingLayer.vue'
import CommentModal from './CommentModal.vue'
import CommentDisplay from './CommentDisplay.vue'
import { Coordinate } from 'ol/coordinate'

const props = defineProps({
  showAllPlusIcons: {
    type: Boolean,
    default: false,
  },
  showCommentIcons: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  selectedFeature: {
    type: Object,
    default: null,
  },
})

const mapUIStore = useMapUIStore()
const { mapType } = storeToRefs(mapUIStore)
const config = useRuntimeConfig()
const route = useRoute()

const projection = ref('EPSG:3857')
const CommentModalVisible = ref(false)
const selectedFeatureId = ref(null)
const CommentModalPosition = ref(null)
const commentDisplayPosition = ref<[number, number] | null>(null)
const commentDisplayOffset = ref<[number, number]>([0, 0])
const showCommentDisplay = ref(false)
const selectedFeatureForDisplay = ref(null)
const CommentModalOffset = ref([0, 0])

const colorMode = useColorMode()
const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const mapboxToken = config.public.mapboxToken
const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'

const mapboxUrl = computed(() => {
  let style
  if (mapType.value === 'vector' && isDark.value) {
    style = mapboxStyleDark
  }
  else if (mapType.value === 'vector' && !isDark.value) {
    style = mapboxStyleLight
  }
  else {
    style = 'mapbox/satellite-v9'
  }
  return `https://api.mapbox.com/styles/v1/${style}/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
})

const mapboxAttribution =
  '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const isMapPage = computed(() => route.name === 'map')

function toggleCommentModal(feature) {
  console.log('Toggle comment popup:', feature)
  if (CommentModalVisible.value && selectedFeatureId.value === feature.id) {
    closeCommentModal()
  } else {
    openCommentModal(feature)
  }
}

function toggleImageUploadModal(feature) {
  console.log('Toggle comment popup:', feature)
  if (CommentModalVisible.value && selectedFeatureId.value === feature.id) {
    closeCommentModal()
  } else {
    openCommentModal(feature)
  }
}

function openCommentModal(feature) {
  selectedFeatureId.value = feature.id
  CommentModalVisible.value = true
  const { position, offset } = calculatePopupPosition(feature)
  CommentModalPosition.value = position
  CommentModalOffset.value = offset
}

function getFeaturePosition(feature) {
  if (!feature) return [0, 0]

  if (feature.type === 'Point') {
    return feature.coordinates
  } else if (feature.type === 'Polygon') {
    const coordinates = feature.coordinates[0]
    const sumX = coordinates.reduce((sum, coord) => sum + coord[0], 0)
    const sumY = coordinates.reduce((sum, coord) => sum + coord[1], 0)
    return [sumX / coordinates.length, sumY / coordinates.length]
  } else if (feature.type === 'LineString') {
    return feature.coordinates[feature.coordinates.length - 1]
  }
  return [0, 0]
}

function closeCommentModal() {
  CommentModalVisible.value = false
  selectedFeatureId.value = null
}

function handleMapClick(event) {
  if (mapUIStore.drawEnable && mapUIStore.drawType === 'Point') {
    const coordinate = event.coordinate
    mapUIStore.addFeature({
      type: 'Point',
      coordinates: coordinate,
      frequency: mapUIStore.currentFrequency,
    })
  }
}

const emit = defineEmits([
  'show-comment-display',
  'update:model-value',
  'update:selectedFeature',
])

function updateShowCommentDisplay(value) {
  showCommentDisplay.value = value
  emit('update:model-value', value)
}

function handleShowCommentDisplay(data) {
  if (!isMapPage.value) return

  closeCommentModal()

  if (
    selectedFeatureForDisplay.value?.id === data.feature.id &&
    showCommentDisplay.value
  ) {
    showCommentDisplay.value = false
    selectedFeatureForDisplay.value = null
    emit('update:model-value', false)
    return
  }

  selectedFeatureForDisplay.value = data.feature
  showCommentDisplay.value = true

  // Calculate position and offset
  const { position, offset } = calculatePopupPosition(data.feature)
  commentDisplayPosition.value = position
  commentDisplayOffset.value = offset

  emit('update:model-value', true)
  emit('update:selectedFeature', data.feature)
}

const mapInstance = ref(null)

const popupOffsets = computed(() => {
  if (isMapPage.value) {
    return {
      above: -150,
      below: 100,
      left: -150,
      right: 170,
    }
  }
  return {
    above: -200,
    below: 20,
    left: -230,
    right: 30,
  }
})

function calculatePopupPosition(feature: any): {
  position: [number, number]
  offset: [number, number]
} {
  const map = mapInstance.value?.map
  if (!map) {
    return {
      position: getFeaturePosition(feature),
      offset: [0, 0],
    }
  }

  const featurePosition = getFeaturePosition(feature)
  const pixel = map.getPixelFromCoordinate(featurePosition)

  if (!pixel) {
    return {
      position: featurePosition,
      offset: [0, 0],
    }
  }

  const mapSize = map.getSize()
  const [width, height] = mapSize || [0, 0]

  // Calculate relative position in viewport
  const isInUpperHalf = pixel[1] < height / 2
  const isInLeftHalf = pixel[0] < width / 2

  // Calculate offset based on position using the computed offsets
  let offset: [number, number] = [0, 0]

  if (isInUpperHalf) {
    offset[1] = popupOffsets.value.below // Show below icon
  } else {
    offset[1] = popupOffsets.value.above // Show above icon
  }

  if (isInLeftHalf) {
    offset[0] = popupOffsets.value.right // Show on right side
  } else {
    offset[0] = popupOffsets.value.left // Show on left side
  }

  return {
    position: featurePosition,
    offset,
  }
}
</script>

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
