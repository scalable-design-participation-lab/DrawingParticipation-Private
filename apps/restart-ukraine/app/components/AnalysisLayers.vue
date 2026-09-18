<script setup lang="ts">
import HeatMap from '@base/components/GeoSpatialLayer/HeatMap/HeatMap.vue'
import { layerDefinitions } from '../stores/layerRegistry'
import { useAnalysis } from '../composables/useAnalysis'

/** The active analysis layers. Goes in the BackgroundMap "layers" slot. */
const { layers, features, heatmapFeatures, layerSettings } = useAnalysis()
</script>

<template>
  <div v-for="layer in layers" :key="layer.id">
    <component
      :is="layerDefinitions[layer.type].component"
      v-if="layer.type !== 'heatmap'"
      v-bind="layer.props"
      :features="features"
    />
    <HeatMap
      v-for="key in Object.keys(heatmapFeatures)"
      v-else
      :key="key"
      :features="heatmapFeatures[key]"
      :visible="layerSettings[key]?.visible"
      :weight="() => layerSettings[key]?.weight"
      :gradient="layerSettings[key]?.gradient"
      :blur="layerSettings[key]?.blur"
      :radius="layerSettings[key]?.radius"
      :opacity="layerSettings[key]?.opacity"
      :z-index="layerSettings[key]?.zIndex"
    />
  </div>
</template>
