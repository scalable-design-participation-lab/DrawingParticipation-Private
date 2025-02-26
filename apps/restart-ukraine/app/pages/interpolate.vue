<script setup lang="ts"> 
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import Interpolate from "@base/components/GeoSpatialLayer/Interpolate/Interpolate.vue";
import InterpolateController from "@base/components/GeoSpatialLayer/Interpolate/InterpolateController.vue";
import * as turf from "@turf/turf"
const bbox = [0, 0, 90, 90]
const points = [
  turf.point([0, 45], { value: Math.random() * 100 }),
  turf.point([45, 0], { value: Math.random() * 100 }),
];
const features = turf.featureCollection(points)
const visible = ref(true);
const zIndex = ref(1);
const gridPoints = ref(100);
const gridType = ref<'points' | 'hex' | 'square' | 'triangle'>('points');
const units = ref<'miles' | 'kilometers' | 'radians' | 'degrees'>('miles');
</script>


<template> 
<InterpolateController 
    v-model:visible="visible" 
    v-model:zIndex="zIndex" 
    v-model:gridPoints="gridPoints" 
    v-model:gridType="gridType" 
    v-model:units="units"/>
<GeneralizedBackgroundMap ref="baseMap" :min-zoom="0">
    <template #layers> 
        <Interpolate 
        :features="features" 
        :z-index="zIndex"
        :bbox="bbox"
        :property="'value'"
        :visible="visible"
        :gridPoints="gridPoints"
        :gridType="gridType"
        :units="units"
         />
    </template>
</GeneralizedBackgroundMap>
</template>