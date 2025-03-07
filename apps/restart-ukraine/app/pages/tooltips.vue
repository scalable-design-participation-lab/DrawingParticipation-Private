<script setup lang="ts">
import { transform } from 'ol/proj'
import {ref, onMounted } from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import { click, pointerMove } from 'ol/events/condition'
import ToolTips from '@base/components/InteractiveLayer/ToolTips.vue'
import { useDataStore } from '@base/stores/data'

// References and reactive state
// Define a ref to hold the reference to the child component
const mapRef = ref(null)

// Use a computed prop to access the exposed `mapInstance` from the child component
const mapInstance = computed(() => {
  return mapRef.value ? mapRef.value.mapInstance : null
}) 
const dataStore = useDataStore()
await dataStore.fetchData('https://raw.githubusercontent.com/openlayers/openlayers/refs/heads/main/examples/data/geojson/polygon-samples.geojson')
const data = dataStore.data 


</script>

<template>
  <GeneralizedBackgroundMap ref="mapRef" :min-zoom="0">
    <template #layers> 
    <ToolTips :mapInstance="mapInstance" :data="data"/> 
    </template>
  </GeneralizedBackgroundMap>
 
</template>