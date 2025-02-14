<script setup lang="ts">
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'

export interface PointsLayerProps {
  /**
   * An array of OpenLayers `Feature` objects that define the data points to be visualized in the heatmap.
   * Projection needs to be in EPSG:3857 becayse OpenLayers
   * @default []
   *
   */
  features?: Feature<Geometry>[]

  /**
   * Visibility of the points layer
   * @default false
   */
  visible?: boolean

  /**
   * Z index of the points layers
   * @default 1
   */
  zIndex?: number

  /**
   * shape points for webgl style
   * @default 10
   *
   */
  shapePoints?: number

  /**
   * shape radius for webgl style
   * @default 10
   *
   */
  shapeRadius?: number

  /**
   * shape opacity for webgl style
   * @default 1
   *
   */
  shapeOpacity?: number

  /**
   * shape fill color for webgl style
   * @default 'red'
   *
   */
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

const webglPointStyle = {
  'shape-points': props.shapePoints,
  'shape-radius': props.shapeRadius,
  'shape-opacity': props.shapeOpacity,
  'shape-fill-color': props.shapeFillColor,
}
</script>

<template>
  <ol-webgl-vector-layer :styles="webglPointStyle" :z-index="zIndex" :visible="visible">
    <ol-source-vector :features="props.features" />
  </ol-webgl-vector-layer>
</template>
