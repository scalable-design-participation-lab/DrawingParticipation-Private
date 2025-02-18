<script setup lang="ts">
import { computed } from 'vue';
import * as turf from '@turf/turf';
import GeoJSON from 'ol/format/GeoJSON';
import Points from '@base/components/GeoSpatialLayer/Points/Points.vue';
import { useAllFeatureStore } from '@base/stores/all-features';
import { toLonLat } from 'ol/proj';
import PointsController from '@base/components/GeoSpatialLayer/Points/PointsController.vue';
import smileIcon from '@/assets/icons/smile.svg';
import { Icon } from 'ol/style';

const { featuresByType } = useAllFeatureStore();

// Ensure reactivity
const pointFeatures = computed(() => featuresByType.Point);

// Convert raw points to Turf FeatureCollection
const dataPoints = computed(() => {
  const points = pointFeatures.value.map(({ coordinates }) => {
    // Convert from EPSG:3857 to EPSG:4326
    return turf.point(toLonLat(coordinates as [number, number]));
  });
  return turf.featureCollection(points);
});

// Convert Turf features to OpenLayers features
const geoJson = new GeoJSON();
const features = computed(() => {
  return geoJson.readFeatures(dataPoints.value, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
});
const visible = ref(true);
const zIndex = ref(1);
const shapePoints = ref(3);
const shapeRadius = ref(10);
const shapeOpacity = ref(1);
const shapeFillColor = ref('#ff0000');
</script>

<template>

  <PointsController
    v-model:visible="visible"
    v-model:zIndex="zIndex"
  />

  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
      <Points
        :features="features" 
        :visible="visible" 
        :z-index="zIndex" 
        :icon="smileIcon"
      />
    </template>
  </GeneralizedBackgroundMap>
</template>