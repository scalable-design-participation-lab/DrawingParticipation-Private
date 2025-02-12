<script setup lang="ts">
import { watch } from 'vue'
import draggable from 'vuedraggable'
import { type Duration, format } from 'date-fns'
import { useFilters } from '../../composables/useFilters'
import { useLayerSettings } from '../../composables/useLayerSettings'
import { useTimeRange } from '../../composables/useTimeRange'
import type { HeatMapLayerSettings } from './HeatMap.vue'

const categories = defineModel<Record<string, string[]>>('categories', { required: true })
const filters = defineModel<Record<string, boolean>>('filters', { required: true })
const layerSettings = defineModel<Record<string, HeatMapLayerSettings>>('layerSettings', { required: true })
const ranges = defineModel<{ label: string, duration: Duration }[]>('ranges', { required: true })
const filterTime = defineModel<{ start: Date, end: Date }>('filterTime', { required: true })

// ─────────────────────────────
// 2. Layer State Management (Reusable Composable Logic)
// ─────────────────────────────
const { highlightedButtons, sortedSettings, toggleLayer, updateGradient } = useLayerSettings(layerSettings)
const { toggleFilter } = useFilters(filters)
const { selected, isRangeSelected, selectRange } = useTimeRange({ days: 14 })

watch(layerSettings, () => {
  // updateSelection(layerSettings)
  console.log(layerSettings.value)
}, { deep: true, immediate: true })

// ─────────────────────────────
// 3. Filters & Time Range Logic
// ─────────────────────────────
function handleFilter(key: string) {
  toggleFilter(key)
}

watch(selected, (newRange) => {
  filterTime.value = newRange
})

// Helper to get the layer color
function layerColor(section: string, layer: string) {
  return layerSettings.value[getLayerKey(section, layer)]?.gradient?.[4] || 'transparent'
}
// Helper: Build a unique key for a layer
function getLayerKey(section: string, layer: string): string {
  return `${section}.${layer}`
}
</script>

<template>
  <UCard class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <div class="flex-1 overflow-auto max-h-[calc(100vh-13rem)] px-1">
      <div v-if="Object.keys(categories).length">
        <!-- ── Layers Header & Draggable List ── -->
        <div class="flex justify-between items-center mb-2">
          <span class="my-1 capitalize text-black font-semibold dark:text-white">Layers</span>
          <UPopover
            :popper="{ placement: 'bottom-end', strategy: 'absolute' }"
            :ui="{ base: 'overflow-visible', rounded: 'rounded-lg', ring: 'ring-1 ring-gray-200 dark:ring-gray-800' }"
          >
            <UButton
              size="2xs"
              class="bg-gray-100 mx-1 my-1 text-black rounded-full hover:bg-green-500 hover:text-white dark:bg-white dark:hover:bg-green-500"
              trailing-icon="i-heroicons-chevron-down-20-solid"
            >
              Edit Layers
            </UButton>

            <template #panel>
              <div class="w-64 py-2 px-5 dark:bg-black h-48 overflow-scroll">
                <div class="my-1 capitalize text-black font-semibold dark:text-white">
                  Drag to reorder layers
                </div>
                <draggable
                  v-model="sortedSettings"
                  item-key="key"
                  handle=".drag-handle"
                  ghost-class="opacity-50"
                  drag-class="cursor-grabbing"
                  class="space-y-1"
                >
                  <template #item="{ index, element }">
                    <div class="group relative flex items-center justify-between">
                      <!-- Display z-index -->
                      <span class="ml-2 text-xs text-black dark:text-white">
                        {{ index + 1 }} .
                      </span>
                      <UButton
                        size="2xs"
                        class="truncate text-left transition-all rounded-full mx-2 cursor-default"
                        :style="{ backgroundColor: layerColor(element.section, element.key) }"
                        @click.stop
                      >
                        <span class="text-sm font-medium text-white/90">
                          {{ element.key }}
                        </span>
                      </UButton>
                      <UIcon name="i-heroicons-bars-3-20-solid" class="drag-handle text-black hover:cursor-pointer dark:text-white" />
                    </div>
                  </template>
                </draggable>
                <div v-if="!sortedSettings.length" class="text-center p-4 text-sm text-gray-400 dark:text-gray-500">
                  No layers available
                </div>
              </div>
            </template>
          </UPopover>
        </div>

        <!-- ── Category Sections & Buttons ── -->
        <div v-for="(buttons, section) in categories" :key="section" class="my-2">
          <span class="my-1 capitalize text-black font-semibold dark:text-white">{{ section }}</span>
          <div class="flex flex-wrap">
            <template v-for="button in buttons" :key="button">
              <!-- Button when layer is active (highlighted) -->
              <UButton
                v-if="highlightedButtons.has(button)"
                size="2xs"
                class="mx-1 my-1 rounded-full capitalize flex text-white align-middle dark:text-white"
                :style="{ backgroundColor: layerColor(section, button) }"
                @click="toggleLayer(button, section)"
              >
                {{ button }}
                <UIcon name="i-tabler:minus-vertical" class="p-0" />
                <!-- Popover for layer settings -->
                <UPopover
                  :popper="{ placement: 'auto' }"
                  :ui="{ rounded: 'rounded-3xl', trigger: 'inline-flex w-auto max-w-max' }"
                  @click.stop
                >
                  <UIcon
                    name="i-heroicons-chevron-down-20-solid"
                    class="hover:cursor-pointer hover:opacity-80 mt-1"
                  />
                  <template #panel>
                    <div class="p-5 bg-white shadow-lg border dark:bg-black dark:border-gray-700 rounded-2xl">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Settings for {{ button }}
                      </h3>
                      <div class="grid grid-cols-2 gap-4">
                        <!-- Weight -->
                        <div class="space-y-1">
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Weight
                          </label>
                          <UInput
                            v-model="layerSettings[getLayerKey(section, button)].weight"
                            type="number"
                            :min="0"
                            :max="1"
                            step="0.1"
                            class="w-full"
                            :ui="{ base: 'text-center' }"
                          />
                        </div>
                        <!-- Blur -->
                        <div class="space-y-1">
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Blur (px)
                          </label>
                          <UInput
                            v-model="layerSettings[getLayerKey(section, button)].blur"
                            type="number"
                            :min="0"
                            :max="100"
                            class="w-full"
                            :ui="{ base: 'text-center' }"
                          />
                        </div>
                        <!-- Radius -->
                        <div class="space-y-1">
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Radius (px)
                          </label>
                          <UInput
                            v-model="layerSettings[getLayerKey(section, button)].radius"
                            type="number"
                            :min="0"
                            :max="100"
                            class="w-full"
                            :ui="{ base: 'text-center' }"
                          />
                        </div>
                        <!-- Opacity -->
                        <div class="space-y-1">
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Opacity (%)
                          </label>
                          <UInput
                            :model-value="Math.round(layerSettings[getLayerKey(section, button)].opacity * 100)"
                            type="number"
                            :min="0"
                            :max="100"
                            class="w-full"
                            :ui="{ base: 'text-center' }"
                            @update:model-value="value => layerSettings[getLayerKey(section, button)].opacity = value / 100"
                          />
                        </div>
                        <!-- Color Pickers -->
                        <div class="col-span-2 grid grid-cols-2 gap-4">
                          <div class="space-y-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Primary Color
                            </label>
                            <color-picker-block
                              v-model="layerSettings[getLayerKey(section, button)].gradient[0]"
                              class="w-full h-10 rounded-lg overflow-hidden"
                              @change="updateGradient(section, button, 0, $event.hex)"
                            />
                          </div>
                          <div class="space-y-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Secondary Color
                            </label>
                            <color-picker-block
                              v-model="layerSettings[getLayerKey(section, button)].gradient[4]"
                              class="w-full h-10 rounded-lg overflow-hidden"
                              @change="updateGradient(section, button, 4, $event.hex)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </UPopover>
              </UButton>
              <!-- Button when layer is not yet active -->
              <UButton
                v-else
                size="2xs"
                class="mx-1 my-1 rounded-full capitalize"
                :class="[
                  highlightedButtons.has(button)
                    ? 'bg-black text-white dark:bg-green-500 hover:bg-black dark:hover:bg-green-600'
                    : 'bg-gray-100 text-black dark:bg-gray-100 dark:text-black hover:bg-green-500 dark:hover:bg-green-500 hover:text-white',
                ]"
                @click="toggleLayer(button, section)"
              >
                {{ button }}
              </UButton>
            </template>
          </div>
        </div>

        <!-- ── Time Range Picker ── -->
        <div class="flex-auto">
          <span class="my-1 capitalize text-black font-semibold dark:text-white">
            Time
          </span>
          <UPopover :popper="{ placement: 'auto' }" class="px-5 py-2">
            <UButton icon="i-heroicons-calendar-days-20-solid" color="green">
              {{ format(selected.start, 'd MMM, yyyy') }} - {{ format(selected.end, 'd MMM, yyyy') }}
            </UButton>
            <template #panel="{ close }">
              <div class="flex flex-grow items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                <div class="hidden sm:flex flex-col py-4">
                  <UButton
                    v-for="(range, index) in ranges"
                    :key="index"
                    :label="range.label"
                    color="gray"
                    variant="ghost"
                    class="rounded-none px-6"
                    :class="[isRangeSelected(range.duration) ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                    truncate
                    @click="selectRange(range.duration)"
                  />
                </div>
                <DatePicker v-model="selected" @close="close" />
              </div>
            </template>
          </UPopover>
        </div>

        <!-- ── Filters ── -->
        <div v-for="(value, key) in filters" :key="key" class="flex justify-between">
          <span class="my-1 capitalize text-black font-semibold dark:text-white">{{ key }}</span>
          <UToggle
            :model-value="value"
            class="my-1"
            color="green"
            size="lg"
            on-icon="i-heroicons-check-20-solid"
            off-icon="i-heroicons-x-mark-20-solid"
            @click="handleFilter(key as string)"
          />
        </div>
      </div>
      <div v-else>
        <p>No data available to display.</p>
      </div>
    </div>
  </UCard>
</template>
