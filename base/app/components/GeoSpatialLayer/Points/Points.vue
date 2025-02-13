<script setup lang="ts">
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'
import redIcon from '@/assets/icons/red.svg'

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
   * Style of the points layers
   * @default new Icon({ src: redIcon, scale: 1, anchor: [0.5, 0.5],})
   */
  icon?: Icon
}

const props = withDefaults(defineProps<PointsLayerProps>(), {
  features: () => [],
  visible: false,
  zIndex: 1,
  icon: () => new Icon({
    src: redIcon,
    scale: 1,
    anchor: [0.5, 0.5],
  }),
})

const styledFeatures = computed(() => {
  return props.features.map((feature) => {
    feature.setStyle(new Style({
      image: props.icon,
    }))
    return feature
  })
})
</script>

<template>
  <ol-vector-layer :z-index="zIndex" :visible="visible">
    <ol-source-vector :features="styledFeatures" />
  </ol-vector-layer>
</template>
