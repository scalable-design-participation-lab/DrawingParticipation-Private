<template>
  <div class="map-container">
    <GeneralizedHeader
      class="z-20"
      :left-items="leftItems"
      :right-items="rightItems"
      logo-src="/restart-logo-icon.svg"
      logo-alt="Restart Agency Logo"
      logo-link="https://www.restartfuture.org/"
    />
    <div class="map-wrapper">
      <BackgroundMap
        :show-all-plus-icons="false"
        :show-comment-icons="true"
        :model-value="showCommentDisplay"
        :selected-feature="selectedFeature"
        @show-comment-display="handleShowCommentDisplay"
        @update:model-value="updateShowCommentDisplay"
      />
    </div>
    <GeneralizedFooter class="footer-fixed" />

    <MapIntroModal v-model="showIntroModal" />
  </div>
</template>


<script setup lang="ts">
import {  ref, computed, watch } from 'vue'
import MapIntroModal from '../components/MapIntroModal.vue'
import { useMapStore } from '@base/stores/map'

const mapStore = useMapStore()
const route = useRoute()
const showIntroModal = ref(false)

// Watch for route changes and query parameters
watch(
  () => route.query.showIntro,
  (newValue) => {
    if (newValue === 'true') {
      showIntroModal.value = true
    }
  },
  { immediate: true },
)

const leftItems = ref([
  {
    label: 'Drawing Participation',
    variant: 'solid',
    color: 'black',
  },
  {
    label: 'About',
    variant: 'solid',
    color: 'black',
  },
])

// Add right items for map controls
const {mapType} = storeToRefs(mapStore)
const rightItems = ref([
  {
    icon: computed(() =>
      mapType.value === 'vector'
        ? 'i-heroicons:map'
        : 'i-heroicons:globe-americas-20-solid',
    ),
    onClick: () => {
      mapType.value =
        mapType.value === 'vector' ? 'satellite' : 'vector'
      mapStore.setMapType(mapType.value)
    },
  },
])

const showCommentDisplay = ref(false)
const selectedFeature = ref(null)
const activeFeatureId = ref(null)

function handleShowCommentDisplay({ feature }) {
  console.log('Handling comment display:', feature) // Debug log

  // If clicking the same feature's comment icon, close the popup
  if (activeFeatureId.value === feature.id && showCommentDisplay.value) {
    showCommentDisplay.value = false
    activeFeatureId.value = null
    selectedFeature.value = null
    return
  }

  // Open new comment display
  selectedFeature.value = feature
  activeFeatureId.value = feature.id
  showCommentDisplay.value = true
}

function updateShowCommentDisplay(value: boolean) {
  showCommentDisplay.value = value
  if (!value) {
    selectedFeature.value = null
    activeFeatureId.value = null
  }
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.footer-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.map-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
