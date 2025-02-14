<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'

export interface PointsLayerProps {
  features?: Feature<Geometry>[]
  visible?: boolean
  zIndex?: number
  shapePoints?: number
  shapeRadius?: number
  shapeOpacity?: number
  shapeFillColor?: string
}

const props = withDefaults(defineProps<PointsLayerProps>(), {
  features: () => [],
  visible: false,
  zIndex: 1,
  shapePoints: 3,
  shapeRadius: 10,
  shapeOpacity: 1,
  shapeFillColor: 'red',
})

// Create a computed style object
const webglPointStyle = computed(() => ({
  'shape-points': props.shapePoints,
  'shape-radius': props.shapeRadius,
  'shape-opacity': props.shapeOpacity,
  'shape-fill-color': props.shapeFillColor,
}))
</script>

<template>
  <!-- Force a reactivity using a key -->
  <ol-webgl-vector-layer
    :key="JSON.stringify(webglPointStyle)"
    :styles="webglPointStyle"
    :z-index="props.zIndex"
    :visible="props.visible"
  >
    <ol-source-vector :features="props.features" />
  </ol-webgl-vector-layer>
</template>
