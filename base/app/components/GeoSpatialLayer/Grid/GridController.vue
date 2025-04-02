<script setup lang="ts">
import type { GridType } from './Grid.vue'

const visible = defineModel<boolean>('visible', { required: true })
const baseHue = defineModel<number>('baseHue', { type: Number, required: true })
const cellSide = defineModel<number>('cellSide', { type: Number, required: true })
const shape = defineModel<GridType>('shape', { required: true })
const width = defineModel<number>('width', { type: Number, required: true })
</script>

<template>
  <UCard class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <div class="text-lg font-semibold mb-4">
      Grid Settings
    </div>
    <!-- Visible -->
    <div class="flex justify-between my-2">
      <span class="my-1 capitalize text-black font-semibold dark:text-white"> Visibility </span>
      <UToggle
        v-model="visible"
        class="my-1"
        color="green"
        size="lg"
        on-icon="i-heroicons-check-20-solid"
        off-icon="i-heroicons-x-mark-20-solid"
      />
    </div>
    <!-- Width Slider -->
    <label class="block text-sm font-medium">Line Width: {{ width }}</label>
    <input
      v-model.number="width"
      type="range" min="0.1" max="5"
      step="0.1"
      class="w-full my-2"
    >

    <!-- Base Hue Slider -->
    <label class="block text-sm font-medium">Base Hue: {{ baseHue }}</label>
    <input
      v-model.number="baseHue"
      type="range" min="0" max="360"
      step="1"
      class="w-full my-2"
    >

    <!-- Cell side Slider -->
    <label class="block text-sm font-medium">Cell side: {{ cellSide }}</label>
    <input
      v-model.number="cellSide"
      type="range" min="0.2" max="1"
      step="0.1"
      class="w-full my-2"
    >

    <!-- Shape Selection (Radio Buttons) -->
    <div class="mt-4">
      <label class="block text-sm font-medium">Shape</label>
      <div class="flex space-x-4 mt-2">
        <label>
          <input v-model="shape" type="radio" value="Hexagon"> Hexagon
        </label>
        <label>
          <input v-model="shape" type="radio" value="Square"> Square
        </label>
        <label>
          <input v-model="shape" type="radio" value="Triangle"> Triangle
        </label>
      </div>
    </div>
  </UCard>
</template>
