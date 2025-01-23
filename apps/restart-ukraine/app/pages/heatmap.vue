<script setup lang="ts">
import { computed } from "vue";
import { useAllFeatureStore } from "../stores/all-features";
import GeoJSON from "ol/format/GeoJSON";
import type { Category} from "../stores/types/store";
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import HeatMap from "@base/components/GeoSpatialLayer/HeatMap.vue";

const blur = useState("blur", () => 20);
const radius = useState("radius", () => 20);
const filterOption = useState<Category | string>("filterOption", () => "");
const geoJson = new GeoJSON();

const { allFeatures, featuresByCategory } = useAllFeatureStore(); 
const filterOptions = computed(() => Object.keys(featuresByCategory));
const geoJsonFeatures = computed(() => {
  // Filter features based on the selected filter option 
  const filteredFeatures = filterOption.value !== "" ? featuresByCategory[filterOption.value] : allFeatures

  const features = filteredFeatures.map((feature: { type: any; coordinates: any; }) => ({
    type: "Feature",
    geometry: {
      type: feature.type, 
      coordinates: feature.coordinates, 
    },
  }));

  const featureCollection = {
    type: "FeatureCollection",
    features,
  };

  // Read the features into OpenLayers GeoJSON format
  return geoJson.readFeatures(featureCollection);
});

</script>

<template>
  <form class="absolute z-50 bg-white shadow-lg p-4 text-black">
    <fieldset>
      <label for="blur">Blur</label>
      <input type="range" id="blur" min="0" max="100" step="1" v-model.number="blur" />
      <span class="description">{{ blur }}</span>
    </fieldset>
    <fieldset>
      <label for="radius">Radius</label>
      <input type="range" id="radius" min="0" max="100" step="1" v-model.number="radius" />
      <span class="description">{{ radius }}</span>
    </fieldset>
    <fieldset>
      <legend>Filter Options</legend>
      <div v-for="option in filterOptions" :key="option" class="mb-2 flex items-center space-x-2">
        <input type="radio" :id="`filter-${option}`" :value="option" v-model="filterOption" />
        <label :for="`filter-${option}`"> {{ option }}</label>
      </div>
    </fieldset>
  </form>

  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
      <HeatMap
      :blur="blur"
      :radius="radius"
      :features="geoJsonFeatures"/>
    </template>
  </GeneralizedBackgroundMap>
</template>
