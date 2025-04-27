<script setup>
import { ref } from 'vue'

const center = ref([40, 40])
const projection = ref('EPSG:4326')
const zoom = ref(8)

const drawEnable = ref(true)
const drawType = ref('Polygon')

function drawstart(event) {
  console.log(event)
}

function drawend(event) {
  console.log(event)
}
</script>

<template>
  <div class="relative w-full h-screen">
    <ol-map
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      class="w-full h-screen"
    >
      <ol-view
        ref="view"
        :center="center"
        :zoom="zoom"
        :projection="projection"
      />

      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <ol-vector-layer>
        <ol-source-vector :projection="projection">
          <ol-interaction-draw
            v-if="drawEnable"
            :type="drawType"
            @drawend="drawend"
            @drawstart="drawstart"
          >
            <ol-style>
              <ol-style-stroke color="blue" :width="2" />
              <ol-style-fill color="rgba(255, 255, 0, 0.4)" />
              <ol-style-circle :radius="5">
                <ol-style-fill color="#00dd11" />
                <ol-style-stroke color="blue" :width="2" />
              </ol-style-circle>
            </ol-style>
          </ol-interaction-draw>
        </ol-source-vector>

        <ol-style>
          <ol-style-stroke color="red" :width="2" />
          <ol-style-fill color="rgba(255,255,255,0.1)" />
          <ol-style-circle :radius="7">
            <ol-style-fill color="red" />
          </ol-style-circle>
        </ol-style>
      </ol-vector-layer>
    </ol-map>

    <div class="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md z-10 overflow-auto max-h-[80vh]">
      <UForm>
        <UFormGroup label="Draw Mode Enabled">
          <UCheckbox v-model="drawEnable" />
        </UFormGroup>
        <UFormGroup label="Geometry Type">
          <USelect
            v-model="drawType"
            :options="[
              { label: 'Point', value: 'Point' },
              { label: 'LineString', value: 'LineString' },
              { label: 'Polygon', value: 'Polygon' },
              { label: 'Circle', value: 'Circle' },
            ]"
          />
        </UFormGroup>
      </UForm>
    </div>
  </div>
</template>
