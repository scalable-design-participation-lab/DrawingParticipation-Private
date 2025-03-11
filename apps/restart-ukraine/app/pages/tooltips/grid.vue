<script setup lang="ts">
import { toLonLat } from 'ol/proj'
import {ref } from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import ToolTips from '@base/components/Tools/ToolTips.vue'
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
// remove same dataPoints 
const dataPointsFiltered = computed(() => {
  const seen = new Set();
  return turf.featureCollection(dataPoints.value.features.filter((feature) => {
    const coordString = feature.geometry.coordinates.toString();
    if (seen.has(coordString)) {
      return false;
    }
    seen.add(coordString);
    return true;
  }));
});

const features = computed(() => {
  return geoJson.readFeatures(dataPointsFiltered.value, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
});
const shape = ref<GridType>('Hexagon');
const baseHue = ref<number>(0);
const cellSide = ref<number>(0.2);
const visible = ref<boolean>(true); 
const width = ref<number>(1);


const pointStyle = {
    radius: 6,
    fill: 'rgba(0, 100, 255, 0.8)',
    stroke: {
      color: 'white',
      width: 2,
    },
  }
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
          <Grid
          :features="features" 
          :shape="shape"
          :cellSide="cellSide"
          :baseHue="baseHue"
          :visible="visible"
          :width="width"
          />
 <!-- Vector Layer with Interactions -->
            <ol-vector-layer>
              <ol-source-vector
                :features="features"
                :format="new GeoJSON()"
              />
              <!-- Default Style -->
              <ol-style>
                <ol-style-fill color="rgba(0, 0, 0, 0)" />
                <ol-style-stroke color="green" :width="10" />
                <ol-style-circle :radius="pointStyle.radius">
                  <ol-style-fill :color="pointStyle.fill" />
                  <ol-style-stroke
                    :color="pointStyle.stroke.color"
                    :width="pointStyle.stroke.width"
                  />
                </ol-style-circle>
              </ol-style>
            </ol-vector-layer>
    </template>
    <template #overlays>
      <ToolTips :mapInstance="mapInstance" :filterKeys="['fillColor']"/>
    </template>
  </GeneralizedBackgroundMap>
</template>