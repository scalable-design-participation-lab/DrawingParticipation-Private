<script setup lang="ts">
import Tesselation, { type TesselationType } from "@base/components/GeoSpatialLayer/Tesselation/Tesselation.vue";
import TesselationController from "@base/components/GeoSpatialLayer/Tesselation/TesselationController.vue";
import { useAllFeatureStore } from "@base/stores/all-features";
import { toLonLat } from "ol/proj";

const {featuresByType, featuresByCategory} = useAllFeatureStore();
const testData = [
  [28.5457047915257,49.25235967695851], 
  [28.5427047915257,49.25535967695851],
  [28.54277047915257,49.2535967695851],
  [28.547047915257,49.255967695851],
]
const coordinates = computed(() => {
  const feat = featuresByType.Point
  let coord = feat.map(feature => toLonLat(feature.coordinates as [number, number])) as [number, number][];
  return coord 
  return testData
})

const visible = ref<boolean>(true);
const zIndex = ref<number>(0);
const type = ref<TesselationType>('voronoi');  
const opacity = ref<number>(0.5);
const opacityMode = ref<'larger' | 'smaller'>('larger');
const clusterCount = ref<number>(1);
const primaryColor = ref<string>('#ff0000'); 
const secondaryColor = ref<string>('#800080'); 
const area = ref<boolean>(true)
</script>

<template>
  <TesselationController 
  v-model:opacity="opacity"
  v-model:visible="visible"
  v-model:zIndex="zIndex"
  v-model:type="type"
  v-model:opacity-mode="opacityMode" 
  v-model:cluster-count="clusterCount"
  v-model:primaryColor="primaryColor"
  v-model:secondaryColor="secondaryColor"
  v-model:area="area"
  />
  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
        <Tesselation 
        :type="type"
        :opacity="opacity"
        :opacityMode="opacityMode"
        :coordinates="coordinates"
        :visible="visible"
        :z-index="zIndex"
        :clusterCount="clusterCount"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :area="area"
        />
    </template>
  </GeneralizedBackgroundMap>
</template>