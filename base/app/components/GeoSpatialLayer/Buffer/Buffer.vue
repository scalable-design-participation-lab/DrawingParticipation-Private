<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { toLonLat } from 'ol/proj'
import { computed, defineProps, withDefaults } from 'vue'

export interface BufferProps {
  coordinates?: [number, number][]
  zIndex?: number
  visible?: boolean
  radius?: number
}

const props = withDefaults(defineProps<BufferProps>(), {
  coordinates: () => [],
  zIndex: 1,
  visible: true,
  radius: 200,
})

const geoJson = new GeoJSON()

const bufferFeatures = computed(() => {
  if (!props.coordinates.length) {
    return []
  }

  const buffers = props.coordinates.map(coord =>
    turf.buffer(turf.point(coord), props.radius, { units: 'meters' }),
  )

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
