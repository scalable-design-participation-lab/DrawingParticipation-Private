<script setup lang="ts">
import Voronoi from "@base/components/GeoSpatialLayer/Voronoi/Voronoi.vue";
import { useAllFeatureStore } from "@base/stores/all-features";
import { toLonLat } from "ol/proj";

const {featuresByType} = useAllFeatureStore();
const coordinates = computed(() => {
    return featuresByType.Point.map(feature => toLonLat(feature.coordinates as [number, number])) as [number, number][];
})

</script>

<template>
  <GeneralizedBackgroundMap ref="baseMap" :min-zoom="0">
    <template #layers>
        <Voronoi :coordinates="coordinates" :visible="true" />
    </template>
  </GeneralizedBackgroundMap>
</template>