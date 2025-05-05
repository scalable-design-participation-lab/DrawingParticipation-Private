<script setup lang="ts">
import type { BufferMode } from './Buffer.vue'

const visible = defineModel<boolean>('visible', { type: Boolean, required: true })
const zIndex = defineModel<number>('zIndex', { type: Number, required: true })
const radius = defineModel<number>('radius', { type: Number, required: true })
const mode = defineModel<BufferMode>('mode', { type: String as PropType<BufferMode>, required: true })
const units = defineModel<'meters' | 'kilometers' | 'miles'>('units', { type: String as PropType<'meters' | 'kilometers' | 'miles'>, required: true })
</script>

<template>
  <UCard class="w-80 z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <div class="text-lg font-semibold mb-4">
      Buffer Settings
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
    <!-- Union Toggle -->
    <div class="flex justify-between">
      <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Union</span>
      <UToggle
        :model-value="mode === 'union'"
        color="green"
        size="lg"
        on-icon="i-heroicons-check-20-solid"
        off-icon="i-heroicons-x-mark-20-solid"
        @update:model-value="(value) => mode = value ? 'union' : 'none'"
      />
    </div>
    <!-- Intersect Toggle -->
    <div class="flex justify-between">
      <span class="block mb-2 capitalize text-black font-semibold dark:text-white">Intersect</span>
      <UToggle
        :model-value="mode === 'intersect'"
        color="green"
        size="lg"
        on-icon="i-heroicons-check-20-solid"
        off-icon="i-heroicons-x-mark-20-solid"
        @update:model-value="(value) => mode = value ? 'intersect' : 'none'"
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
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Radius ({{ units }}) </span>
      <UInput
        v-model.number="radius"
        type="number"
        min="0"
        step="1"
        class="w-20 px-1 "
      />
    </div>

    <!-- Units Selection (Radio Buttons) -->
    <!-- <span class="block py-2 capitalize text-black font-semibold dark:text-white">Units</span>
      <div class="flex space-x-4 mt-2">
        <label>
          <input v-model="units" type="radio" value="miles"> Miles
        </label>
        <label>
          <input v-model="units" type="radio" value="kilometers"> Kilometers
        </label>
        <label>
          <input v-model="units" type="radio" value="meters"> Meters
        </label>
      </div> -->
  </UCard>
</template>
