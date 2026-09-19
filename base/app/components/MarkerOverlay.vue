<script setup lang="ts">
import { computed } from 'vue'
import { fromLonLat } from 'ol/proj'

/**
 * One HTML overlay per item, placed on the map. Goes in the BackgroundMap
 * "overlays" slot; the `item` slot draws each marker.
 */
const props = withDefaults(defineProps<{
  items?: Record<string, unknown>[]
  /** One item instead of a list (e.g. the selected feature); null renders nothing. */
  item?: Record<string, unknown> | null
  positionKey?: string
  lonLat?: boolean
  positioning?: string
  stopEvent?: boolean
}>(), {
  items: () => [],
  item: null,
  positionKey: 'position',
  lonLat: true,
  positioning: 'center-center',
  stopEvent: false,
})

const all = computed(() => (props.item ? [...props.items, props.item] : props.items))

function positionOf(item: Record<string, unknown>) {
  const raw = item[props.positionKey] as [number, number]
  return props.lonLat ? fromLonLat(raw) : raw
}
</script>

<template>
  <ol-overlay
    v-for="(entry, i) in all"
    :key="i"
    :position="positionOf(entry)"
    :positioning="positioning"
    :stop-event="stopEvent"
  >
    <slot name="item" :item="entry" :index="i" />
  </ol-overlay>
</template>
