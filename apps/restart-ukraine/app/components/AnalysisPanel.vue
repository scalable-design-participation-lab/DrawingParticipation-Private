<script setup lang="ts">
import { reactive } from 'vue'
import NumberCounter from '@base/components/NumberCounter.vue'
import HeatMapController from '@base/components/GeoSpatialLayer/HeatMap/HeatMapController.vue'
import { layerDefinitions } from '../stores/layerRegistry'
import { useAnalysis } from '../composables/useAnalysis'

/**
 * The analysis dashboard (metadata tiles + layer cards) and, once layers are
 * active, the layer-controls accordion. `modelValue` = dashboard open.
 */
const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: true })
const emit = defineEmits<{ 'update:modelValue': [open: boolean] }>()

const { layers, filters, layerSettings, filterTime, ranges, metaData, categories, layerCards, toggleLayer } = useAnalysis()

const openControllers = reactive<Record<number, boolean>>({})
function toggleController(layerId: number) {
  openControllers[layerId] = !openControllers[layerId]
}

function onToggleLayer(type: keyof typeof layerDefinitions) {
  toggleLayer(type)
  emit('update:modelValue', false)
}

// Controller events write straight back into the layer's reactive props.
function handlersFor(layer: { props: Record<string, unknown> }) {
  return Object.fromEntries(Object.keys(layer.props).map(key => [`update:${key}`, (v: unknown) => {
    layer.props[key] = v
  }]))
}
</script>

<template>
  <!-- Dashboard Modal -->
  <div
    v-if="props.modelValue"
    class="fixed left-1/2 top-1/2 w-[60%] h-[70%] max-w-[1800px] flex flex-col gap-5 overflow-scroll rounded-lg bg-transparent z-50 -translate-x-1/2 -translate-y-1/2"
  >
    <UCard class="flex-shrink-0 bg-white dark:bg-neutral-900 rounded-lg shadow-md hover:shadow-lg">
      <template #header>
        <UIcon
          name="i-material-symbols:cancel-rounded"
          class="absolute top-2 left-2 w-5 h-6 text-black dark:text-white cursor-pointer z-10 hover:opacity-70 hover:bg-red-500 dark:hover:bg-red-500"
          @click="emit('update:modelValue', false)"
        />
        <div class="flex flex-col md:flex-row justify-between gap-6 md:gap-10 p-7">
          <div class="flex flex-col justify-start items-start w-full md:w-2/4">
            <div class="h-4 flex justify-start items-end gap-1.5">
              <div class="text-black dark:text-white text-base font-medium">
                Khayelitsha
              </div>
              <div class="text-neutral-400 dark:text-neutral-300 text-xs font-medium">
                Urban Analysis
              </div>
            </div>
            <div class="w-full text-black dark:text-white text-xs font-medium">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua.
            </div>
          </div>
          <div class="w-full">
            <div class="w-full flex flex-row flex-wrap gap-4 justify-start md:justify-end">
              <div
                v-for="(count, label) in metaData"
                :key="label"
                class="flex-1 min-w-[8rem] max-w-[9rem] h-36 px-4 py-4 bg-white dark:bg-neutral-800 rounded-lg shadow-lg flex flex-col justify-center items-center"
              >
                <div class="text-center text-neutral-400 dark:text-neutral-300 text-sm font-medium">
                  {{ label }}
                </div>
                <div class="text-center text-black dark:text-white text-xl font-medium leading-10">
                  <NumberCounter :start-number="0" :end-number="count" :step="2" :tick-rate="5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <!-- Layer Selection Cards -->
    <div class="flex-grow overflow-scroll h-fit">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <div
          v-for="card in layerCards"
          :key="card.type"
          class="px-3 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex flex-col justify-start items-start gap-3 shadow-md hover:shadow-lg"
        >
          <div class="w-full flex justify-between items-center">
            <div class="h-4 flex items-center gap-1.5">
              <div class="text-black dark:text-white text-base font-medium capitalize">
                {{ card.label }}
              </div>
            </div>
            <UIcon
              :name="card.active ? 'i-material-symbols:cancel-rounded' : 'i-ix:add-circle'"
              :class="card.active ? 'cursor-pointer hover:text-red-500' : 'hover:text-green-500'"
              @click="onToggleLayer(card.type)"
            />
          </div>
          <div class="w-full h-40 rounded-[5px] flex justify-center items-center bg-[url(/assets/images/street.png)] bg-cover bg-center dark:invert">
            <component :is="card.iconName" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Active Layers: Accordion Controllers -->
  <div
    v-if="layers.length > 0 && !props.modelValue"
    class="fixed right-7 top-20 z-30 bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden"
  >
    <h2 class="text-lg font-semibold mb-3 text-black dark:text-white">
      Layer Controls
    </h2>
    <div v-for="layer in layers" :key="layer.id" class="mb-4 overflow-scroll">
      <div class="w-[340px] flex justify-between items-center cursor-pointer" @click="toggleController(layer.id)">
        <span class="capitalize text-gray-800 dark:text-gray-200">{{ layer.type }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="w-4 h-4 transition-transform duration-200 ease-in-out"
          :class="{ 'rotate-180': openControllers[layer.id] }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <Transition
        enter-active-class="transition-all duration-200 ease-in-out"
        leave-active-class="transition-all duration-200 ease-in-out"
        enter-from-class="max-h-0 overflow-hidden"
        enter-to-class="max-h-96 overflow-hidden"
        leave-from-class="max-h-96 overflow-hidden"
        leave-to-class="max-h-0 overflow-hidden"
      >
        <div v-show="openControllers[layer.id]" class="mt-2 px-2 py-2 border-l-2 border-blue-500">
          <component
            :is="layerDefinitions[layer.type].controller"
            v-if="layer.type !== 'heatmap'"
            v-bind="layer.props"
            v-on="handlersFor(layer)"
          />
          <HeatMapController
            v-else
            v-model:filters="filters"
            v-model:filter-time="filterTime"
            v-model:layer-settings="layerSettings"
            :ranges="ranges"
            :categories="categories"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>
