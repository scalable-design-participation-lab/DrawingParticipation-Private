<script setup lang="ts">
const visible = defineModel<boolean>('visible', { type: Boolean, required: true })
const zIndex = defineModel<number>('zIndex', { type: Number, required: true })
const radius = defineModel<number>('radius', { type: Number, required: true })
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
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Z-Index</span>
      <UInput
        id="z-index"
        v-model.number="zIndex"
        type="number"
        class="w-20 px-1 "
      />
    </div>
    <div v-if="radius" class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Radius</span>
      <UInput
        v-model.number="radius"
        type="number"
        class="w-20 px-1 "
      />
    </div>
  </UCard>
</template>
