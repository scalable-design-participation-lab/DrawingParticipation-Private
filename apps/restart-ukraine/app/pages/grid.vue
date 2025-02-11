<script setup lang="ts">
import { useAllFeatureStore } from '@base/stores/all-features';
import Grid, { type GridType, type PointFeature } from '@base/components/GeoSpatialLayer/Grid.vue';
import GridController from '@base/components/GeoSpatialLayer/GridController.vue';

const { featuresByType } = useAllFeatureStore();
const shape = ref<GridType>('Hexagon');
const baseHue = ref<number>(0);
const cellSide = ref<number>(0.2);
const visible = ref<boolean>(true); 

</script>
<template>
  <GridController
   v-model:baseHue="baseHue"
   v-model:cellSide="cellSide"
   v-model:visible="visible"
   v-model:shape="shape" /> 

  <GeneralizedBackgroundMap>
    <template #layers>
      <Grid 
      :points="featuresByType.Point as PointFeature[]" 
      :bbox="[28.462271, 49.215576, 28.570271, 49.265576]"
      :cellSide="cellSide"
      layerId="hexLayer"
      :baseHue="baseHue" 
      :shape="shape"
      :visible="visible"/>
    </template>
  </GeneralizedBackgroundMap>
</template>

