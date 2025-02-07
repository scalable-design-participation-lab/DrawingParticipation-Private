<template>
  <GeneralizedBackgroundMap>
    <template #layers>
      <HexGrid 
      :points="featuresByType.Point as PointFeature[]" 
      :bbox="[28.462271, 49.215576, 28.570271, 49.265576]"
      :cellSide="0.05"
      layerId="hexLayer"
      :baseHue="0" />
    </template>
  </GeneralizedBackgroundMap>
</template>

<script setup lang="ts">
import { useAllFeatureStore } from '@base/stores/all-features';
import HexGrid, { type PointFeature } from '@base/components/GeoSpatialLayer/HexGrid.vue';

const { featuresByType } = useAllFeatureStore();
</script>