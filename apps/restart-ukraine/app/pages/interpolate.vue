<script setup lang="ts"> 
import GeneralizedBackgroundMap from "@base/components/GeneralizedBackgroundMap.vue";
import * as turf from "@turf/turf"
import GeoJSON from "ol/format/GeoJSON";
var points = turf.randomPoint(30, { bbox: [50, 30, 70, 50] });

// add a random property to each point
turf.featureEach(points, function (point) {
  point.properties.solRad = Math.random() * 50;
});
var options = { gridType: "points", property: "solRad", units: "miles" };
var grid = turf.interpolate(points, 100, options);


// convert to geojson
const geoJson = new GeoJSON();
const gridFeatures = geoJson.readFeatures(grid, {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
})
</script>


<template> 
<GeneralizedBackgroundMap ref="baseMap" :min-zoom="0">
    <template #layers> 
        <ol-vector-layer id="layerId" :z-index="1" :visible="true" >
            <ol-source-vector :features="gridFeatures" />
        </ol-vector-layer>
    </template>
</GeneralizedBackgroundMap>
</template>