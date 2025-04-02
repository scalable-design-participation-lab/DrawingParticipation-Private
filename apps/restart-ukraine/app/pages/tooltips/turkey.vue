<script setup lang="ts">
import {ref} from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import ToolTips from '@base/components/Tools/ToolTips.vue'
import { useDataStore } from '@base/stores/data'

// References and reactive state
// Define a ref to hold the reference to the child component
const mapRef = ref(null)

// Use a computed prop to access the exposed `mapInstance` from the child component
const mapInstance = computed(() => {
  return mapRef.value ? mapRef.value.mapInstance : null
}) 
const dataStore = useDataStore()
await dataStore.fetchData('https://dataworks.calderdale.gov.uk/download/epwyy/egm/schools-list.geojson')

const data = dataStore.data 
const pointStyle = {
    radius: 6,
    fill: 'rgba(0, 100, 255, 0.8)',
    stroke: {
      color: 'white',
      width: 2,
    },
  }
const features = computed(() => {
  const geoJson = new GeoJSON()
  return geoJson.readFeatures(data, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
})
</script>

<template>
  <GeneralizedBackgroundMap ref="mapRef" :min-zoom="0">
    <template #layers> 
        <!-- Vector Layer with Interactions -->
        <ol-vector-layer>
          <ol-source-vector
            :features="features"
            :format="new GeoJSON()"
          />
          <!-- Default Style -->
          <ol-style>
            <ol-style-fill color="rgba(0, 0, 0, 0)" />
            <ol-style-stroke color="green" :width="10" />
            <ol-style-circle :radius="pointStyle.radius">
              <ol-style-fill :color="pointStyle.fill" />
              <ol-style-stroke
                :color="pointStyle.stroke.color"
                :width="pointStyle.stroke.width"
              />
            </ol-style-circle>
          </ol-style>
        </ol-vector-layer>
    </template>
    <template #overlays> 
        <ToolTips :mapInstance="mapInstance" />
    </template>
  </GeneralizedBackgroundMap>
 
</template>