<script setup lang="ts">
import Tesselation from "@base/components/GeoSpatialLayer/Tesselation/Tesselation.vue";
import TesselationController from "@base/components/GeoSpatialLayer/Tesselation/TesselationController.vue";
import { useAllFeatureStore } from "@base/stores/all-features";
import { toLonLat } from "ol/proj";

const {featuresByType} = useAllFeatureStore();
const coordinates = computed(() => {
    return featuresByType.Point.map(feature => toLonLat(feature.coordinates as [number, number])) as [number, number][];
})
const visible = ref<boolean>(true);
const zIndex = ref<number>(0);
const type = ref<string>('voronoi');  

</script>

<template>
  <TesselationController v-model:visible="visible" v-model:zIndex="zIndex"
  v-model:type="type" />
  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
        <Tesselation 
        :type="type"
        :coordinates="coordinates" :visible="visible" :z-index="zIndex" />
    </template>
  </GeneralizedBackgroundMap>
</template>