<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { Fill, Stroke, Style } from 'ol/style'
import { computed } from 'vue'
import type { Feature } from 'ol'

export interface VoronoiProps {
  coordinates?: [number, number][]
  bbox?: number[]
  visible?: boolean
  zIndex?: number
}

const props = withDefaults(defineProps<VoronoiProps>(), {
  coordinates: () => [],
  bbox: () => [28.462271, 49.215576, 28.570271, 49.265576],
  visible: false,
  zIndex: 0,
})

const geoJson = new GeoJSON()

const features = computed(() => {
  if (!props.coordinates.length) {
    console.warn('No coordinates provided for Voronoi computation.')
    return []
  }

  const points = props.coordinates.map(coord => turf.point(coord))
  const collections = turf.featureCollection(points)
  console.log('Voronoi collections:', collections)
  const voronoiPolygons = turf.voronoi(collections, { bbox: props.bbox })

  // Filter out features with invalid geometry
  // Turf’s Voronoi function can sometimes return features without a valid geometry. This can happen if the algorithm can’t compute a proper polygon for certain points—often due to edge cases like points being too close together, lying on the boundary, or duplicate points.
  const validPolygons = {
    ...voronoiPolygons,
    features: voronoiPolygons.features.filter(feature => feature.geometry),
  }

  const features = geoJson.readFeatures(validPolygons, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
  features.forEach((feature) => {
    feature.set('fillColor', randomColor())
  })
  return features
})

// Function to generate a random color
function randomColor() {
  return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
    Math.random() * 256,
  )}, ${Math.floor(Math.random() * 256)}, 0.6)`
}

/**
 * OpenLayers Style Function for Grid Cells
 */
function hexStyleFunction(feature: Feature) {
  return new Style({
    fill: new Fill({
      color: feature.get('fillColor') || 'rgba(0, 0, 0, 0.1)', // Fallback color
    }),
    stroke: new Stroke({ color: '#ffffff', width: 1 }),
  })
}
</script>

<template>
  <ol-vector-layer :visible="props.visible" :z-index="props.zIndex">
    <ol-source-vector :features="features" />
    <ol-style :override-style-function="hexStyleFunction" />
  </ol-vector-layer>
</template>
