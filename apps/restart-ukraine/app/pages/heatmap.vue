<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useAllFeatureStore } from "../../../../base/app/stores/all-features";
import GeoJSON from "ol/format/GeoJSON";
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import HeatMap, { type HeatMapLayerSettings } from "@base/components/GeoSpatialLayer/HeatMap.vue";
import type { Feature, MapType } from "@base/stores/types/store";
import { useMapStore } from "@base/stores/map";
import LayerSideBar from "@base/components/GeoSpatialLayer/LayerSidebar.vue"

// 🌍 Map Store
const mapStore = useMapStore();
const { setMapType } = mapStore;
const currentMapType = ref<MapType>("vector");

// 🌍 UI Navigation Items
const leftItems = ref([
  { label: "Drawing Participation", color: "black", to: "/about/" },
  { label: "Гуртомá", color: "black", to: "/about/" },
]);

const rightItems = ref([
  {
    icon: computed(() =>
      currentMapType.value === "vector"
        ? "i-heroicons:map"
        : "i-heroicons:globe-americas-20-solid"
    ),
    onClick: () => {
      currentMapType.value = currentMapType.value === "vector" ? "satellite" : "vector";
      setMapType(currentMapType.value);
    },
  },
]);

// 🗺 Feature Store & GeoJSON Processor
const { featuresByCategory } = useAllFeatureStore();
const geoJson = new GeoJSON();

// 🌍 Reactive State
const filterTime = useState<{start: Date, end: Date}>("isFilterTime", () => ({ start: new Date(), end: new Date() }));

// 📌 Function to Convert Features into OpenLayers GeoJSON Format
const getGeoJsonFeature = (featureKey: string) => {
  let features = featuresByCategory[featureKey] ?? [];
  if (filters["Comments"]) {
    features = features.filter((feat: Feature) => feat.comment.length > 0);
  }
  if (filterTime.value) { 
    features = features.filter((feat: Feature) => {
      const featureCurrentTime = new Date(feat.timestamp as string);
      return featureCurrentTime >= filterTime.value.start && featureCurrentTime <= filterTime.value.end
    });
  }
  return geoJson.readFeatures({
    type: "FeatureCollection",
    features: features.map(({ type, coordinates }) => ({
      type: "Feature",
      geometry: { type, coordinates },
    })),
  });
};

// 🔥 Computed Features for Each Category
const features = computed(() =>
  Object.fromEntries(
    Object.keys(featuresByCategory).map((key) => [key, getGeoJsonFeature(key)])
  )
);


// 🎯 Handle Sidebar Updates (Selection + Layer Settings)
const handleUpdateSelection = (key: string, settings: object) => {
  layerSettings[key] = { ...layerSettings[key], ...settings};
};

// 🎯 Handle Comment Filter Toggle
const handleUpdateFilter = (key: string) => {
  filters[key] = !filters[key]
};

const handleUpdateFilterTime = (timeRange: {start: Date, end: Date}) => { 
  filterTime.value = timeRange
}
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
  <!-- 📌 HEADER -->
  <GeneralizedHeader
    class="z-20"
    :left-items="leftItems"
    :right-items="rightItems"
    logo-src="/restart-logo-icon.svg"
    logo-alt="Restart Agency Logo"
    logo-link="https://www.restartfuture.org/"
  />

  <!-- 📌 SIDEBAR -->
  <LayerSideBar
   :ranges="ranges"
   :layerSettings="layerSettings"
   :filters="filters"
   :categories="categories"
   @update-selection="handleUpdateSelection"
   @update-filter="handleUpdateFilter"
   @update-filter-time="handleUpdateFilterTime" />

  <!-- 📌 MAP & LAYERS -->
  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
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
  </GeneralizedBackgroundMap>
</template>