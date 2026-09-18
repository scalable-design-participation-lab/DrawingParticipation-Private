<script setup lang="ts">
import { fromLonLat } from 'ol/proj'

/**
 * One HTML overlay per item, placed on the map. Goes in the BackgroundMap
 * "overlays" slot; the `item` slot draws each marker.
 */
const props = withDefaults(defineProps<{
  items?: Record<string, unknown>[]
  positionKey?: string
  lonLat?: boolean
  positioning?: string
  stopEvent?: boolean
}>(), {
  items: () => [],
  positionKey: 'position',
  lonLat: true,
  positioning: 'center-center',
  stopEvent: false,
})

function positionOf(item: Record<string, unknown>) {
  const raw = item[props.positionKey] as [number, number]
  return props.lonLat ? fromLonLat(raw) : raw
}
</script>

<template>
  <ol-overlay
    v-for="(item, i) in items"
    :key="i"
    :position="positionOf(item)"
    :positioning="positioning"
    :stop-event="stopEvent"
  >
    <slot name="item" :item="item" :index="i" />
  </ol-overlay>
</template>
