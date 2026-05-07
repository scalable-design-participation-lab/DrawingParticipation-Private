<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
    @toggle-icon-details="handleShowQuickLook"
  >
    <template #layers>
      <DrawingLayer
        :projection="projection"
        :is-map-page="isMapPage"
        :show-delete-button="false"
        :showCommentIcons= "false"
        :show-all-plus-icons="false"
      />
    </template>
  </GeneralizedBackgroundMap>

  <!-- Quick Look -->
  <QuickLook
    v-if="showQuickLook"
    :marker-position="quickLookPosition"
    :showPreviousArrow="false"
    :showNextArrow="false"
    :showExpand="true"
    :title="selectedFeature.comment"
    :date-published="selectedFeature.properties?.date || 'hi'"
    :imagePath="'/Solution_Photos/'+ selectedFeature.properties?.string_id +'/1.png'"
    :location="selectedFeature.properties?.location || 'hi'"
    :caption="selectedFeature.properties?.mediaCaptions || 'hi'"
    :primary-tag="selectedFeature.properties?.primaryTag || ''"
    @click-expand="handleExpandedPopup"
    @click-close="handleCloseQuickLook"
  />

  <!-- Info Popup -->
  <InfoPopup
    v-if="showPopup && selectedFeature"
    :title="selectedFeature.comment"
    :date-published="selectedFeature.properties?.date || 'hi'"
    :imagePath="'/Solution_Photos/'+ selectedFeature.properties?.string_id +'/1.png'"
    :location="selectedFeature.properties?.location || 'hi'"
    :caption="selectedFeature.properties?.mediaCaptions || 'hi'"
    :description="selectedFeature.properties?.description || 'hi'"
    :connection="selectedFeature.properties?.mncConnection || 'hi'"
    :primary-tag="selectedFeature.properties?.primaryTag || 'N/A'"
    :secondary-tag="selectedFeature.properties?.secondaryTags || 'N/A'"
    :links="parsedLinks"
    @close="closePopup"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'nuxt/app'
import InfoPopup from './infoPopup.vue'

const route = useRoute()
const projection = ref('EPSG:3857')
const isMapPage = computed(() => route.name === 'result')
const baseMap = ref(null)

// Popup state
const showPopup = ref(false)
const showQuickLook = ref(false)
const selectedFeature = ref(null)
const quickLookPosition = ref({ x: 0, y: 0 })

// Parse links from semicolon-separated string
const parsedLinks = computed(() => {
  if (!selectedFeature.value?.properties?.links) {
    return []
  }
  
  const linksString = selectedFeature.value.properties.links
  // Split by semicolon and filter out empty strings
  return linksString
    .split(';')
    .map(link => link.trim())
    .filter(link => link.length > 0)
    .map(link => ({ label: link, url: '' }))
})

function handleShowQuickLook(payload: any) {
  console.log("handling ShowQuickLook in background map", payload)
  selectedFeature.value = payload?.feature ?? payload
  if (payload?.markerPosition) {
    quickLookPosition.value = payload.markerPosition
  }
  else if (typeof window !== 'undefined') {
    quickLookPosition.value = {
      x: Math.round(window.innerWidth / 2),
      y: Math.round(window.innerHeight / 2),
    }
  }
  showQuickLook.value = true
}

function handleCloseQuickLook() {
  console.log("handling CloseQuickLook in background map")
  selectedFeature.value = null
  showQuickLook.value = false
}

function handleExpandedPopup() {
  console.log("handling ExpandedPopup in background map")
  showPopup.value = true
  showQuickLook.value = false
}

function closePopup() {
  showPopup.value = false
  selectedFeature.value = null
}

const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'
</script>
