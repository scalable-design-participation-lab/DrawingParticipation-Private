<template>
  <GeneralizedBackgroundMap>
    <template #layers>
      <Grid 
      :points="featuresByType.Point as PointFeature[]" 
      :bbox="[28.462271, 49.215576, 28.570271, 49.265576]"
      :cellSide="0.2"
      layerId="hexLayer"
      :baseHue="250" 
      shape="Hexagon"
      :visible="true"/>
    </template>
  </GeneralizedBackgroundMap>
</template>

<script setup lang="ts">
import { useAllFeatureStore } from '@base/stores/all-features';
import Grid, { type PointFeature } from '@base/components/GeoSpatialLayer/Grid.vue';

const { featuresByType } = useAllFeatureStore();
</script>