<script setup lang="ts">
import * as turf from '@turf/turf';
import  GeoJSON  from 'ol/format/GeoJSON';
import smileIcon from '@/assets/icons/smile.svg';
import Points from '@base/components/GeoSpatialLayer/Points/Points.vue';
var point = [turf.point([-90.54863, 14.616599])];
var buffered = turf.buffer(point[0], 500, { units: "miles" });

const geoJson = new GeoJSON();
const bufferedFeatures = computed(()=>{
    return geoJson.readFeatures(buffered, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });
})
const pointFeatures = computed(()=> {
    const points = turf.featureCollection(point)
    return geoJson.readFeatures(points, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });
})
</script>
<template>
    <GeneralizedBackgroundMap ref="baseMap" :min-zoom="0"> 
        <template #layers> 
            <Points :features="pointFeatures"
            :visible="true"
            :z-index="1"
           />
            <ol-vector-layer :z-index="0"
            :visible="true"
            >
            <ol-source-vector
            :features="bufferedFeatures"/>
            </ol-vector-layer>
        </template>
    </GeneralizedBackgroundMap>
</template>