<script setup lang="ts">
import { computed } from 'vue'
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { Fill, Stroke, Style } from 'ol/style'
import type { FeatureCollection, Geometry } from 'geojson'

/**
 * Grid Type
 */
export type GridType = 'Hexagon' | 'Triangle' | 'Square'

/**
 * Default Props
 */
const props = withDefaults(defineProps<GridLayerProps>(), {
  points: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  bbox: () => [28.422271, 49.200576, 28.582271, 49.285576],
  cellSide: 1,
  layerId: 'gridLayer',
  baseHue: 0,
  shape: 'Hexagon',
  zIndex: 0,
  visible: false,
  width: 1,
})

/**
 * Defines the properties for the HexGridLayer component.
 */
interface GridLayerProps {
  /**
   * An array of point features used to compute the grid.
   * Each point contains geographic coordinates in the format [longitude, latitude].
   */
  features: FeatureCollection<Geometry>

  /**
   * The bounding box defining the spatial extent of the hex grid.
   * It is represented as an array of four numbers: [minX, minY, maxX, maxY].
   * The coordinates must be in the EPSG:4326 projection (longitude and latitude).
   *
   * @default [0, 0, 0, 0]
   */
  bbox?: number[]

  /**
   * The side length of each hexagonal, triangular, or square grid cell.
   * The value is in the same units as specified in the grid options (e.g., miles, meters).
   *
   * @default 1
   */
  cellSide?: number

  /**
   * The unique identifier for the vector layer.
   * Useful for referencing and manipulating the layer programmatically.
   *
   * @default "gridLayer"
   */
  layerId?: string

  /**
   * The base hue value for coloring grid cells.
   * The color is assigned in an HSL format (Hue, Saturation, Lightness),
   * where the hue defines the primary color of the cells.
   *
   * @default 0 (red)
   */
  baseHue?: number

  /**
   * The type of grid to generate.
   * Possible values are:
   * - `GridType.Hexagon` (default)
   * - `GridType.Triangle`
   * - `GridType.Square`
   */
  shape?: GridType

  /**
   * The z-index of the grid layer, determining its rendering order relative to other layers.
   * Higher values bring the layer to the foreground.
   *
   * @default  0 (OpenLayers default behavior)
   */
  zIndex?: number

  /**
   * Controls the visibility of the grid layer.
   * - `true`  makes the layer visible.
   * - `false` hides the layer.
   *
   * @default false
   */
  visible?: boolean
  /**
   * The width of the grid cell border.
   *
   * @default 1
   */
  width?: number
}

const layerId = computed(() => props.layerId)
const geoJson = new GeoJSON()

/**
 * Creates a grid based on the selected shape type.
 */
function createGrid() {
  const { bbox, cellSide, shape } = props
  const options = { units: 'miles' }

  switch (shape) {
    case 'Triangle':
      return turf.triangleGrid(bbox, cellSide, options)
    case 'Square':
      return turf.squareGrid(bbox, cellSide, options)
    case 'Hexagon':
    default:
      return turf.hexGrid(bbox, cellSide, options)
  }
}

/**
 * Counts points within each grid cell.
 */
function countPointsInGrid(grid: any, dataPoints: any) {
  grid.features.forEach((feature) => {
    let count = 0
    if (props.shape === 'Triangle') {
      const trianglePolygon = turf.polygon(feature.geometry.coordinates)
      count = turf.pointsWithinPolygon(dataPoints, trianglePolygon).features.length
    }
    else {
      count = turf.pointsWithinPolygon(dataPoints, feature).features.length
    }

    feature.properties.count = count
  })
}

/**
 * Assigns color to grid cells based on point density.
 */
function assignGridColors(grid: any) {
  const { baseHue } = props
  const maxCount = Math.max(...grid.features.map(f => f.properties.count), 0)

  grid.features.forEach((feature) => {
    const count = feature.properties.count
    const lightness = maxCount > 0 ? 95 - (count / maxCount) * 70 : 100
    const alpha = count === 0 ? 0.1 : 1
    feature.properties.fillColor = `hsla(${baseHue}, 100%, ${lightness}%, ${alpha})`
  })
}

/**
 * Computes grid features based on input points.
 * Ensure inputs are in the provided shape
 * Ensure colors are assigned to grid cells based on point density.
 * @returns An array of OpenLayers features representing the grid with colors density.
 */
const computedGridFeatures = computed(() => {
  if (!props.features.features.length)
    return []

  const grid = createGrid()
  const dataPoints = turf.featureCollection(
    props.features.features.map((feature) => {
      const coordinates = (feature.geometry as any).coordinates
      return turf.point(coordinates)
    }),
  )

  countPointsInGrid(grid, dataPoints)
  assignGridColors(grid)

  return geoJson.readFeatures(grid, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
})

/**
 * OpenLayers Style Function for Grid Cells
 */
function hexStyleFunction(feature: any) {
  return new Style({
    fill: new Fill({ color: feature.get('fillColor') || 'hsla(0, 0%, 0%, 0)' }),
    stroke: new Stroke({ color: '#ffffff', width: props.width }),
  })
}
</script>

<template>
  <ol-vector-layer :id="layerId" :z-index="zIndex" :visible="visible">
    <ol-source-vector :features="computedGridFeatures" />
    <ol-style :override-style-function="hexStyleFunction" />
  </ol-vector-layer>
</template>
