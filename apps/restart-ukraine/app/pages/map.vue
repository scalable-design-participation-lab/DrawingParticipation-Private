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
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import MapIntroModal from '~/components/MapIntroModal.vue'
import { useMapUIStore } from '@/stores/mapUI'
import { useFirestore } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'

const mapUIStore = useMapUIStore()
const db = useFirestore()
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
    label: 'Гуртомá',
    variant: 'solid',
    color: 'black',
  },
])

// Add right items for map controls
const currentMapType = ref('light')
const rightItems = ref([
  {
    icon: computed(() =>
      currentMapType.value === 'light'
        ? 'i-heroicons:map'
        : 'i-heroicons:globe-americas-20-solid',
    ),
    onClick: () => {
      currentMapType.value =
        currentMapType.value === 'light' ? 'satellite' : 'light'
      mapUIStore.setMapType(currentMapType.value)
    },
  },
])

onMounted(async () => {
  const projectsCollection = collection(db, 'projects')
  const querySnapshot = await getDocs(projectsCollection)

  for (const doc of querySnapshot.docs) {
    const projectData = doc.data()

    // Process space data including prohibit points
    if (Array.isArray(projectData.space.prohibit)) {
      projectData.space.prohibit.forEach((point) => {
        mapUIStore.addFeature({
          type: 'Point',
          coordinates: [point.lon, point.lat],
          isProhibit: true,
          comment: point.comment,
          name: projectData.name,
          timestamp: point.timestamp,
        })
      })
    }

    // Process other space data (excluding prohibit)
    Object.keys(projectData.space).forEach((frequency) => {
      if (
        Array.isArray(projectData.space[frequency]) &&
        frequency !== 'prohibit' &&
        frequency !== 'recreational' &&
        frequency !== 'restricted'
      ) {
        projectData.space[frequency].forEach((point) => {
          mapUIStore.addFeature({
            type: 'Point',
            coordinates: [point.lon, point.lat],
            frequency: frequency,
            comment: point.comment,
            name: projectData.name,
            timestamp: point.timestamp,
          })
        })
      }
    })

    // Process space.recreational data (Polygons)
    if (Array.isArray(projectData.space.recreational)) {
      projectData.space.recreational.forEach((polygon) => {
        mapUIStore.addFeature({
          type: 'Polygon',
          coordinates: JSON.parse(polygon.geometry),
          comment: polygon.comment,
          name: projectData.name,
          timestamp: polygon.timestamp,
        })
      })
    }

    // Process space.restricted data (LineStrings)
    if (Array.isArray(projectData.space.restricted)) {
      projectData.space.restricted.forEach((lineString) => {
        mapUIStore.addFeature({
          type: 'LineString',
          coordinates: JSON.parse(lineString.geometry),
          comment: lineString.comment,
          name: projectData.name,
          timestamp: lineString.timestamp,
        })
      })
    }

    // Process belonging data
    Object.keys(projectData.belonging).forEach((key) => {
      if (Array.isArray(projectData.belonging[key])) {
        projectData.belonging[key].forEach((point) => {
          mapUIStore.addFeature({
            type: 'Point',
            coordinates: [point.lon, point.lat],
            iconName: key,
            comment: point.comment,
            name: projectData.name,
            timestamp: point.timestamp,
          })
        })
      }
    })

    // Process safety data
    Object.keys(projectData.safety).forEach((key) => {
      if (Array.isArray(projectData.safety[key])) {
        projectData.safety[key].forEach((point) => {
          mapUIStore.addFeature({
            type: 'Point',
            coordinates: [point.lon, point.lat],
            iconName: key,
            comment: point.comment,
            name: projectData.name,
            timestamp: point.timestamp,
          })
        })
      }
    })

    // Process environment data
    Object.keys(projectData.environment).forEach((key) => {
      if (Array.isArray(projectData.environment[key])) {
        projectData.environment[key].forEach((point) => {
          mapUIStore.addFeature({
            type: 'Point',
            coordinates: [point.lon, point.lat],
            iconName: key,
            comment: point.comment,
            name: projectData.name,
            timestamp: point.timestamp,
          })
        })
      }
    })
  }

  console.log('All features have been loaded')
})

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
  height: 100vh;
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
