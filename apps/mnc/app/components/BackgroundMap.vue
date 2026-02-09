<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
  >
    <template #layers>
      <ol-layer-vector>
        <ol-source-vector>
          <DrawingLayer
            :projection="projection"
            :is-map-page="isMapPage"
            :show-delete-button="!isMapPage"
          />
        </ol-source-vector>
      </ol-layer-vector>
    </template>

    
  </GeneralizedBackgroundMap>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'nuxt/app'


const route = useRoute()

const projection = ref('EPSG:3857')

const isMapPage = computed(() => route.name === 'result')

const baseMap = ref(null)


const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'
</script>
