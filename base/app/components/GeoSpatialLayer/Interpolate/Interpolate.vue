<script setup lang="ts">
import { computed } from 'vue'
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import type { FeatureCollection, Geometry } from 'geojson'
import { toLonLat } from 'ol/proj'

/**
 * Props for configuring interpolation.
 */
interface InterpolationProps {
  /**
   * A collection of input points as a Turf.js FeatureCollection.
   * Must include a property for interpolation.
   */
  features: FeatureCollection<Geometry>

  /**
   * The name of the property to interpolate.
   */
  property: string

  /**
   * The number of grid points to generate.
   */
  gridSize?: number

  /**
   * The type of grid for interpolation (default is "points").
   */
  gridType?: 'point' | 'hex' | 'square' | 'triangle'

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
  features: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  gridSize: 100,
  gridType: 'point',
  units: 'miles',
  visible: true,
  zIndex: 1,
  bbox: () => [-180, -90, 180, 90],
})

const pointCollection = computed(() => {
  const seen = new Set<string>()
  const raw = props.features!.features ?? []

  const pts = raw
    // only features that actually have the property
    .filter(f => f.properties?.[props.property] != null)
    // extract coords & value
    .map((f) => {
      const coords = (f.geometry as any).coordinates as [number, number]
      return {
        lonlat: coords, // ← use coords directly
        value: f.properties![props.property] as number,
      }
    })
    // clip to bbox (now in the same [lon,lat] space)
    .filter(({ lonlat: [lng, lat] }) => {
      const [minX, minY, maxX, maxY] = props.bbox!
      return lng >= minX && lat >= minY && lng <= maxX && lat <= maxY
    })
    // dedupe
    .filter(({ lonlat }) => {
      const key = lonlat.join(',')
      if (seen.has(key))
        return false
      seen.add(key)
      return true
    })
    // make Turf points
    .map(({ lonlat, value }) =>
      turf.point(lonlat, { [props.property]: value }),
    )

  return turf.featureCollection(pts)
})
const gridFeatures = computed(() => {
  if (!pointCollection.value.features.length)
    return []

  const interpolated = turf.interpolate(
    pointCollection.value,
    props.gridSize!,
    {
      gridType: props.gridType!,
      property: props.property,
      units: props.units!,
    },
  )

  return new GeoJSON().readFeatures(interpolated, {
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
