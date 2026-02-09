<script setup lang="ts">
import * as turf from '@turf/turf'
import HeatMap, { type HeatMapLayerSettings } from "@base/components/GeoSpatialLayer/HeatMap/HeatMap.vue";
import HeatMapController from "@base/components/GeoSpatialLayer/HeatMap/HeatMapController.vue";
import { toLonLat } from "ol/proj";
import { useAllFeatureStore } from '@base/stores/all-features';
// 🗺 Feature Store & GeoJSON Processor
const { featuresByCategory } = useAllFeatureStore();

// 🌍 Reactive State
const filterTime = useState<{ start: Date; end: Date }>("filterTime", () => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1); 
  return { start, end };
});
const getGeoJsonFeature = (featureKey: string) => {
  let features = featuresByCategory[featureKey] ?? [];

  console.log(`Processing featureKey: ${featureKey}, Initial features:`, features);

  // 🔍 Ensure features exist
  if (!Array.isArray(features) || features.length === 0) {
    console.warn(`No valid features found for key: ${featureKey}`);
    return turf.featureCollection([]);
  }

  // 🔍 Filter by "Comments" if enabled
  if (filters["Comments"]) {
    features = features.filter(feat => feat.comment && feat.comment.length > 0);
  }

  // ⏳ Filter by Time Range
  if (filterTime.value) {
    features = features.filter(feat => {
      if (!feat.timestamp) {
        console.warn(`Feature missing timestamp:`, feat);
        return false;
      }
      const featureCurrentTime = new Date(feat.timestamp);
      return featureCurrentTime >= filterTime.value.start && featureCurrentTime <= filterTime.value.end;
    });
  }

  // 🔍 Validate Coordinates
  features = features.map(feat => {
    if (
      !feat.coordinates || // Must exist
      !Array.isArray(feat.coordinates) || // Must be an array
      feat.coordinates.length !== 2 || // Must have exactly 2 elements
      typeof feat.coordinates[0] !== "number" || // First element must be a number (longitude)
      typeof feat.coordinates[1] !== "number" // Second element must be a number (latitude)
    ) {
      console.warn("Invalid coordinates, skipping feature:", feat);
      return null;
    }
    return turf.point(toLonLat(feat.coordinates)); // Preserve properties
  }).filter(Boolean); // Remove invalid features

  const featureCollection = turf.featureCollection(features);
  console.log(`Final GeoJSON for ${featureKey}:`, featureCollection);

  return featureCollection;
};
// 🔥 Computed Features for Each Category
const features = computed(() => {
  const entries = Object.entries(featuresByCategory).map(([key, value]) => {
    const geoJson = getGeoJsonFeature(key);
    return [key, geoJson];
  });
  return Object.fromEntries(entries);
});

// 📌 Compute Categories and Sections
const categories = computed(() => {
  const grouped: Record<string, string[]> = {};
  Object.keys(featuresByCategory).forEach((key) => {
    const [section, category] = key.split('.');
    if (section && category) {
      grouped[section] = grouped[section] || [];
      grouped[section].push(category);
    }
  });
  return grouped;
});
const filters = reactive({ "Comments": false });
const layerSettings = reactive<Record<string, HeatMapLayerSettings>>({});
const ranges: { label: string; duration: Duration }[] = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } }
];


</script>

<template>


  <!-- 📌 MAP & LAYERS -->
  <HeatMap
    v-for="key in Object.keys(features)"
    :key="key"
    :features="features[key]"
    :visible="layerSettings[key]?.visible"
    :weight="() => layerSettings[key]?.weight"
    :gradient="layerSettings[key]?.gradient"
    :blur="layerSettings[key]?.blur"
    :radius="layerSettings[key]?.radius"
    :opacity="layerSettings[key]?.opacity"
    :z-index="layerSettings[key]?.zIndex"
  />
</template>