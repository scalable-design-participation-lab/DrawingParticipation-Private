<script setup lang="ts">
import { useAllFeatureStore } from '@base/stores/all-features';
import * as turf from '@turf/turf'; 
import Grid, { type GridType } from '@base/components/GeoSpatialLayer/Grid/Grid.vue';
import GridController from '@base/components/GeoSpatialLayer/Grid/GridController.vue';
import { toLonLat } from 'ol/proj';

const { featuresByType } = useAllFeatureStore();
const pointFeatures = computed(() => featuresByType.Point);
const features = computed(() => {
  const points = pointFeatures.value.map(({ coordinates }) => {
    return turf.point(toLonLat(coordinates as [number, number]));
  });
  return turf.featureCollection(points);
})

const shape = ref<GridType>('Hexagon');
const baseHue = ref<number>(0);
const cellSide = ref<number>(0.2);
const visible = ref<boolean>(true); 
const width = ref<number>(1);

</script>
<template>
  <!-- <GridController
   v-model:baseHue="baseHue"
   v-model:cellSide="cellSide"
   v-model:visible="visible"
   v-model:shape="shape"
   v-model:width="width" />  -->

      <Grid 
      :features="features" 
      :bbox="[28.462271, 49.215576, 28.570271, 49.265576]"
      :cellSide="cellSide"
      layerId="hexLayer"
      :baseHue="baseHue" 
      :shape="shape"
      :visible="visible"
      :width="width"/>
</template>

