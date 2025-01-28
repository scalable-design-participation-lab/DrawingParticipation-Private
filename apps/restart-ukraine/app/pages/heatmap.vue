<script setup lang="ts">
import { computed } from "vue";
import { useAllFeatureStore } from "../../../../base/app/stores/all-features";
import GeoJSON from "ol/format/GeoJSON";
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import HeatMap from "@base/components/GeoSpatialLayer/HeatMap.vue";
import type { Feature, MapType } from "@base/stores/types/store";
import { useMapStore } from "@base/stores/map";

// Map store
const mapStore = useMapStore()
const { setMapType } = mapStore
const currentMapType = ref('vector')

const leftItems = ref([
  {
    label: 'Drawing Participation',
    color: 'black',
    to: '/about/',
  },
  {
    label: 'Гуртомá',
    color: 'black',
    to: '/about/',
  },
])

const rightItems = ref([
  {
    icon: computed(() =>
      currentMapType.value === 'vector'
        ? 'i-heroicons:map'
        : 'i-heroicons:globe-americas-20-solid',
    ),
    onClick: () => {
      currentMapType.value
        = currentMapType.value === 'vector' ? 'satellite' : 'vector' 
      setMapType(currentMapType.value as MapType)
    },
  },
])
const selectedOptions = useState<string[]>("selectedOptions", () => []); // Updated to support multiple categories
const geoJson = new GeoJSON();
const isFilterComments = useState('isFilterComments', () => false)

const { allFeatures, featuresByCategory } = useAllFeatureStore(); 


const geoJsonFeatures = computed(() => {
  // Filter features based on selected categories
  let filteredFeatures = selectedOptions.value.length !== 0
    ? selectedOptions.value.flatMap((category) => featuresByCategory[category] || [])
    : allFeatures;

  if (isFilterComments.value) filteredFeatures = filteredFeatures.filter((feat: Feature) => feat.comment.length !== 0)

  const features = filteredFeatures.map((feature: { type: any; coordinates: any }) => ({
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

function handleUpdateSelection(data: string) {
  if (selectedOptions.value.includes(data)) {
    selectedOptions.value = selectedOptions.value.filter(item=> item !== data);
  } else {
    selectedOptions.value.push(data)
  }
}


function handleUpdateFilter() { 
  isFilterComments.value = !isFilterComments.value
}

</script>

<template>
 <GeneralizedHeader
        class="z-20"
        :left-items="leftItems"
        :right-items="rightItems"
        logo-src="/restart-logo-icon.svg"
        logo-alt="Restart Agency Logo"
        logo-link="https://www.restartfuture.org/"
      />
  <HeatMapSideBar @update-selection="handleUpdateSelection" @update-filter="handleUpdateFilter" />

  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
      <HeatMap
      :features="geoJsonFeatures"/>
    </template>
  </GeneralizedBackgroundMap>
</template>
