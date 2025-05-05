<script setup lang="ts">
const visible = defineModel<boolean>('visible', { required: true })
const zIndex = defineModel<number>('zIndex', { type: Number, required: true })
const gridSize = defineModel<number>('gridSize', { type: Number })
const gridType = defineModel<string>('gridType', { required: true })
const units = defineModel<string>('units', { required: true })
</script>

<template>
  <UCard class="w-80 z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <div class="text-lg font-semibold mb-4">
      Interpolate Settings
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
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Z-Index</span>
      <UInput
        id="z-index"
        v-model.number="zIndex"
        type="number"
        class="w-20 px-1"
      />
    </div>
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Grid Size</span>
      <UInput
        id="grid-points"
        v-model.number="gridSize"
        type="number"
        class="w-20 px-1"
        min="0.2"
        max="1"
        step="0.2"
      />
    </div>

    <span class="block py-2 capitalize text-black font-semibold dark:text-white">Grid Type</span>
    <div class="grid grid-cols-2 gap-2 mt-2">
      <label>
        <input v-model="gridType" type="radio" value="point"> Point
      </label>
      <label>
        <input v-model="gridType" type="radio" value="hex"> Hexagon
      </label>
      <label>
        <input v-model="gridType" type="radio" value="square"> Square
      </label>
      <label>
        <input v-model="gridType" type="radio" value="triangle"> Triangle
      </label>
    </div>
    <span class="block py-2 capitalize text-black font-semibold dark:text-white">Unit Type</span>
    <div class="grid grid-cols-2 gap-2 mt-2">
      <label>
        <input v-model="units" type="radio" value="miles"> Miles
      </label>
      <label>
        <input v-model="units" type="radio" value="kilometers"> Kilometers
      </label>
      <label>
        <input v-model="units" type="radio" value="radians"> Radians
      </label>
      <label>
        <input v-model="units" type="radio" value="degrees"> Degrees
      </label>
    </div>
  </UCard>
</template>
