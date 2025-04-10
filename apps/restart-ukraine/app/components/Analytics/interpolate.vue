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

const boundingBox = [28.456993,49.122306,28.617418,49.547638];

const isInsideBox = ([lng, lat]) =>
  lng >= boundingBox[0] &&
  lat >= boundingBox[1] &&
  lng <= boundingBox[2] &&
  lat <= boundingBox[3];

const validPoints = allFeaturesPoints.filter(t =>{
  const p = toLonLat(t.coordinates as [number, number])
  return Array.isArray(p) &&
  p.length === 2 &&
  typeof p[0] === 'number' &&
  typeof p[1] === 'number' &&
   isInsideBox(p as [number, number])
}
);

const filteredPoints = validPoints.filter((point, index, self) =>
  index === self.findIndex(p =>
    p.coordinates[0] === point.coordinates[0] &&
    p.coordinates[1] === point.coordinates[1]
  )
);

const points = filteredPoints.map((feature) => {
  const lonLat = turf.point(toLonLat(feature.coordinates as [number, number]), { value: Math.random() * 100 });
  return lonLat;
});

const features = turf.featureCollection(points)
const bbox = turf.bbox(features);

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
        :bbox="bbox"
        :visible="visible"
        :gridSize="gridSize"
        :gridType="gridType"
        :units="units"
         />
</template>