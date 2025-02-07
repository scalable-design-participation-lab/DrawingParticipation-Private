<script setup lang="ts">
import { computed } from 'vue'
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { Fill, Stroke, Style } from 'ol/style'
import { toLonLat } from 'ol/proj'

/**
 * Define the type for a point feature.
 */
export interface PointFeature {
  coordinates: [number, number]
}

export interface HexGridLayerProps {
  /**
   * an array of point feature used for computing the hex grid
   * @default []
   */
  points: PointFeature[]
  /**
   * the bounding box for the hex grid (default provided).
   * [minX, minY, maxX, maxY] in EPSG:4326 coordinates
   * @default [0,0,0,0]
   */
  bbox?: number[]
  /**
   * the side length of each hex cell (default provided).
   * @default 1
   */
  cellSide?: number
  /**
   *  the id for the vector layer (useful if you need to target it later).
   */
  layerId?: string
  /**
   *  the hue value for the hex cell colors.
   *  @default - 0 red
   */
  baseHue?: number
}

const props = withDefaults(defineProps<HexGridLayerProps>(), {
  points: () => [],
  bbox: () => [28.422271, 49.200576, 28.582271, 49.285576],
  cellSide: 1,
  layerId: 'hexayer',
  baseHue: 0,
})

const layerId = computed(() => layerId.value)

// Create a GeoJSON formatter instance.
const geoJson = new GeoJSON()

/**
 * Compute the hex grid features based on the passed-in points.
 */
const computedHexFeatures = computed(() => {
  if (!props.points || props.points.length === 0) {
    return []
  }

  // Use either the passed bbox and cellSide or the default values.
  const bbox = props.bbox
  const cellSide = props.cellSide
  const options = { units: 'miles' }

  // Create the hex grid using Turf.
  const hexgrid = turf.hexGrid(bbox, cellSide, options)

  const dataPoints = turf.featureCollection(
    props.points.map((point: PointFeature) => {
      const lonLat = toLonLat([point.coordinates[0], point.coordinates[1]], 'EPSG:3857')
      return turf.point(lonLat)
    }),
  )

  // Count how many points fall within each hexagon.
  hexgrid.features.forEach((feature) => {
    const ptsWithin = turf.pointsWithinPolygon(dataPoints, feature)
    feature.properties.count = ptsWithin.features.length
  })

  // Find the maximum count among all hex cells.
  const counts = hexgrid.features.map(feature => feature.properties.count)
  const maxCount = counts.length ? Math.max(...counts) : 0

  // Assign a fill color to each hex cell.
  const baseHue = props.baseHue
  hexgrid.features.forEach((feature) => {
    const count = feature.properties.count
    const lightness = maxCount > 0 ? 95 - (count / maxCount) * 70 : 100
    const alpha = count === 0 ? 0.5 : 1
    feature.properties.fillColor = `hsla(${baseHue}, 100%, ${lightness}%, ${alpha})`
  })

  // Convert the Turf GeoJSON to OpenLayers features.
  const features = geoJson.readFeatures(hexgrid, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })

  return features
})

/**
 * Define the style function for the hex cells.
 * This function returns an OpenLayers Style instance for a given feature.
 */
function hexStyleFunction(feature: any) {
  const fillColor = feature.get('fillColor') || 'hsla(0, 0%, 0%, 0)'
  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: '#ffffff',
      width: 1,
    }),
  })
}
</script>

<template>
  <ol-vector-layer :id="layerId">
    <ol-source-vector :features="computedHexFeatures" />
    <ol-style :override-style-function="hexStyleFunction" />
  </ol-vector-layer>
</template>
