<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
    :class="{ 'cursor-crosshair': solutionsStore.isPlacing }"
    @toggle-icon-details="handleShowQuickLook"
    @map-click="handleMapClick"
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
      <MncMapLayer :key="mncLayerKey" @toggle-icon-details="handleShowQuickLook" />

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
    :string-id="selectedFeature.properties?.string_id || ''"
    :date-published="selectedFeature.properties?.date || ''"
    :imagePath="'/Solution_Photos/'+ selectedFeature.properties?.string_id +'/1.png'"
    :photos="selectedFeature.properties?.photos || []"
    :location="selectedFeature.properties?.location || ''"
    :caption="selectedFeature.properties?.mediaCaptions || ''"
    :description="selectedFeature.properties?.description || ''"
    :connection="selectedFeature.properties?.mncConnection || ''"
    :primary-tag="selectedFeature.properties?.primaryTag || 'N/A'"
    :secondary-tag="selectedFeature.properties?.secondaryTags || 'N/A'"
    :links="parsedLinks"
    @close="closePopup"
  />

  <!-- "Add a Solution": placement banner + form -->
  <div
    v-if="solutionsStore.isPlacing"
    class="fixed left-1/2 top-24 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-lg dark:bg-black"
    style="border: 2px solid #FB6D6D;"
  >
    <UIcon name="i-heroicons-map-pin" class="h-5 w-5" :style="{ color: '#FB6D6D' }" />
    <span class="text-sm font-medium text-gray-900 dark:text-white">Click the map to place your solution</span>
    <UButton color="gray" variant="ghost" size="xs" class="rounded-full" @click="solutionsStore.cancelPlacing()">
      Cancel
    </UButton>
  </div>

  <AddSolutionModal
    v-if="pendingCoord"
    :coordinate="pendingCoord"
    @save="onSaveSolution"
    @close="pendingCoord = null"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'nuxt/app'
import { useFilterStore } from '../stores/filter'
import { useSolutionsStore, type SolutionInput } from '../stores/solutions'
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
const solutionsStore = useSolutionsStore()

// Map coordinate (EPSG:3857) captured for a new solution; non-null shows the form.
const pendingCoord = ref<[number, number] | null>(null)

// While in placement mode, a map click captures the coordinate and opens the
// "Add a Solution" form. Otherwise clicks on the empty map are ignored.
function handleMapClick(event: any) {
  if (!solutionsStore.isPlacing)
    return
  const coordinate = event?.coordinate
  if (Array.isArray(coordinate) && coordinate.length === 2) {
    pendingCoord.value = [coordinate[0], coordinate[1]]
    solutionsStore.cancelPlacing()
  }
}

function onSaveSolution(payload: SolutionInput) {
  solutionsStore.addSolution(payload)
  pendingCoord.value = null
}

// Popup state. The current selection is held in the filter store so that the
// FilteredSelectionSidebar and pin-click flows share a single source of truth.
const showPopup = ref(false)
const showQuickLook = ref(false)
const selectedFeature = computed<any>(() => filterStore.selectedFeature)

// Remount MncMapLayer whenever the visible-tag set changes. A clean remount of
// all pin overlays avoids a vue3-openlayers reconciliation bug where partially
// patching the ol-overlay list throws "insertBefore ... not a child of node".
const mncLayerKey = computed(() => [...filterStore.visibleTags].sort().join('|'))

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

// Links for the "Learn More" section. Prefer the structured list (real URLs
// from mncLinks.csv); fall back to splitting the legacy semicolon string.
const parsedLinks = computed(() => {
  const props = selectedFeature.value?.properties
  if (Array.isArray(props?.linkList) && props.linkList.length) {
    return props.linkList
  }
  if (!props?.links) {
    return []
  }
  return props.links
    .split(';')
    .map((link: string) => link.trim())
    .filter((link: string) => link.length > 0)
    .map((link: string) => ({ label: link, url: '' }))

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
