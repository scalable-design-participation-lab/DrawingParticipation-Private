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
        :feature-filter="nonMncFeatureFilter"
      />
    </template>
    <template #overlays>
      <MncMapLayer @toggle-icon-details="handleShowQuickLook" />
    </template>
  </GeneralizedBackgroundMap>

  <!-- Quick Look -->
  <QuickLook
    v-if="showQuickLook && !isMobile"
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
    v-if="showPopup && selectedFeature && !isMobile"
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'nuxt/app'
import { useFilterStore } from '../stores/filter'
import { useIsMobile } from '../composables/useIsMobile'
import InfoPopup from './infoPopup.vue'

const emit = defineEmits<{
  'select-feature': [feature: any]
}>()

const route = useRoute()
const projection = ref('EPSG:3857')
const isMapPage = computed(() => route.name === 'result')
const baseMap = ref(null)
const { isMobile } = useIsMobile()

const filterStore = useFilterStore()

// Popup state. The current selection is held in the filter store so that the
// FilteredSelectionSidebar and pin-click flows share a single source of truth.
const showPopup = ref(false)
const showQuickLook = ref(false)
const quickLookPosition = ref({ x: 0, y: 0 })
const selectedFeature = computed<any>(() => filterStore.selectedFeature)

function centerScreen() {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return {
    x: Math.round(window.innerWidth / 2),
    y: Math.round(window.innerHeight / 2),
  }
}

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
  const feature = payload?.feature ?? payload
  filterStore.selectFeature(feature)

  if (isMobile.value) {
    emit('select-feature', feature)
    return
  }

  quickLookPosition.value = payload?.markerPosition ?? centerScreen()
  showQuickLook.value = true
}

function handleCloseQuickLook() {
  showQuickLook.value = false
  filterStore.clearSelection()
}

function handleExpandedPopup() {
  showPopup.value = true
  showQuickLook.value = false
}

function closePopup() {
  showPopup.value = false
  filterStore.clearSelection()
}

// When a feature is selected from outside this component (e.g. the filter
// sidebar), open QuickLook in the center of the screen.
watch(
  () => filterStore.selectedFeature,
  (feature) => {
    if (feature && !showQuickLook.value && !showPopup.value) {
      quickLookPosition.value = centerScreen()
      showQuickLook.value = true
    }
  },
)

// MNC features (case-study entries from mncData.json) are rendered by
// MncMapLayer as clustered HTML overlays, so we exclude them from
// DrawingLayer's IconLayer to avoid double-rendering. Any other point
// features (e.g. user-drawn pins) still draw through IconLayer.
const nonMncFeatureFilter = (feature: any) => !(feature?.properties as any)?.string_id

const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'
</script>
