<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { Fill, Stroke, Style } from 'ol/style'
import { computed } from 'vue'
import type { Feature } from 'ol'

export type TesselationType = 'voronoi' | 'tin'
export type OpacityMode = 'larger' | 'smaller'
export interface TesselationProps {
  coordinates?: [number, number][]
  bbox?: number[]
  visible?: boolean
  zIndex?: number
  type?: TesselationType
  width?: number
  opacity?: number
  opacityMode?: OpacityMode
  colorFunction?: (opacity: number) => string
}

const props = withDefaults(defineProps<TesselationProps>(), {
  coordinates: () => [],
  bbox: () => [28.462271, 49.215576, 28.570271, 49.265576],
  visible: false,
  zIndex: 0,
  type: 'tin',
  width: 1,
  opacity: 0.5,
  opacityMode: 'larger', // 'larger' means larger cells are more opaque; 'smaller' reverses that.
  colorFunction: undefined, // Allow user to override coloring function
})

const geoJson = new GeoJSON()

const features = computed(() => {
  if (!props.coordinates.length) {
    console.warn('No coordinates provided for Tesselation computation.')
    return []
  }
  // Filter points within the bbox
  const [minX, minY, maxX, maxY] = props.bbox
  const filteredCoordinates = props.coordinates.filter(([x, y]) =>
    x >= minX && x <= maxX && y >= minY && y <= maxY,
  )

  if (!filteredCoordinates.length) {
    console.warn('No valid coordinates inside the bounding box for Tesselation.')
    return []
  }

  const points = filteredCoordinates.map(coord => turf.point(coord))
  const collections = turf.featureCollection(points)
  const polygons = props.type === 'tin'
    ? turf.tin(collections)
    : turf.voronoi(collections, { bbox: props.bbox })

  // Filter out features with invalid geometry
  const validPolygons = {
    ...polygons,
    features: polygons.features.filter(feature => feature.geometry),
  }
  // Calculate areas and normalize to set opacity
  const areas = validPolygons.features.map(feature => turf.area(feature))
  const minArea = Math.min(...areas)
  const maxArea = Math.max(...areas)

  const features = geoJson.readFeatures(validPolygons, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
  features.forEach((feature, index) => {
    const area = areas[index]
    const normalizedOpacity = normalizeOpacity(area, minArea, maxArea)
    feature.set('fillColor', props.colorFunction
      ? props.colorFunction(normalizedOpacity)
      : randomColor(normalizedOpacity))
  })
  return features
})

/**
 * Normalize area values to opacity range (0.1 to props.opacity).
 * If `opacityMode` is 'larger', larger areas get higher opacity.
 * If `opacityMode` is 'smaller', smaller areas get higher opacity.
 */
function normalizeOpacity(area: number, minArea: number, maxArea: number) {
  if (minArea === maxArea)
    return props.opacity
  const scale = (area - minArea) / (maxArea - minArea)
  if (props.opacityMode === 'smaller') {
    return (1 - scale) * (props.opacity - 0.1)
  }
  return scale * (props.opacity - 0.1)
}

/**
 * Function to generate a random color with the given opacity.
 */
function randomColor(opacity: number) {
  return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
    Math.random() * 256,
  )}, ${Math.floor(Math.random() * 256)}, ${opacity})`
}

/**
 * OpenLayers Style Function for Grid Cells
 */
function hexStyleFunction(feature: Feature) {
  return new Style({
    fill: new Fill({
      color: feature.get('fillColor') || 'rgba(0, 0, 0, 0.1)', // Fallback color
    }),
    stroke: new Stroke({ color: '#ffffff', width: props.width }),
  })
}
</script>

<template>
  <ol-vector-layer :visible="props.visible" :z-index="props.zIndex">
    <ol-source-vector :features="features" />
    <ol-style :override-style-function="hexStyleFunction" />
  </ol-vector-layer>
</template>
