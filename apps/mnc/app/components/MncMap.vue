<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Entry } from '../composables/catalog'
import { useLocalizedEntry } from '../composables/useLocalizedEntry'

/**
 * The MNC map: base map + category pins + the QuickLook card. Everything it
 * shows comes in as props; every choice the user makes goes out as an event.
 */
const props = withDefaults(defineProps<{
  features?: Entry[]
  visibleTags?: string[]
  /** The selected entry (from a pin, the sidebar or the list). */
  selected?: Entry | null
  /** Show the QuickLook card for `selected` (desktop). */
  quickLook?: boolean
  /** Capture the next tap as a location for the contribute flow. */
  picking?: boolean
  /** Placeholder pin for the contribute flow's chosen location. */
  pin?: [number, number] | null
  mapType?: 'vector' | 'satellite'
  isMobile?: boolean
}>(), {
  features: () => [],
  visibleTags: () => [],
  selected: null,
  quickLook: false,
  picking: false,
  pin: null,
  mapType: 'vector',
  isMobile: false,
})

const emit = defineEmits<{
  'update:selected': [entry: Entry | null]
  'update:quickLook': [open: boolean]
  /** QuickLook's expand button: open the full detail. */
  'expand': []
  /** A tap while `picking`: the chosen coordinate (EPSG:3857). */
  'pick': [coordinate: [number, number]]
  /** Desktop tap on the empty map: start a new entry here. */
  'addAt': [coordinate: [number, number]]
}>()

const { lf } = useLocalizedEntry()
const baseMap = ref<{ mapInstance?: { getView: () => { animate: (o: object) => void } } } | null>(null)

// Remount the pin layer whenever the visible-tag set changes: patching the
// ol-overlay list in place trips a vue3-openlayers "insertBefore" bug.
const layerKey = computed(() => [...props.visibleTags].sort().join('|'))

function handleMapClick(event: { coordinate?: number[] }) {
  const c = event?.coordinate
  const valid = Array.isArray(c) && c.length === 2
  if (props.picking) {
    if (valid) {
      emit('pick', [c[0], c[1]])
    }
    return
  }
  if (props.quickLook || props.selected) {
    emit('update:quickLook', false)
    emit('update:selected', null)
    return
  }
  if (valid && !props.isMobile) {
    emit('addAt', [c[0], c[1]])
  }
}

// Pin clicks select without flying (the pin is already on screen).
let fromPin = false
function onPin(payload: { feature: Entry } | Entry) {
  const entry = 'feature' in payload ? payload.feature : payload
  fromPin = true
  emit('update:selected', entry)
  if (!props.isMobile) {
    emit('update:quickLook', true)
  }
}

const center = (e: Entry | null) => (e && Array.isArray(e.coordinates) ? e.coordinates : null)

// Selected from outside (sidebar, list, moderation): fly there and show the card.
watch(() => props.selected, (entry) => {
  if (fromPin) {
    fromPin = false
    return
  }
  const c = center(entry)
  if (c) {
    baseMap.value?.mapInstance?.getView().animate({ center: c, zoom: 16, duration: 700 })
    if (!props.isMobile) {
      emit('update:quickLook', true)
    }
  }
})

const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'
</script>

<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
    :map-type="mapType"
    @toggle-icon-details="onPin"
    @map-click="handleMapClick"
  >
    <template #overlays>
      <MncMapLayer :key="layerKey" :features="features" :visible-tags="visibleTags" @select="onPin" />

      <ol-overlay
        v-if="quickLook && !isMobile && selected && center(selected)"
        :position="center(selected)!"
        positioning="top-left"
        :auto-pan="{ animation: { duration: 300 }, margin: 24 }"
      >
        <QuickLook
          :floating="false"
          :show-previous-arrow="false"
          :show-next-arrow="false"
          :show-expand="true"
          :title="lf(selected.properties, 'title', selected.comment)"
          :date-published="selected.properties?.date || ''"
          :image-path="selected.properties?.photos?.[0] || ''"
          :location="lf(selected.properties, 'location', selected.properties?.location || '')"
          :caption="selected.properties?.mediaCaptions || ''"
          :primary-tag="selected.properties?.primaryTag || ''"
          @click-expand="emit('expand')"
          @click-close="emit('update:quickLook', false); emit('update:selected', null)"
        />
      </ol-overlay>

      <ol-overlay v-if="pin" :position="pin" positioning="bottom-center">
        <div class="contribute-pin" aria-hidden="true">
          <UIcon name="i-heroicons-map-pin" class="contribute-pin__icon" />
        </div>
      </ol-overlay>
    </template>
  </GeneralizedBackgroundMap>
</template>

<style scoped>
.contribute-pin {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 3.5px solid white;
  background: #fb6d6d;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow:
    0 3px 12px rgba(0, 0, 0, 0.45),
    0 0 0 5px rgba(251, 109, 109, 0.35);
  animation: contribute-pin-pulse 1.6s ease-in-out infinite;
}
.contribute-pin::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 12px solid #fb6d6d;
}
.contribute-pin__icon {
  width: 28px;
  height: 28px;
  color: white;
  pointer-events: none;
}
@keyframes contribute-pin-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
</style>
