<script setup lang="ts"> 
import Interpolate from "@base/components/GeoSpatialLayer/Interpolate/Interpolate.vue";
import InterpolateController from "@base/components/GeoSpatialLayer/Interpolate/InterpolateController.vue";
import { useAllFeatureStore } from "@base/stores/all-features";
import * as turf from "@turf/turf"
import { toLonLat } from "ol/proj";

const visible = ref(true);
const zIndex = ref(1);
const gridSize = ref(0.4);
const gridType = ref<'point' | 'hex' | 'square' | 'triangle'>('square');
const units = ref<'miles' | 'kilometers' | 'radians' | 'degrees'>('kilometers');


const allFeaturesStore = useAllFeatureStore()

const allFeaturesPoints = allFeaturesStore.featuresByType.Point

const boundingBox = [28.462271, 49.215576, 28.570271, 49.265576];

const points = allFeaturesPoints.map((feature) => {
  const lonLat = turf.point(toLonLat(feature.coordinates as [number, number]), { value: Math.random() * 100 });
  return lonLat;
});

const features = turf.featureCollection(points)

</script>


<template> 
<!-- <InterpolateController 
    v-model:visible="visible" 
    v-model:zIndex="zIndex" 
    v-model:gridSize="gridSize" 
    v-model:gridType="gridType" 
    v-model:units="units"/> -->
        <Interpolate 
        :features="features" 
        :z-index="zIndex"
        :property="'value'"
        :bbox="boundingBox"
        :visible="visible"
        :gridSize="gridSize"
        :gridType="gridType"
        :units="units"
         />
</template>