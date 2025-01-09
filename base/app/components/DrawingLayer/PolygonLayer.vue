<template>
  <ol-vector-layer>
    <ol-source-vector>
      <ol-feature v-for="feature in polygonFeatures" :key="feature.id">
        <ol-geom-polygon :coordinates="feature.coordinates" />
        <ol-style>
          <ol-style-stroke color="black" :width="2" :line-dash="[10, 10]" />
          <ol-style-fill :color="[0, 0, 0, 0]" />
        </ol-style>
      </ol-feature>
    </ol-source-vector>
  </ol-vector-layer>

  <ol-overlay
    v-for="feature in visiblePolygonFeatures"
    :key="`overlay-${feature.id}`"
    :position="getFeatureIconPosition(feature)"
    :offset="[0, 0]"
    :stopEvent="false"
    :positioning="'center-center'"
  >
    <div class="polygon-plus-icon" @click.stop="toggleCommentModal(feature)">
      <svg
        width="24"
        height="24"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9" cy="9" r="9" fill="black" />
        <path
          d="M9 14L9 4"
          stroke="white"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M4 9L14 9"
          stroke="white"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </ol-overlay>

  <ol-overlay
    v-if="showDeleteButton"
    v-for="feature in visiblePolygonFeatures"
    :key="`delete-${feature.id}`"
    :position="getFeatureIconPosition(feature)"
    :offset="[30, 0]"
    :stopEvent="false"
    :positioning="'center-center'"
  >
    <div class="delete-icon-container" @click.stop="handleDeleteClick(feature)">
      <img
        src="@/assets/icons/delete.svg"
        alt="Delete Icon"
        class="delete-icon"
      />
    </div>
  </ol-overlay>

  <ol-overlay
    v-for="feature in polygonFeatures"
    :key="`comment-${feature.id}`"
    :position="getFeatureIconPosition(feature)"
    :offset="[30, 0]"
    :stopEvent="false"
    :positioning="'center-center'"
  >
    <div
      class="comment-display-icon"
      @click.stop.prevent="(event) => handleCommentIconClick(feature, event)"
    >
      <UIcon
        name="i-heroicons-chat-bubble-left-ellipsis"
        class="text-lg text-gray-600 hover:text-gray-800"
      />
    </div>
  </ol-overlay>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'
import { click } from 'ol/events/condition'

const props = defineProps({
  showAllPlusIcons: {
    type: Boolean,
    default: false,
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
})

const emit = defineEmits(['toggle-comment-popup', 'show-comment-display'])

const mapUIStore = useMapUIStore()

const polygonFeatures = computed(() =>
  mapUIStore.features.filter((feature) => feature.type === 'Polygon'),
)

const visiblePolygonFeatures = computed(() => {
  if (props.showAllPlusIcons) {
    return polygonFeatures.value
  }
  const spaceSubwindow = mapUIStore.spaceSubwindow
  return spaceSubwindow === 2 ? polygonFeatures.value : []
})

const clickCondition = click

function getFeatureIconPosition(feature) {
  const coordinates = feature.coordinates[0]
  const sumX = coordinates.reduce((sum, coord) => sum + coord[0], 0)
  const sumY = coordinates.reduce((sum, coord) => sum + coord[1], 0)
  const centerX = sumX / coordinates.length
  const centerY = sumY / coordinates.length
  return [centerX, centerY]
}

function toggleCommentModal(feature) {
  emit('toggle-comment-popup', feature)
}

function handleSelect(event) {
  const selected = event.selected
  if (selected && selected.length > 0) {
    const olFeature = selected[0]
    const coordinates = olFeature.getGeometry().getCoordinates()

    const feature = polygonFeatures.value.find((f) => {
      try {
        const featureCoords = f.coordinates
        return (
          coordinates[0].length === featureCoords[0].length &&
          coordinates[0].every((coord, index) => {
            const featureCoord = featureCoords[0][index]
            return (
              Math.abs(coord[0] - featureCoord[0]) < 0.0000001 &&
              Math.abs(coord[1] - featureCoord[1]) < 0.0000001
            )
          })
        )
      } catch (error) {
        return false
      }
    })

    if (feature) {
      emit('show-comment-display', feature)
    }
  }
}

function handleDeleteClick(feature) {
  if (confirm('Ви впевнені, що хочете видалити цю відмітку?')) {
    mapUIStore.deleteFeature(feature.id)
  }
}

function handleCommentIconClick(feature, event) {
  if (!event) return
  const coordinates = [event.clientX, event.clientY]
  emit('show-comment-display', {
    feature,
    position: coordinates,
  })
}
</script>

<style scoped>
.polygon-plus-icon {
  cursor: pointer;
  background: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.polygon-plus-icon:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

.polygon-delete-icon {
  cursor: pointer;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.delete-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.delete-icon:hover {
  transform: scale(1.1);
}

.delete-icon-container {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  position: relative;
  z-index: 2;
}

.delete-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.delete-icon-container:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

.comment-display-icon {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
  transition: transform 0.2s ease;
}

.comment-display-icon:hover {
  transform: scale(1.1);
}
</style>
