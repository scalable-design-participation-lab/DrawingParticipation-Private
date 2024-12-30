<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
    @map-click="handleMapClick"
  >
    <template #layers>
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
    </template>

    <template #overlays>
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
    </template>
  </GeneralizedBackgroundMap>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'
import { useRoute } from 'vue-router'
import CommentModal from './CommentModal.vue'
import CommentDisplay from './CommentDisplay.vue'

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

const baseMap = ref(null)

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
  const map = baseMap.value?.map
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

const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'
</script>
