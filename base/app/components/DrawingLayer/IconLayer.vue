<template>
  <template v-for="feature in features" :key="feature.id">
    <ol-vector-layer>
      <ol-source-vector>
        <ol-feature>
          <ol-geom-point :coordinates="feature.coordinates" />
          <ol-style>
            <ol-style-icon
              :src="getIconForFeature(feature)"
              :scale="1"
              :anchor="[0.5, 0.5]"
            />
          </ol-style>
        </ol-feature>
      </ol-source-vector>
    </ol-vector-layer>

    <ol-overlay
      :position="feature.coordinates"
      :offset="[0, 0]"
      :stopEvent="false"
      :positioning="'top-left'"
    >
      <div
        v-if="shouldShowPlusIcon(feature)"
        class="plus-icon-container"
        @click.stop.prevent="handlePlusIconClick(feature)"
      >
        <img
          src="@/assets/icons/open-icon.svg"
          alt="Open Icon"
          class="plus-icon"
        />
      </div>
    </ol-overlay>

    <ol-overlay
      v-if="showDeleteButton"
      :position="feature.coordinates"
      :offset="[-30, -30]"
      :stopEvent="false"
      :positioning="'top-left'"
    >
      <div
        class="delete-icon-container"
        @click.stop.prevent="handleDeleteClick(feature)"
      >
        <img
          src="@/assets/icons/delete.svg"
          alt="Delete Icon"
          class="delete-icon"
        />
      </div>
    </ol-overlay>

    <ol-overlay
      v-if="showCommentIcons"
      :position="feature.coordinates"
      :offset="[20, -20]"
      :stopEvent="false"
      :positioning="'center-center'"
    >
      <div
        class="comment-display-icon"
        @click.stop.prevent="handleCommentIconClick(feature, $event)"
      >
        <UIcon
          name="i-heroicons-chat-bubble-left-ellipsis"
          class="text-lg text-gray-600 hover:text-gray-800"
        />
      </div>
    </ol-overlay>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'
import { click } from 'ol/events/condition'

const props = defineProps({
  features: {
    type: Array,
    required: true,
  },
  getIconForFeature: {
    type: Function,
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

const clickCondition = click

function handleSelect(event, feature) {
  const selected = event.selected
  if (selected && selected.length > 0) {
    const olFeature = selected[0]
    const coordinates = olFeature.getGeometry().getCoordinates()

    const feature = props.features.find(
      (f) =>
        Math.abs(f.coordinates[0] - coordinates[0]) < 0.0000001 &&
        Math.abs(f.coordinates[1] - coordinates[1]) < 0.0000001,
    )

    if (feature) {
      emit('show-comment-display', feature)
    }
  }
}

function shouldShowPlusIcon(feature) {
  if (props.showAllPlusIcons === false) {
    return false
  }

  if (props.showAllPlusIcons === true) {
    return true
  }

  const spaceSubwindow = mapUIStore.spaceSubwindow
  const belongingSubwindow = mapUIStore.belongingSubwindow
  const safetySubwindow = mapUIStore.safetySubwindow
  const environmentSubwindow = mapUIStore.environmentSubwindow

  if (feature.type === 'Point') {
    if (spaceSubwindow === 1 && !feature.iconName) {
      return true
    }
    if (
      belongingSubwindow === 1 &&
      ['heart', 'smile', 'dislike'].includes(feature.iconName)
    ) {
      return true
    }
    if (
      safetySubwindow === 1 &&
      ['broken', 'calm', 'lock'].includes(feature.iconName)
    ) {
      return true
    }
    if (environmentSubwindow === 1 && feature.iconName === 'pollution') {
      return true
    }
    if (environmentSubwindow === 2 && feature.iconName === 'leaf') {
      return true
    }
  }
  return false
}

function handlePlusIconClick(feature) {
  console.log('Plus icon clicked:', feature)
  // Always use comment popup regardless of feature type
  emit('toggle-comment-popup', feature)
}

function handleDeleteClick(feature) {
  // Add confirmation dialog
  if (confirm('Ви впевнені, що хочете видалити цю відмітку?')) {
    mapUIStore.deleteFeature(feature.id)
  }
}

function handleCommentIconClick(feature, event) {
  const iconPosition = [event.clientX, event.clientY]
  emit('show-comment-display', { feature, position: iconPosition })
}
</script>

<style scoped>
.plus-icon-container {
  cursor: pointer;
  background: white;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  position: relative;
}

.plus-icon {
  width: 24px;
  height: 24px;
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

.comment-icon-container {
  cursor: pointer;
  background: white;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  position: relative;
}

.comment-icon {
  width: 24px;
  height: 24px;
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
