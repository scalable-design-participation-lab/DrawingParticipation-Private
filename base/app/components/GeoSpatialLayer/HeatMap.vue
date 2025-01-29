<script setup lang="ts">
import type Feature from 'ol/Feature'
import GeoJSON from 'ol/format/GeoJSON'
import type { Geometry } from 'ol/geom'

/**
 * Type definition for the props of the HeatmapLayer component.
 */
export interface HeatmapLayerProps {
  /**
   * The amount of blur applied to the heatmap.
   * Larger values result in smoother heatmaps.
   * @default 20
   */
  blur?: number

  /**
   * The radius of influence for each data point in the heatmap.
   * @default 20
   */
  radius?: number

  /**
   * The format used to read features.
   * Defaults to the GeoJSON format from OpenLayers.
   * @default new GeoJSON()
   */
  format?: GeoJSON

  /**
   * An array of OpenLayers `Feature` objects that define the data points to be visualized in the heatmap.
   * @default []
   */
  features?: Feature<Geometry>[]

  /**
   * The color gradient of the heatmap, specified as an array of CSS color strings.
   * Colors should transition smoothly from cool to warm
   * @default ['#00f', '#0ff', '#0f0', '#ff0', '#f00']
   */
  gradient?: string[]

  /**
   * Visibility of the heatmap
   * @default true
   */
  visible?: boolean

  /**
   * Callback function triggered when feature loading starts.
   * Logs "features load start" by default.
   * @default () => console.log('features load start')
   */
  featuresloadstart?: (event?: Event) => void

  /**
   * Callback function triggered when feature loading ends.
   * Logs "features load end" by default.
   * @default () => console.log('features load end')
   */
  featuresloadend?: (event?: Event) => void

  /**
   * Callback function triggered when an error occurs during feature loading.
   * Logs "features load error" by default.
   * @default () => console.log('features load error')
   */
  featuresloaderror?: (event?: Event) => void
}

/**
 * Define props with default values.
 */
withDefaults(defineProps<HeatmapLayerProps>(), {
  blur: 20,
  radius: 20,
  format: () => new GeoJSON(),
  features: () => [],
  featuresloadstart: () => console.log('features load start'),
  featuresloadend: () => console.log('features load end'),
  featuresloaderror: () => console.log('features load error'),
  gradient: () => ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
  visible: true,
})
</script>

<template>
  <ol-heatmap-layer title="heatmap" :blur="blur" :radius="radius" :z-index="1" :gradient="gradient" :visible="visible">
    <ol-source-vector
      :features="features"
      :format="format"
      @featuresloadstart="featuresloadstart"
      @featuresloadend="featuresloadend"
      @featuresloaderror="featuresloaderror"
    />
  </ol-heatmap-layer>
</template>
