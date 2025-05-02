<script setup lang="ts">
const visible = defineModel('visible', { type: Boolean, required: true })
const zIndex = defineModel('zIndex', { type: Number, required: true })
const type = defineModel('type', { type: String, required: true })
const opacity = defineModel('opacity', { type: Number, required: true })
const clusterCount = defineModel('clusterCount', { type: Number, required: true })
const primaryColor = defineModel('primaryColor', { type: String, required: true, default: '#ff0000' })
const secondaryColor = defineModel('secondaryColor', { type: String, required: true, default: '#800080' })
const area = defineModel('area', { type: Boolean, required: true })
</script>

<template>
  <UCard class="z-40 shadow-xl dark:bg-black flex flex-col overflow-scroll">
    <div class="text-lg font-semibold mb-4">
      Tesselation Settings
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
    <!-- Area -->
    <div class="flex justify-between my-2">
      <span class="my-1 capitalize text-black font-semibold dark:text-white"> Area </span>
      <UToggle
        v-model="area"
        class="my-1"
        color="green"
        size="lg"
        on-icon="i-heroicons-check-20-solid"
        off-icon="i-heroicons-x-mark-20-solid"
        @change="clusterCount = 1"
      />
    </div>

    <!-- Cluster Input -->
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Cluster Count</span>
      <UInput
        id="clusterCount"
        v-model.number="clusterCount"
        :disabled="area"
        min="1"
        step="1"
        max="1000"
        type="number"
        class="w-20"
      />
    </div>
    <!-- Z Index Input -->
    <div class="flex items-center justify-between">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">z-index</span>
      <UInput
        id="z-index"
        v-model.number="zIndex"
        type="number"
        class="w-20"
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
        class="w-20"
      />
    </div>
    <!-- Type Selection (Radio Buttons) -->
    <span class="block py-2 capitalize text-black font-semibold dark:text-white">Tesselation Mode</span>
    <div class="flex space-x-4 mt-2">
      <label>
        <input v-model="type" type="radio" value="voronoi"> Voronoi
      </label>
      <label>
        <input v-model="type" type="radio" value="tin"> TIN
      </label>
    </div>
    <!-- Primary Color Section with Minimized Button -->
    <div class="flex justify-between  mt-4">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Primary Color</span>
      <!-- Popup for color picker -->
      <UPopover
        :popper="{ placement: 'bottom-end', strategy: 'absolute' }"
        :ui="{ base: 'overflow-visible', rounded: 'rounded-lg', ring: 'ring-1 ring-gray-200 dark:ring-gray-800' }"
      >
        <button
          class="w-8 h-8 rounded-full border border-gray-300"
          :style="{ backgroundColor: primaryColor }"
        />
        <template #panel>
          <color-picker-block
            v-model="primaryColor"
            class="w-full h-10 rounded-lg overflow-hidden"
            @change="(e) => primaryColor = e.hex"
          />
        </template>
      </UPopover>
    </div>
    <!-- Secondary Color Section with Minimized Button -->
    <div class="flex justify-between mt-4">
      <span class="block py-2 capitalize text-black font-semibold dark:text-white">Secondary Color</span>
      <!-- Popup for color picker -->
      <UPopover
        :popper="{ placement: 'bottom-end', strategy: 'absolute' }"
        :ui="{ base: 'overflow-visible', rounded: 'rounded-lg', ring: 'ring-1 ring-gray-200 dark:ring-gray-800' }"
      >
        <button
          class="w-8 h-8 rounded-full border border-gray-300"
          :style="{ backgroundColor: secondaryColor }"
        />
        <template #panel>
          <color-picker-block
            v-model="secondaryColor"
            class="w-full h-10 rounded-lg overflow-hidden"
            @change="(e) => secondaryColor = e.hex"
          />
        </template>
      </UPopover>
    </div>
  </UCard>
</template>
