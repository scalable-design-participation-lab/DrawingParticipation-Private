<script setup lang="ts"> 
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import Interpolate from "@base/components/GeoSpatialLayer/Interpolate/Interpolate.vue";
import * as turf from "@turf/turf"
const bbox = [-180, -90, 180, 90]
const points: [number, number][] = [
  [0,0],
  [0, 45],
  [0, 90],
  [45, 0],
  [45, 45],
  [45, 90],
  [90, 0],
  [90, 45],
  [90, 90]
]
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