<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
import Style from 'ol/style/Style'
import type { FeatureCollection, Geometry } from 'geojson'

export interface PointsLayerProps {
  /**
   * An array of OpenLayers `Feature` objects that define the data points to be visualized in the heatmap.
   * Projection needs to be in EPSG:3857 because OpenLayers
   * @default []
   */
  features?: FeatureCollection<Geometry>

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
   * @default 3
   */
  shapePoints?: number

  /**
   * shape radius for webgl style
   * @default 10
   */
  shapeRadius?: number

  /**
   * shape opacity for webgl style
   * @default 1
   */
  shapeOpacity?: number

  /**
   * shape fill color for webgl style
   * @default 'red'
   */
  shapeFillColor?: string
  /**
   * Style of the points layers
   * @default new Icon({ src: redIcon, scale: 1, anchor: [0.5, 0.5],})
   */
  icon?: string
}

const props = withDefaults(defineProps<PointsLayerProps>(), {
  features: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  visible: false,
  zIndex: 1,
  shapePoints: 3,
  shapeRadius: 10,
  shapeOpacity: 1,
  shapeFillColor: 'red',
})

// Create a computed style object
const webglPointStyle = computed(() => ({
  'shape-points': props.shapePoints,
  'shape-radius': props.shapeRadius,
  'shape-opacity': props.shapeOpacity,
  'shape-fill-color': props.shapeFillColor,
}))
const geoJson = new GeoJSON()
const features = computed(() => {
  return geoJson.readFeatures(props.features, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
})
const styledFeatures = computed(() => {
  return features.value.map((feature) => {
    feature.setStyle(new Style({
      image: new Icon({
        src: props.icon,
        scale: 1,
        anchor: [0.5, 0.5],
      }),
    }),
    )
    return feature
  })
})
</script>

<template>
  <!-- Force a reactivity using a key -->
  <ol-vector-layer v-if="props.icon" :z-index="zIndex" :visible="visible">
    <ol-source-vector :features="styledFeatures" />
  </ol-vector-layer>
  <ol-webgl-vector-layer
    v-else
    :key="JSON.stringify(webglPointStyle)"
    :styles="webglPointStyle"
    :z-index="props.zIndex"
    :visible="props.visible"
  >
    <ol-source-vector :features="features" />
  </ol-webgl-vector-layer>
</template>
