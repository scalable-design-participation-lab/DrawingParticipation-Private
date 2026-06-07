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

      <!-- Quick Look -->
      <ol-overlay
        v-if="showQuickLook && !isMobile && quickLookCenter"
        :position="quickLookCenter"
        positioning="top-left"
      >
        <QuickLook
          :floating="false"
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
      </ol-overlay>
    </template>
  </GeneralizedBackgroundMap>

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
const selectedFeature = computed<any>(() => filterStore.selectedFeature)

// Map coordinate (EPSG:3857) the QuickLook overlay is anchored to. The
// ol-overlay handles the coordinate->pixel positioning on every map render.
const quickLookCenter = computed(() => featureCenter(selectedFeature.value))

// Fly the map to a feature when it is selected from the sidebar. Coordinates are
// already in the map projection (EPSG:3857), so no reprojection is needed.
const FEATURE_ZOOM = 16 // fixed close zoom level
const FLY_DURATION_MS = 700

function featureCenter(feature: any): [number, number] | null {
  const c = feature?.coordinates
  if (!Array.isArray(c) || c.length === 0) return null
  // Point: [x, y]
  if (typeof c[0] === 'number' && typeof c[1] === 'number') {
    return [c[0], c[1]]
  }
  // Line/Polygon: arithmetic mean of vertex coordinates
  const pts = c.filter((p: any) => Array.isArray(p) && p.length === 2)
  if (!pts.length) return null
  const sx = pts.reduce((s: number, p: any) => s + p[0], 0) / pts.length
  const sy = pts.reduce((s: number, p: any) => s + p[1], 0) / pts.length
  return [sx, sy]
}

function flyToFeature(feature: any) {
  const center = featureCenter(feature)
  const map = (baseMap.value as any)?.mapInstance
  if (!center || !map) return
  map.getView().animate({
    center,
    zoom: FEATURE_ZOOM,
    duration: FLY_DURATION_MS,
  })
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

// Set just before a pin-click updates the selection so the selectedFeature
// watcher can skip flying/recentering for clicks on already-visible map pins.
let selectionFromPin = false

function handleShowQuickLook(payload: any) {
  const feature = payload?.feature ?? payload
  selectionFromPin = true
  filterStore.selectFeature(feature)

  if (isMobile.value) {
    emit('select-feature', feature)
    return
  }

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
// sidebar), fly to it and open QuickLook anchored to its map coordinate.
watch(
  () => filterStore.selectedFeature,
  (feature) => {
    // Pin clicks are fully handled by handleShowQuickLook; don't recenter on them.
    if (selectionFromPin) {
      selectionFromPin = false
      return
    }
    if (feature && !showPopup.value) {
      flyToFeature(feature)
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
