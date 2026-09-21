<script setup lang="ts">
import { computed, inject, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Feature, Map } from 'ol'
import * as turf from '@turf/turf'

// Define TypeScript types
interface PopupState {
  coordinate: number[] | null
  feature: Feature | null
  content: Record<string, any>
  visible: boolean
  position: { x: number, y: number }
}

interface ToolTipsProps {
  mapInstance?: Map | null
  clickTolerance?: number
  hideKeys?: string[]
  itemsPerPage?: number
}

// Props with defaults
const props = withDefaults(defineProps<ToolTipsProps>(), {
  mapInstance: null,
  hideKeys: () => [],
  clickTolerance: 10,
  itemsPerPage: 5,
})

// Setup state management using composable pattern
function usePopupState() {
  const state = reactive<PopupState>({
    coordinate: null,
    feature: null,
    content: {},
    visible: false,
    position: { x: 0, y: 0 },
  })

  const reset = () => {
    state.coordinate = null
    state.feature = null
    state.content = {}
    state.visible = false
    state.position = { x: 0, y: 0 }
  }

  const update = (feature: Feature | null, coordinates: number[] | null) => {
    if (!feature || !coordinates) {
      reset()
      return
    }

    state.coordinate = coordinates
    state.feature = feature

    // Extract properties
    const properties = feature.getProperties()
    const excludedKeys = ['geometry', ...props.hideKeys]
    state.content = Object.fromEntries(
      Object.entries(properties).filter(([key]) => !excludedKeys.includes(key)),
    )

    state.visible = true
  }

  return {
    state,
    reset,
    update,
  }
}

// Create separate states for hover and pinned popups
const hoverPopup = usePopupState()
const pinnedPopup = usePopupState()
// Pagination state

// Calculate active popup content and position
const activePopup = computed(() => {
  return pinnedPopup.state.visible ? pinnedPopup.state : hoverPopup.state
})

const isPopupVisible = computed(() => {
  const popup = pinnedPopup.state.visible ? pinnedPopup.state : hoverPopup.state
  return popup.visible && Object.keys(popup.content).length > 0
})
/**
 * Sits above the feature, and below it when there is no room above: a popup on
 * a feature near the top of the map used to open off-screen, behind the header.
 * The height is measured rather than assumed, because it depends on how many
 * properties the feature carries.
 */
const popupEl = ref<HTMLElement | null>(null)
const flipBelow = ref(false)
const HEADER_BOTTOM = 88

watch(() => [activePopup.value.position.y, activePopup.value.content] as const, async () => {
  flipBelow.value = false
  await nextTick()
  const height = popupEl.value?.offsetHeight ?? 0
  flipBelow.value = activePopup.value.position.y - height - 16 < HEADER_BOTTOM
})

const popupTransform = computed(() =>
  (flipBelow.value ? 'translate(-50%, 1rem)' : 'translate(-50%, -120%)'),
)

// State for pagination
const itemsPerPage = props.itemsPerPage

const page = ref(1)
// Paginate the keys
const paginatedKeys = computed(() => {
  const keys = Object.keys(activePopup.value.content)
  const start = (page.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return keys.slice(start, end)
})
const total = computed(() => {
  return Object.keys(activePopup.value.content).length
})

// Store map instance and setup features
const mapInstance = ref<Map | null>(null)
// Helper functions
function getFeatureCentroid(feature: Feature): number[] | null {
  if (!feature)
    return null

  const geometry = feature.getGeometry()
  if (!geometry)
    return null

  const geomType = geometry.getType()
  const coordinates = geometry.getCoordinates()

  try {
    if (geomType === 'Polygon') {
      const polygon = turf.polygon(coordinates)
      const centroid = turf.centroid(polygon)
      return centroid.geometry.coordinates
    }
    if (geomType === 'MultiPolygon') {
      const multiPolygon = turf.multiPolygon(coordinates)
      const centroid = turf.centroid(multiPolygon)
      return centroid.geometry.coordinates
    }
    if (geomType === 'LineString') {
      const line = turf.lineString(coordinates)
      const centroid = turf.centroid(line)
      return centroid.geometry.coordinates
    }
    if (geomType === 'MultiLineString') {
      const multiLine = turf.multiLineString(coordinates)
      const centroid = turf.centroid(multiLine)
      return centroid.geometry.coordinates
    }
    // Anything else (a Point) is already a single coordinate.
    return coordinates
  }
  catch (error) {
    console.error('Error calculating centroid:', error)
    return coordinates
  }
}

function updatePopupPosition(coordinate: number[]) {
  if (!mapInstance.value || !coordinate)
    return

  const pixel = mapInstance.value.getPixelFromCoordinate(coordinate)

  // Update both popup states with the calculated position
  if (pinnedPopup.state.visible) {
    pinnedPopup.state.position = { x: pixel[0], y: pixel[1] }
  }
  else if (hoverPopup.state.visible) {
    hoverPopup.state.position = { x: pixel[0], y: pixel[1] }
  }
}

// Event handlers
function handleClick(event: { pixel: number[] }) {
  hoverPopup.reset()
  page.value = 1

  const feature = mapInstance.value?.forEachFeatureAtPixel(
    event.pixel,
    f => f as Feature,
    { hitTolerance: props.clickTolerance },
  ) ?? null

  if (!feature) {
    pinnedPopup.reset()
    return
  }
  const coordinates = getFeatureCentroid(feature)
  if (coordinates) {
    pinnedPopup.update(feature, coordinates)
    updatePopupPosition(coordinates)
  }
}

/**
 * Hovering reads the map, it does not change it. A select interaction would
 * redraw whatever is under the pointer in its own style, which means a
 * category icon turns into a plain circle while you read its tooltip.
 */
function handlePointerMove(event: { pixel: number[], dragging: boolean }) {
  if (pinnedPopup.state.visible || event.dragging || !mapInstance.value) {
    return
  }
  const feature = mapInstance.value.forEachFeatureAtPixel(
    event.pixel,
    f => f as Feature,
    { hitTolerance: props.clickTolerance },
  ) ?? null

  if (!feature) {
    hoverPopup.reset()
    return
  }
  if (feature === hoverPopup.state.feature) {
    return
  }
  const coordinates = getFeatureCentroid(feature)
  if (coordinates) {
    hoverPopup.update(feature, coordinates)
    updatePopupPosition(coordinates)
  }
}

function postRenderHandler() {
  if (pinnedPopup.state.visible && pinnedPopup.state.coordinate) {
    updatePopupPosition(pinnedPopup.state.coordinate)
  }
  else if (hoverPopup.state.visible && hoverPopup.state.coordinate) {
    updatePopupPosition(hoverPopup.state.coordinate)
  }
}

// Setup map instance and listeners
// Without an explicit prop, use the map provided by GeneralizedBackgroundMap.
const injectedMap = inject<Ref<Map | null> | null>('olMap', null)
function listen(map: Map | null, on: boolean) {
  if (!map) {
    return
  }
  const bind = on ? map.on.bind(map) : map.un.bind(map)
  bind('postrender', postRenderHandler)
  bind('pointermove', handlePointerMove)
  bind('click', handleClick)
}

// Detach from the old map before attaching to the new one, so a replaced map
// cannot keep calling into a popup that has moved on.
watch(() => props.mapInstance ?? injectedMap?.value ?? null, (newInstance, previous) => {
  listen(previous ?? null, false)
  mapInstance.value = newInstance
  listen(newInstance, true)
}, { immediate: true })

onUnmounted(() => listen(mapInstance.value, false))
</script>

<template>
  <!-- Unified Popup Component -->
  <Teleport to="#map-overlays">
    <div
      v-if="isPopupVisible"
      ref="popupEl"
      class="absolute max-w-xs bg-white p-3 rounded-xl border border-black dark:bg-black dark:text-white dark:border-white"
      :style="{
        left: `${activePopup.position.x}px`,
        top: `${activePopup.position.y}px`,
        transform: popupTransform,
        pointerEvents: 'auto',
      }"
    >
      <!-- The geometry type is for whoever is debugging a layer, so it follows
           the same list: name "geometry" in hideKeys and the line goes away. -->
      <div v-if="!hideKeys.includes('geometry')" class="underline">
        <strong class="capitalize">Geometry: </strong> {{ activePopup.feature?.getGeometry()?.getType() }}
      </div>
      <!-- Display paginated keys -->
      <div class="mt-2">
        <div v-for="key in paginatedKeys" :key="key">
          <strong class="capitalize">{{ key }}:</strong> {{ activePopup.content[key] }}
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="mt-2 !pointer-events-auto relative flex justify-center items-center pt-4">
        <UPagination
          v-model="page"
          :total="total"
          :page-count="itemsPerPage"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        >
          <template #prev="{ onClick, canGoPrev }">
            <UTooltip text="Previous page">
              <UButton
                icon="i-heroicons-arrow-small-left-20-solid"
                color="primary"
                :ui="{ rounded: 'rounded-full' }"
                class="rtl:[&_span:first-child]:rotate-180 me-2"
                :disabled="!canGoPrev"
                @click="onClick"
              />
            </UTooltip>
          </template>

          <template #next="{ onClick, canGoNext }">
            <UTooltip text="Next page">
              <UButton
                icon="i-heroicons-arrow-small-right-20-solid"
                color="primary"
                :ui="{ rounded: 'rounded-full' }"
                class="rtl:[&_span:last-child]:rotate-180 ms-2"
                :disabled="!canGoNext"
                @click="onClick"
              />
            </UTooltip>
          </template>
        </UPagination>
      </div>
    </div>
  </Teleport>
</template>
