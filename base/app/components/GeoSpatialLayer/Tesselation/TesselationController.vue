<script setup lang="ts">
const visible = defineModel('visible', { type: Boolean, required: true })
const zIndex = defineModel('zIndex', { type: Number, required: true })
const type = defineModel('type', { type: String, required: true })
const opacity = defineModel('opacity', { type: Number, required: true })
</script>

<template>
  <UCard class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
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

    <!-- Z Index Input -->
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">z-index</span>
      <UInput
        id="z-index"
        v-model.number="zIndex"
        type="number"
        class="w-20 px-1 "
      />
    </div>
    <!--  Opacity Input -->
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Opacity</span>
      <UInput
        id="opacity"
        v-model.number="opacity"
        min="0"
        step="0.1"
        max="1"
        type="number"
        class="w-20 px-1 "
      />
    </div>
    <!-- Type Selection (Radio Buttons) -->
    <span class="block py-2 capitalize text-black font-semibold dark:text-white">Type</span>
    <div class="flex space-x-4 mt-2">
      <label>
        <input v-model="type" type="radio" value="voronoi"> Voronoi
      </label>
      <label>
        <input v-model="type" type="radio" value="tin"> TIN
      </label>
    </div>
  </UCard>
</template>
