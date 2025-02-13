<script setup lang="ts">
import { computed } from 'vue';
import * as turf from '@turf/turf';
import GeoJSON from 'ol/format/GeoJSON';
import Points from '@base/components/GeoSpatialLayer/Points/Points.vue';
import smileIcon from '@/assets/icons/smile.svg';
import { Icon } from 'ol/style';
import { useAllFeatureStore } from '@base/stores/all-features';
import { toLonLat } from 'ol/proj';

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


// Define Icon Style
const icon = new Icon({
  src: smileIcon,
  scale: 1,
  anchor: [0.5, 0.5],
});
</script>

<template>
  <GeneralizedBackgroundMap ref="baseMap" :min-zoom="0">
    <template #layers>
      <Points :features="features" :visible="true" :icon="icon" />
    </template>
  </GeneralizedBackgroundMap>
</template>