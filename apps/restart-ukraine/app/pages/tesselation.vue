<script setup lang="ts">
import Tesselation, { type TesselationType } from "@base/components/GeoSpatialLayer/Tesselation/Tesselation.vue";
import TesselationController from "@base/components/GeoSpatialLayer/Tesselation/TesselationController.vue";
import { useAllFeatureStore } from "@base/stores/all-features";
import { toLonLat } from "ol/proj";

const {featuresByType} = useAllFeatureStore();
const coordinates = computed(() => {
    return featuresByType.Point.map(feature => toLonLat(feature.coordinates as [number, number])) as [number, number][];
})
const visible = ref<boolean>(true);
const zIndex = ref<number>(0);
const type = ref<TesselationType>('voronoi');  
const opacity = ref<number>(0.5);
const opacityMode = ref<'larger' | 'smaller'>('larger');

</script>

<template>
  <TesselationController v-model:opacity="opacity" v-model:visible="visible" v-model:zIndex="zIndex"
  v-model:type="type" v-model:opacity-mode="opacityMode"/>
  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
        <!-- <Tesselation 
        :type="type"
        :opacity="opacity"
        :coordinates="coordinates" :visible="visible" :z-index="zIndex"
        /> -->
        <Tesselation 
        :type="type"
        :opacity="opacity"
        :opacityMode="opacityMode"
        :coordinates="coordinates" :visible="visible" :z-index="zIndex"
        :colorFunction="(opacity) => `rgba(255, 0, 0, ${opacity})`"
        />
    </template>
  </GeneralizedBackgroundMap>
</template>