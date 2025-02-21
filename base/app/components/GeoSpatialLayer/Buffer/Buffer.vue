<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { computed, defineProps, withDefaults } from 'vue'

export type BufferMode = 'none' | 'union' | 'intersect'
export interface BufferProps {
  coordinates?: [number, number][]
  zIndex?: number
  visible?: boolean
  radius?: number
  mode?: BufferMode
  units?: 'meters' | 'kilometers' | 'miles'
}

const props = withDefaults(defineProps<BufferProps>(), {
  coordinates: () => [],
  zIndex: 1,
  visible: true,
  radius: 200,
  mode: 'none',
  units: 'meters',
})

const geoJson = new GeoJSON()

const bufferFeatures = computed(() => {
  if (!props.coordinates.length || props.radius <= 0) {
    return []
  }

  const buffers = props.coordinates.map(coord =>
    turf.buffer(turf.point(coord), props.radius, { units: props.units }),
  )

  if (props.mode === 'union') {
    const featureCollection = turf.featureCollection(buffers)
    const unioned = turf.union(featureCollection)
    buffers.length = 0
    if (!unioned) {
      return []
    }
    buffers.push(unioned)
  }

  if (props.mode === 'intersect') {
    const featureCollection = turf.featureCollection(buffers)
    const intersected = turf.intersect(featureCollection)
    buffers.length = 0
    if (!intersected) {
      return []
    }
    buffers.push(intersected)
  }

  const features = buffers.flatMap(buffer =>
    geoJson.readFeatures(buffer, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    }),
  )

  return features
})
</script>

<template>
  <ol-vector-layer :z-index="zIndex" :visible="visible">
    <ol-source-vector :features="bufferFeatures" />
  </ol-vector-layer>
</template>
