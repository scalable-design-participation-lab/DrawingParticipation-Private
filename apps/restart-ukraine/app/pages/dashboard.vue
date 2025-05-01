<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { storeToRefs }   from 'pinia'

// --- Stores & Domain ---
import { useAllFeatureStore } from '@base/stores/all-features'
import { useMapStore }        from '@base/stores/map'
import type { MapType }       from '@base/stores/types/store'
import { layerDefinitions }   from '../stores/layerRegistry'
import { useLayersStore }     from '../stores/layers'

// --- Vue Components ---
import GeneralizedHeader       from '@base/components/GeneralizedHeader.vue'
import GeneralizedBackgroundMap from '@base/components/GeneralizedBackgroundMap.vue'
import NumberCounter           from '@base/components/NumberCounter.vue'
import ToolTips                from '@base/components/Tools/ToolTips.vue'

// --- Geospatial Utils ---
import * as turf     from '@turf/turf'
import { toLonLat } from 'ol/proj'

// --- Feature & Map Stores ---
const allFeatureStore = useAllFeatureStore()
const mapStore        = useMapStore()
const { setMapType }  = mapStore
const { allFeatures, featuresByCategory, featuresByType } = storeToRefs(allFeatureStore)

// --- Dashboard State ---
const showDashboard = ref(true)
const showDataModal = ref(false)

// --- Map State ---
const currentMapType = ref<MapType>('vector')
const mapRef         = ref<any>(null)
const mapInstance    = computed(() => mapRef.value?.mapInstance ?? null)

// --- Counts & Metadata ---
const numberOfFeatures   = computed(() => allFeatures.value.length)
const numberOfCategories = computed(() => Object.keys(featuresByCategory.value).length)
const numberOfTypes      = computed(() => Object.keys(featuresByType.value).length)
const metaData = computed(() => ({
  'Data Entries':   numberOfFeatures.value,
  'Categories':     numberOfCategories.value,
  'Geometric Type': numberOfTypes.value,
}))

// --- GeoJSON Features for Map ---
const features = computed(() => {
  const pts = featuresByType.value.Point.map(f =>
    turf.point(toLonLat(f.coordinates as [number, number]), { value: Math.random() * 100 })
  )
  return turf.featureCollection(pts)
})

// --- Layers Store & Controllers ---
const layersStore = useLayersStore()
const { layers }  = storeToRefs(layersStore)

// Toggle add/remove layer
function toggleLayer(type: keyof typeof layerDefinitions) {
  const existing = layers.value.find(l => l.type === type)
  if (existing) layersStore.removeLayer(existing.id)
  else           layersStore.addLayer(type)

  showDashboard.value = false
}

// Handlers for controller events
const layerEventHandlers = computed(() =>
  layers.value.reduce<Record<number, Record<string, (v: any) => void>>>(
    (acc, layer) => {
      acc[layer.id] = Object.fromEntries(
        Object.keys(layer.props).map(key => [
          `update:${key}`,
          (v: any) => void (layer.props[key] = v),
        ])
      )
      return acc
    },
    {}
  )
)

// Header Nav Items
const leftItems = ref([
  { label: 'Drawing Participation', to: '/about/' },
  { label: 'Гуртомá',             to: '/about/' },
])
const rightItems = ref([
  {
    icon: computed(() =>
      currentMapType.value === 'vector'
        ? 'i-heroicons:map'
        : 'i-heroicons:globe-americas-20-solid'
    ),
    onClick: () => {
      currentMapType.value = currentMapType.value === 'vector' ? 'satellite' : 'vector'
      setMapType(currentMapType.value)
    },
  },
  {
    icon: computed(() => 'i-ix:analyze'),
    onClick: () => { showDashboard.value = !showDashboard.value },
  },
])

// Layer Cards Data (for selection UI)
const layerCards = computed(() =>
  Object.entries(layerDefinitions).map(([type, def]) => ({
    type:      type as keyof typeof layerDefinitions,
    label:     def.label,
    iconName:  def.icon,
    active:    layers.value.some(l => l.type === type),
  }))
)

// --- Accordion State for Controllers ---
const openControllers = reactive<Record<number, boolean>>({})
function toggleController(layerId: number) {
  openControllers[layerId] = !openControllers[layerId]
}
</script>

<template>
  <GeneralizedHeader
    class="z-20"
    :left-items="leftItems"
    :right-items="rightItems"
    logo-src="/restart-logo-icon.svg"
    logo-alt="Restart Agency Logo"
    logo-link="https://www.restartfuture.org/"
  />

  <!-- Dashboard Modal -->
  <div
    v-if="showDashboard && !showDataModal"
    class="fixed left-1/2 top-1/2 w-[60%] h-[70%] max-w-[1800px] flex flex-col gap-5 overflow-hidden rounded-lg bg-transparent z-10 -translate-x-1/2 -translate-y-1/2"
  >
    <UCard class="flex-shrink-0 bg-white dark:bg-neutral-900 rounded-lg shadow-md hover:shadow-lg">
      <template #header>
        <UIcon
          name="i-material-symbols:cancel-rounded"
          class="absolute top-2 left-2 w-5 h-6 text-black dark:text-white cursor-pointer z-10 hover:opacity-70 hover:bg-red-500 dark:hover:bg-red-500"
          @click="() => showDashboard = false"
        />
        <div class="flex flex-col md:flex-row justify-between gap-6 md:gap-10 p-7">
          <!-- Left Column -->
          <div class="flex flex-col justify-start items-start w-full md:w-2/4">
            <div class="h-4 flex justify-start items-end gap-1.5">
              <div class="text-black dark:text-white text-base font-medium">Khayelitsha</div>
              <div class="text-neutral-400 dark:text-neutral-300 text-xs font-medium">Urban Analysis</div>
            </div>
            <div class="w-full text-black dark:text-white text-xs font-medium">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua.
            </div>
          </div>
          <!-- Right Column: Metadata Tiles -->
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
    <div class="flex-grow overflow-y-scroll h-fit">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <div
          v-for="card in layerCards"
          :key="card.type"
          class="px-3 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex flex-col justify-start items-start gap-3 shadow-md hover:shadow-lg"
        >
          <div class="w-full flex justify-between items-center">
            <div class="h-4 flex items-center gap-1.5">
              <div class="text-black dark:text-white text-base font-medium capitalize">{{ card.label }}</div>
            </div>
            <UIcon
              :name="card.active ? 'i-material-symbols:cancel-rounded' : 'i-ix:add-circle'"
              :class="card.active ? 'cursor-pointer hover:text-red-500' : 'hover:text-green-500'"
              @click="toggleLayer(card.type)"
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
    v-if="layers.length > 0"
    class="w-96 md:w-80 max-h-[calc(100vh-11rem)] fixed m-20 right-10 top-5  bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 z-30 overflow-y-auto"
  >
    <h2 class="text-lg font-semibold mb-3 text-black dark:text-white">Layer Controls</h2>
    <div v-for="layer in layers" :key="layer.id" class="mb-4">
      <!-- Accordion Header -->
      <div
        @click="toggleController(layer.id)"
        class="flex justify-between items-center cursor-pointer px-2 py-1"
      >
        <span class="capitalize text-gray-800 dark:text-gray-200">{{ layer.type }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          class="w-4 h-4 transition-transform duration-200 ease-in-out"
          :class="{ 'rotate-180': openControllers[layer.id] }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <!-- Collapsible Controller -->
      <Transition
        enter-active-class="transition-all duration-200 ease-in-out"
        leave-active-class="transition-all duration-200 ease-in-out"
        enter-from-class="max-h-0 overflow-hidden"
        enter-to-class="max-h-96 overflow-hidden"
        leave-from-class="max-h-96 overflow-hidden"
        leave-to-class="max-h-0 overflow-hidden"
      >
        <div
          v-if="openControllers[layer.id]"
          class="mt-2 px-2 py-2 border-l-2 border-blue-500"
        >
          <component
            :is="layerDefinitions[layer.type].controller"
            v-bind="layer.props"
            v-on="layerEventHandlers[layer.id]"
          />
        </div>
      </Transition>
    </div>
  </div>

  <!-- Map & Overlays -->
  <GeneralizedBackgroundMap ref="mapRef">
    <template #layers>
      <component
        v-for="layer in layers"
        :key="layer.id"
        :is="layerDefinitions[layer.type].component"
        v-bind="layer.props"
        :features="features"
      />
    </template>
    <template #overlays>
      <ToolTips :map-instance="mapInstance" :filter-keys="['fillColor', 'value']" />
    </template>
  </GeneralizedBackgroundMap>
</template>