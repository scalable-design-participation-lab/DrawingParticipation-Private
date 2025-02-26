<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { computed, defineProps, withDefaults } from 'vue'
import type { FeatureCollection, Geometry } from 'geojson'

export type BufferMode = 'none' | 'union' | 'intersect'

export interface BufferProps {
  features?: FeatureCollection<Geometry>
  zIndex?: number
  visible?: boolean
  radius?: number
  mode?: BufferMode
  units?: 'meters' | 'kilometers' | 'miles'
}

const props = withDefaults(defineProps<BufferProps>(), {
  features: () => ({ type: 'FeatureCollection', features: [] }) as FeatureCollection<Geometry>,
  zIndex: 1,
  visible: true,
  radius: 200,
  mode: 'none',
  units: 'miles',
})

const geoJson = new GeoJSON()

const bufferFeatures = computed(() => {
  if (!props.features || !props.features.features?.length || props.radius <= 0) {
    console.warn('No features available for buffering or invalid radius.')
    return []
  }
  const buffers = props.features.features.map((feature) => {
    return turf.buffer(feature, props.radius, { units: props.units })
  })
  const collection = turf.featureCollection(buffers)

  if (props.mode === 'union') {
    const unioned = turf.union(collection)
    buffers.length = 0
    if (!unioned) {
      return []
    }
    buffers.push(unioned)
  }

  if (props.mode === 'intersect') {
    const intersected = turf.intersect(collection)
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
