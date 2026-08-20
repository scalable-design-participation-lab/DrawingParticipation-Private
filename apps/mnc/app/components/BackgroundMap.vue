<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
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

      <!-- Quick Look. autoPan nudges the map so the whole card is visible when a
           pin sits near the bottom/edge (otherwise the card would be clipped). -->
      <ol-overlay
        v-if="showQuickLook && !isMobile && quickLookCenter"
        :position="quickLookCenter"
        positioning="top-left"
        :auto-pan="{ animation: { duration: 300 }, margin: 24 }"
      >
        <QuickLook
          :floating="false"
          :showPreviousArrow="false"
          :showNextArrow="false"
          :showExpand="true"
          :title="selectedFeature.comment"
          :date-published="selectedFeature.properties?.date || ''"
          :imagePath="selectedFeature.properties?.photos?.[0] || ''"
          :location="selectedFeature.properties?.location || ''"
          :caption="selectedFeature.properties?.mediaCaptions || ''"
          :primary-tag="selectedFeature.properties?.primaryTag || ''"
          @click-expand="handleExpandedPopup"
          @click-close="handleCloseQuickLook"
        />
      </ol-overlay>

      <!-- Contribute flow: placeholder pin at the chosen (not yet submitted)
           entry location, so the user can see exactly where it landed. -->
      <ol-overlay
        v-if="contributePin"
        :position="contributePin"
        positioning="bottom-center"
      >
        <div class="contribute-pin" aria-hidden="true">
          <UIcon name="i-heroicons-map-pin" class="contribute-pin__icon" />
        </div>
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
    :audio="selectedFeature.properties?.audio || []"
    :location="selectedFeature.properties?.location || ''"
    :caption="selectedFeature.properties?.mediaCaptions || ''"
    :description="selectedFeature.properties?.description || ''"
    :connection="selectedFeature.properties?.mncConnection || ''"
    :primary-tag="selectedFeature.properties?.primaryTag || 'N/A'"
    :secondary-tag="selectedFeature.properties?.secondaryTags || 'N/A'"
    :links="parsedLinks"
    @close="closePopup"
  />

  <!-- Contribute flow: prompt to tap the map to drop a location pin -->
  <div
    v-if="pickingLocation"
    class="fixed left-1/2 top-24 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-lg dark:bg-black"
    style="border: 2px solid #FB6D6D;"
  >
    <UIcon name="i-heroicons-map-pin" class="h-5 w-5" :style="{ color: '#FB6D6D' }" />
    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('add.pickBanner') }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'nuxt/app'
import { useFilterStore } from '../stores/filter'
import { useIsMobile } from '../composables/useIsMobile'
import InfoPopup from './infoPopup.vue'

const props = defineProps<{
  showAllPlusIcons?: boolean
  showCommentIcons?: boolean
  // When true, the next map tap is captured for the contribute flow's location
  // step (emitted via `pick-location`) instead of starting a new entry.
  pickingLocation?: boolean
  // The contribute flow's chosen (but not yet submitted) entry location, shown
  // as a placeholder pin so the user can see exactly where it landed.
  contributePin?: [number, number] | null
}>()

const emit = defineEmits<{
  'select-feature': [feature: any]
  'pick-location': [coordinate: [number, number]]
  // A tap on the empty map: open the "Join Our Research" entry flow here.
  'add-entry-at': [coordinate: [number, number]]
}>()

const route = useRoute()
const projection = ref('EPSG:3857')
const isMapPage = computed(() => route.name === 'result')
const baseMap = ref(null)
const { isMobile } = useIsMobile()

const filterStore = useFilterStore()

// Map-click behavior: capture the coordinate for the contribute flow's pin-drop,
// otherwise dismiss any open detail, otherwise (desktop) open the entry flow at
// the click — a single tap, no need to arm "+" first. OpenLayers only fires
// 'click' on a real click (a pan is a drag), so casual exploration isn't hijacked.
function handleMapClick(event: any) {
  const coordinate = event?.coordinate
  const valid = Array.isArray(coordinate) && coordinate.length === 2

  // Contribute flow pin-drop: capture the tapped coordinate and hand it back.
  if (props.pickingLocation) {
    if (valid)
      emit('pick-location', [coordinate[0], coordinate[1]])
    return
  }

  // First click on the empty map closes an open QuickLook/detail rather than
  // starting a new entry.
  if (showQuickLook.value || showPopup.value) {
    showQuickLook.value = false
    showPopup.value = false
    filterStore.clearSelection()
    return
  }

  // Desktop: a tap on the empty map opens the entry flow at that point. (Mobile
  // adds from the "+" nav.)
  if (!valid || isMobile.value)
    return
  emit('add-entry-at', [coordinate[0], coordinate[1]])
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

<style scoped>
/* Contribute flow's placeholder pin: same coral used by the "tap to drop a
   pin" banner, with a soft pulse so it reads as provisional (not yet a real
   entry) rather than an existing pin. */
.contribute-pin {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 3.5px solid white;
  background: #FB6D6D;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.45), 0 0 0 5px rgba(251, 109, 109, 0.35);
  animation: contribute-pin-pulse 1.6s ease-in-out infinite;
}

.contribute-pin::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 12px solid #FB6D6D;
}

.contribute-pin__icon {
  width: 28px;
  height: 28px;
  color: white;
  pointer-events: none;
}

@keyframes contribute-pin-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
</style>
