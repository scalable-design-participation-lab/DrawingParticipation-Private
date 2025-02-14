<script setup lang="ts">
const visible = defineModel<boolean>('visible', { type: Boolean, required: true })
const zIndex = defineModel<number>('zIndex', { type: Number, required: true })
const shapePoints = defineModel<number>('shapePoints', { type: Number, required: true })
const shapeRadius = defineModel<number>('shapeRadius', { type: Number, required: true })
const shapeOpacity = defineModel<number>('shapeOpacity', { type: Number, required: true })
const shapeFillColor = defineModel<string>('shapeFillColor', { type: String, required: true })
</script>

<template>
  <UCard class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <!-- Visibility Toggle -->
    <div class="flex justify-between">
      <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Visible</span>
      <UToggle
        v-model="visible"
        color="green"
        size="lg"
        on-icon="i-heroicons-check-20-solid"
        off-icon="i-heroicons-x-mark-20-solid"
      />
    </div>

    <!-- Z Index Input -->
    <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Z Index</span>
    <UInput
      v-model.number="zIndex"
      type="number"
      class="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
    />

    <!-- Shape Points Input -->
    <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Shape Points</span>
    <UInput
      v-model.number="shapePoints"
      type="number"
      class="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
    />

    <!-- Shape Radius Input -->
    <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Shape Radius</span>
    <UInput
      v-model.number="shapeRadius"
      type="number"
      class="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
    />

    <!-- Shape Opacity Slider -->
    <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Shape Opacity</span>
    <!-- Using a slider for opacity (assuming USlider exists) -->
    <UInput
      v-model.number="shapeOpacity"
      type="range"
      :min="0"
      :max="1"
      :step="0.1"
    />
    <span class="text-sm text-gray-600 dark:text-gray-300 mt-1">Current: {{ shapeOpacity }}</span>

    <!-- Shape Fill Color -->
    <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Shape Fill Color</span>
    <color-picker-block
      v-model="shapeFillColor"
      class="w-full h-10 rounded-lg overflow-hidden"
      @change="shapeFillColor = $event.hex"
    />
  </UCard>
</template>
