<template>
  <ol-vector-layer>
    <ol-source-vector :projection="projection">
      <ol-interaction-draw
        v-if="drawEnable"
        :type="drawType"
        @drawend="handleDrawEnd"
        @drawstart="handleDrawStart"
      >
        <ol-style>
          <ol-style-stroke
            :color="getDrawColor"
            :width="2"
            :line-dash="drawType === 'LineString' ? [6, 6] : undefined"
          />
          <ol-style-fill :color="[0, 0, 0, 0]" />
          <ol-style-circle :radius="5">
            <ol-style-fill :color="getDrawColor" />
            <ol-style-stroke :color="getDrawColor" :width="1" />
          </ol-style-circle>
        </ol-style>
      </ol-interaction-draw>

      <IconLayer
        :features="pointFeatures"
        :get-icon-for-feature="getIconForFeature"
        :show-all-plus-icons="showAllPlusIcons"
        :show-comment-icons="showCommentIcons"
        :enable-click="enableClick"
        :is-map-page="isMapPage"
        :show-delete-button="showDeleteButton"
        @toggle-comment-popup="toggleCommentModal"
        @toggle-image-upload-popup="toggleImageUploadModal"
        @show-comment-display="handleShowCommentDisplay"
      />

      <PolygonLayer
        :show-all-plus-icons="showAllPlusIcons"
        :show-comment-icons="showCommentIcons"
        :enable-click="enableClick"
        :is-map-page="isMapPage"
        :show-delete-button="showDeleteButton"
        @toggle-comment-popup="toggleCommentModal"
        @show-comment-display="handleShowCommentDisplay"
      />
      <LineStringLayer
        :show-comment-icons="showCommentIcons"
        :enable-click="enableClick"
        :is-map-page="isMapPage"
        :show-delete-button="showDeleteButton"
        @toggle-comment-popup="toggleCommentModal"
        @show-comment-display="handleShowCommentDisplay"
      />
    </ol-source-vector>
  </ol-vector-layer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'
import IconLayer from './IconLayer.vue'
import PolygonLayer from './PolygonLayer.vue'
import LineStringLayer from './LineStringLayer.vue'

import redIcon from '@/assets/icons/red.svg'
import greenIcon from '@/assets/icons/green.svg'
import blueIcon from '@/assets/icons/blue.svg'
import yellowIcon from '@/assets/icons/yellow.svg'
import purpleIcon from '@/assets/icons/purple.svg'
import dislikeIcon from '@/assets/icons/dislike.svg'
import heartIcon from '@/assets/icons/heart.svg'
import smileIcon from '@/assets/icons/smile.svg'
import brokenIcon from '@/assets/icons/broken.svg'
import calmIcon from '@/assets/icons/calm.svg'
import lockIcon from '@/assets/icons/lock.svg'
import pollutionIcon from '@/assets/icons/pollution.svg'
import leafIcon from '@/assets/icons/leaf.svg'
import prohibitIcon from '@/assets/icons/prohibit.svg'
import trashIcon from '@/assets/icons/trash.svg'

const props = defineProps({
  projection: {
    type: String,
    required: true,
  },
  showAllPlusIcons: {
    type: Boolean,
    default: undefined,
  },
  enableClick: {
    type: Boolean,
    default: false,
  },
  isMapPage: {
    type: Boolean,
    default: false,
  },
  showDeleteButton: {
    type: Boolean,
    default: true,
  },
  showCommentIcons: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'toggle-comment-popup',
  'toggle-image-upload-popup',
  'show-comment-display',
])

const mapUIStore = useMapUIStore()

const drawEnable = computed(() => mapUIStore.drawEnable)
const drawType = computed(() => mapUIStore.drawType)
const currentColor = computed(() => mapUIStore.currentColor)

const pointFeatures = computed(() =>
  mapUIStore.features.filter((feature) => feature.type === 'Point'),
)

function handleDrawStart(event) {
  mapUIStore.handleDrawStart(event)
}

function handleDrawEnd(event) {
  mapUIStore.handleDrawEnd(event)
}

const getDrawColor = computed(() => {
  const colorMap = {
    Point: currentColor.value,
    Polygon: 'black',
    LineString: 'red',
  }
  return colorMap[drawType.value] || 'black'
})

function toggleCommentModal(feature) {
  emit('toggle-comment-popup', feature)
}

function toggleImageUploadModal(feature) {
  emit('toggle-image-upload-popup', feature)
}

function handleShowCommentDisplay(data) {
  emit('show-comment-display', data)
}

function getIconForFeature(feature) {
  // First check if it's a prohibit point
  if (feature.isProhibit) {
    return prohibitIcon
  }

  // Map feature types to icons
  const featureTypeMap = {
    isProhibit: prohibitIcon,
  }

  if (
    featureTypeMap[Object.keys(feature).find((key) => feature[key] === true)]
  ) {
    return featureTypeMap[
      Object.keys(feature).find((key) => feature[key] === true)
    ]
  }

  // Map icon names to icons
  const iconMap = {
    pollution: pollutionIcon,
    leaf: leafIcon,
    'flora-fauna': leafIcon,
    lock: lockIcon,
    great: lockIcon,
    calm: calmIcon,
    safe: calmIcon,
    broken: brokenIcon,
    unsafe: brokenIcon,
    dislike: dislikeIcon,
    negative: dislikeIcon,
    heart: heartIcon,
    love: heartIcon,
    smile: smileIcon,
    positive: smileIcon,
    trash: trashIcon,
  }

  if (feature.iconName && iconMap[feature.iconName]) {
    return iconMap[feature.iconName]
  }

  // Map frequencies to icons
  const frequencyMap = {
    'every day': blueIcon,
    everyday: blueIcon,
    'every week': greenIcon,
    everyweek: greenIcon,
    sometimes: purpleIcon,
    'only once': yellowIcon,
    once: yellowIcon,
    never: redIcon,
  }

  return frequencyMap[feature.frequency] || redIcon
}
</script>
