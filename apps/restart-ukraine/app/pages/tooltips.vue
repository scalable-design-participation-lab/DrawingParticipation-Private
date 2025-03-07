<script setup lang="ts">
import { transform } from 'ol/proj'
import {ref, onMounted } from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import { click, pointerMove } from 'ol/events/condition'
import ToolTips from '@base/components/InteractiveLayer/ToolTips.vue'

// References and reactive state
// Define a ref to hold the reference to the child component
const mapRef = ref(null)

// Use a computed prop to access the exposed `mapInstance` from the child component
const mapInstance = ref(null)
onMounted(() => {
  nextTick(() => {
    if (mapRef.value) {
      // Access the exposed map instance from child component
      mapInstance.value = mapRef.value.mapInstance
    }
  })
})

</script>

<template>
  <GeneralizedBackgroundMap ref="mapRef" :min-zoom="0">
    <template #layers> 
    <ToolTips :mapInstance="mapInstance"/> 
    </template>
  </GeneralizedBackgroundMap>
 
</template>