<script setup lang="ts">
import { ref, computed } from "vue";
import { useAllFeatureStore } from "../stores/all-features";
import GeoJSON from "ol/format/GeoJSON";
import type { Category} from "../stores/types/store";

const { allFeatures, featuresByCategory } = useAllFeatureStore(); 
const center = ref([3172858.2941718884, 6317486.347640147]);
const projection = ref("EPSG:3857");
const zoom = ref(5);
const blur = ref(20);
const radius = ref(20);
const geoJson = new GeoJSON();
const filterOption = ref<Category | string>("")
const filterOptions = computed(() => Object.keys(featuresByCategory));
const geoJsonFeatures = computed(() => {
  // Filter features based on the selected filter option 
  const filteredFeatures = filterOption.value !== "" ? featuresByCategory[filterOption.value] : allFeatures

  const features = filteredFeatures.map((feature) => ({
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

function featuresloadstart() {
  console.log("features load start");
}

function featuresloaderror() {
  console.log("features load error");
}

function featuresloadend() {
  console.log("features load end");
}
</script>

  

<template>
    <form class="absolute z-50 bg-white shadow-lg p-4 text-black">
      <fieldset>
        <label for="blur">Blur</label>
        <input
          type="range"
          id="blur"
          min="0"
          max="100"
          step="1"
          v-model.number="blur"
        />
        <span class="description">{{ blur }}</span>
      </fieldset>
      <fieldset>
        <label for="radius">Radius</label>
        <input
          type="range"
          id="radius"
          min="0"
          max="100"
          step="1"
          v-model.number="radius"
        />
        <span class="description">{{ radius }}</span>
      </fieldset>
      <fieldset>
        <legend>Filter Options</legend>
        <div v-for="option in filterOptions" :key="option" class="mb-2 flex items-center space-x-2">
          <input
            type="radio"
            :id="`filter-${option}`"
            :value="option"
            v-model="filterOption"
          />
          <label :for="`filter-${option}`"> {{ option }}</label>
        </div>
    </fieldset>
    </form>
  
    <ol-map
      ref="map"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      style="height: 100vh"
    >
      <ol-view
        ref="view"
        :center="center"
        :zoom="zoom"
        :projection="projection"
      />
  
      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>
  
      <ol-heatmap-layer
        title="heatmap"
        :blur="blur"
        :radius="radius"
        :zIndex="1"
      >
        <ol-source-vector
        :features="geoJsonFeatures"
        :format="geoJson"
        @featuresloadstart="featuresloadstart"
        @featuresloadend="featuresloadend"
        @featuresloaderror="featuresloaderror"
        >
        </ol-source-vector>
      </ol-heatmap-layer>
    </ol-map>
  </template>
  
