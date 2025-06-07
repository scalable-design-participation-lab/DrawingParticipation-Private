<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps({
  mapInstance: Object,
  center: Array,
  zoom: Number,
})

function recenterMap() {
  if (props.mapInstance) {
    const unwrap = unref(props.mapInstance)
    const view = unwrap.map.getView()
    view.animate({
      center: props.center,
      zoom: props.zoom,
      duration: 500,
    })
  }
}
</script>

<template>
  <button @click="recenterMap" class="recenter-button">Center</button>
</template>

<style scoped>
.recenter-button {
  background: black;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1600;
  position: absolute !important;
  top: 60% !important;
  transform: translateY(-50%) !important;
  left: 20px !important;
  bottom: unset !important;
  background: solid !important;
  z-index: 1500 !important;
}

.recenter-button:hover {
  background: black;
  color: white;
}
</style>
