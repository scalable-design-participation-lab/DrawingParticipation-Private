<script setup lang="ts"> 
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import Interpolate from "@base/components/GeoSpatialLayer/Interpolate.vue";
import * as turf from "@turf/turf"
var points = turf.randomPoint(100, { bbox: [50, 30, 70, 50] });
turf.featureEach(points, function (point) {
  point.properties.solRad = Math.random() * 50;
});
</script>


<template> 
<GeneralizedBackgroundMap ref="baseMap" :min-zoom="0">
    <template #layers> 
        <Interpolate :points="points" property="solRad" :gridType="'points'" :units="'miles'" :visible="true" :zIndex="1" />
    </template>
</GeneralizedBackgroundMap>
</template>