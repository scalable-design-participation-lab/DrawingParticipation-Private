<script setup lang="ts">
import { computed } from 'vue'
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'

/**
 * Props for configuring interpolation.
 */
interface InterpolationProps {
  /**
   * A collection of input points as a Turf.js FeatureCollection.
   * Must include a property for interpolation.
   */
  points: { coordinates: [number, number], value: number }[]

  /**
   * The name of the property to interpolate.
   */
  property: string

  /**
   * The number of grid points to generate.
   */
  gridPoints?: number

  /**
   * The type of grid for interpolation (default is "points").
   */
  gridType?: 'points' | 'hex' | 'square' | 'triangle'

  /**
   * The measurement units for grid spacing.
   */
  units?: 'miles' | 'kilometers' | 'radians' | 'degrees'

  /**
   * Visibility of the interpolation layer.
   */
  visible?: boolean

  /**
   * The z-index of the layer.
   */
  zIndex?: number
  /**
   * bbox
   */
  bbox?: number[]
}

const props = withDefaults(defineProps<InterpolationProps>(), {
  gridPoints: 100,
  gridType: 'points',
  units: 'miles',
  visible: true,
  zIndex: 1,
  bbox: () => [-180, -90, 180, 90],
})

const gridFeatures = computed(() => {
  if (!props.points || !props.points.length)
    return []

  // Convert input points to a FeatureCollection with properties
  const points = turf.featureCollection(
    props.points.map(({ coordinates, value }) =>
      turf.point(coordinates, { [props.property]: value }),
    ),
  )

  // Interpolation options
  const options = {
    gridType: props.gridType,
    property: props.property,
    units: props.units,
  }

  // Perform interpolation
  const interpolatedGrid = turf.interpolate(points, props.gridPoints, options)
  const geoJson = new GeoJSON()

  return geoJson.readFeatures(interpolatedGrid, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
})
</script>

<template>
  <ol-vector-layer :z-index="zIndex" :visible="visible">
    <ol-source-vector :features="gridFeatures" />
  </ol-vector-layer>
</template>
