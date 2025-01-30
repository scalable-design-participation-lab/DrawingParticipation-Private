<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useAllFeatureStore } from "../../../../base/app/stores/all-features";
import GeoJSON from "ol/format/GeoJSON";
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import HeatMap from "@base/components/GeoSpatialLayer/HeatMap.vue";
import type { Feature, MapType } from "@base/stores/types/store";
import { useMapStore } from "@base/stores/map";

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
const selectedOptions = useState<string[]>("selectedOptions", () => []);
const isFilterComments = useState<boolean>("isFilterComments", () => false);

// 📌 Function to Convert Features into OpenLayers GeoJSON Format
const getGeoJsonFeature = (key: string) => {
  let features = featuresByCategory[key] ?? [];
  if (isFilterComments.value) {
    features = features.filter((feat: Feature) => feat.comment.length > 0);
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

// 🎛 Layer Settings (Per Category)
const layerSettings = reactive<{ [key: string]: any }>({});

// 🎯 Initialize Default Layer Settings when Features Change
watch(
  () => features.value,
  (newFeatures) => {
    Object.keys(newFeatures).forEach((key) => {
      if (!layerSettings[key]) {
        layerSettings[key] = {
          weight: () => 1,
          blur: 20,
          radius: 20,
          opacity: 1,
          gradient: ["#00f", "#f00"],
          visible: false,
        };
      }
    });
  },
  { immediate: true }
);

// 🎯 Handle Sidebar Updates (Selection + Layer Settings)
const handleUpdateSelection = (key: string, settings: object) => {
  layerSettings[key] = { ...layerSettings[key], ...settings};
};

// 🎯 Handle Comment Filter Toggle
const handleUpdateFilter = () => {
  isFilterComments.value = !isFilterComments.value;
};
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
  <HeatMapSideBar @update-selection="handleUpdateSelection" @update-filter="handleUpdateFilter" />

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
      />
    </template>
  </GeneralizedBackgroundMap>
</template>