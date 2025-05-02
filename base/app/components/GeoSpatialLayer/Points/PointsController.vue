<script setup lang="ts">
const visible = defineModel<boolean>('visible', { type: Boolean, required: true })
const zIndex = defineModel<number>('zIndex', { type: Number, required: true })
const shapePoints = defineModel<number>('shapePoints', { type: Number })
const shapeRadius = defineModel<number>('shapeRadius', { type: Number })
const shapeOpacity = defineModel<number>('shapeOpacity', { type: Number })
const shapeFillColor = defineModel<string>('shapeFillColor', { type: String })
</script>

<template>
  <UCard class="w-80 z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <div class="text-lg font-semibold mb-4">
      Points Settings
    </div>
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
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Z-Index</span>
      <UInput
        id="z-index"
        v-model.number="zIndex"
        type="number"
        class="w-20 px-1 "
      />
    </div>

    <!-- Shape Points Input -->

    <div v-if="shapePoints" class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Points</span>
      <UInput
        v-model.number="shapePoints"
        type="number"
        class="w-20 px-1"
      />
    </div>

    <!-- Shape Radius Input -->

    <div v-if="shapeRadius" class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Radius</span>
      <UInput
        v-model.number="shapeRadius"
        type="number"
        class="w-20 px-1"
      />
    </div>

    <!-- Shape Opacity Slider -->

    <div v-if="shapeOpacity" class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Opacity</span>
      <!-- Using a slider for opacity (assuming USlider exists) -->
      <UInput
        v-model.number="shapeOpacity"
        type="range"
        :min="0"
        :max="1"
        :step="0.1"
      />
    </div>
    <!-- Shape Fill Color -->

    <div v-if="shapeFillColor" class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Color</span>
      <color-picker-block
        v-model="shapeFillColor"
        class="p-2 rounded-lg"
        @change="shapeFillColor = $event.hex"
      />
    </div>
  </UCard>
</template>
