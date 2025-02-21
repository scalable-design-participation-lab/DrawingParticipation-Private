<script setup lang="ts"> 
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import Interpolate from "@base/components/GeoSpatialLayer/Interpolate/Interpolate.vue";
const bbox = [-180, -90, 180, 90]
const points: { coordinates: [number, number]; value: number }[] = [
  { coordinates: [0, 0], value: Math.random() * 100 },
  { coordinates: [0, 45], value: Math.random() * 100 },
  { coordinates: [0, 90], value: Math.random() * 100 },
  { coordinates: [45, 0], value: Math.random() * 100 },
  { coordinates: [45, 45], value: Math.random() * 100 },
  { coordinates: [45, 90], value: Math.random() * 100 },
  { coordinates: [90, 0], value: Math.random() * 100 },
  { coordinates: [90, 45], value: Math.random() * 100 },
  { coordinates: [90, 90], value: Math.random() * 100 },
];
</script>


<template> 
<GeneralizedBackgroundMap ref="baseMap" :min-zoom="0">
    <template #layers> 
        <Interpolate 
        :points="points" 
        :bbox="bbox"
        :property="'solRad'"
        :gridType="'points'"
        :units="'miles'"
        :visible="true"
        :zIndex="1" />
    </template>
</GeneralizedBackgroundMap>
</template>