<script setup lang="ts">
import { toLonLat, transform } from 'ol/proj'
import {ref, onMounted } from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import { click, pointerMove } from 'ol/events/condition'
import ToolTips from '@base/components/InteractiveLayer/ToolTips.vue'
import { useDataStore } from '@base/stores/data'
import * as turf from '@turf/turf'
import { useAllFeatureStore } from '@base/stores/all-features'
import type { GridType } from '@base/components/GeoSpatialLayer/Grid/Grid.vue'
import Grid from '@base/components/GeoSpatialLayer/Grid/Grid.vue'
import GridController from '@base/components/GeoSpatialLayer/Grid/GridController.vue';

// References and reactive state
// Define a ref to hold the reference to the child component
const mapRef = ref(null)

// Use a computed prop to access the exposed `mapInstance` from the child component
const mapInstance = computed(() => {
  return mapRef.value ? mapRef.value.mapInstance : null
}) 
const dataStore = useDataStore()
await dataStore.fetchData('https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities-airports.json')

const { featuresByType } = useAllFeatureStore();
const geoJson = new GeoJSON();
const pointFeatures = computed(() => featuresByType.Point);
const dataPoints = computed(() => {
  const points = pointFeatures.value.map(({ coordinates, comment }) => {
    return turf.point(toLonLat(coordinates as [number, number]), {comment: comment, coordinates: coordinates}); 
  });
  return turf.featureCollection(points);
})
const features = computed(() => {
  return geoJson.readFeatures(dataPoints.value, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
});
const data = dataStore.data 
const shape = ref<GridType>('Hexagon');
const baseHue = ref<number>(0);
const cellSide = ref<number>(0.2);
const visible = ref<boolean>(true); 
const width = ref<number>(1);


</script>

<template>
  <GridController
   v-model:baseHue="baseHue"
   v-model:cellSide="cellSide"
   v-model:visible="visible"
   v-model:shape="shape"
   v-model:width="width" /> 
  <GeneralizedBackgroundMap ref="mapRef" :min-zoom="0">
    <template #layers> 
      <ToolTips :mapInstance="mapInstance">
          <Grid
          :features="features" 
          :shape="shape"
          :cellSide="cellSide"
          :baseHue="baseHue"
          :visible="visible"
          :width="width"
          />
      </ToolTips> 
    </template>
  </GeneralizedBackgroundMap>
 
</template>