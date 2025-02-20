<script setup lang="ts">
import Voronoi from "@base/components/GeoSpatialLayer/Voronoi/Voronoi.vue";
import VoronoiController from "@base/components/GeoSpatialLayer/Voronoi/VoronoiController.vue";
import { useAllFeatureStore } from "@base/stores/all-features";
import { toLonLat } from "ol/proj";

const {featuresByType} = useAllFeatureStore();
const coordinates = computed(() => {
    return featuresByType.Point.map(feature => toLonLat(feature.coordinates as [number, number])) as [number, number][];
})
const visible = ref<boolean>(true);
const zIndex = ref<number>(0);

</script>

<template>
  <VoronoiController v-model:visible="visible" v-model:zIndex="zIndex" />
  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
        <Voronoi 
        :coordinates="coordinates" :visible="visible" :z-index="zIndex" />
    </template>
  </GeneralizedBackgroundMap>
</template>