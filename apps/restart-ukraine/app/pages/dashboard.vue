<script setup lang="ts">
import { computed, ref } from 'vue';

// Icon Components
import BufferIcon from '@base/components/Icons/BufferIcon.vue';
import GridIcon from '@base/components/Icons/GridIcon.vue';
import HeatMapIcon from '@base/components/Icons/HeatMapIcon.vue';
import InterpolateIcon from '@base/components/Icons/InterpolateIcon.vue';
import PointIcon from '@base/components/Icons/PointIcon.vue';
import TesselationIcon from '@base/components/Icons/TesselationIcon.vue';

// Analytics Layers
import Buffer from '../components/Analytics/buffer.vue';
import Grid from '../components/Analytics/grid.vue';
import Heatmap from '../components/Analytics/heatmap.vue';
import Interpolate from '../components/Analytics/interpolate.vue';
import Points from '../components/Analytics/points.vue';
import Tesselation from '../components/Analytics/tesselation.vue';

// Utilities & Store
import ToolTips from '@base/components/Tools/ToolTips.vue';
import { useAllFeatureStore } from '@base/stores/all-features';
import { useMapStore } from '@base/stores/map';
import type { MapType } from '@base/stores/types/store';
import NumberCounter from '@base/components/NumberCounter.vue';

const allFeatureStore = useAllFeatureStore();
const mapStore = useMapStore();
const { setMapType } = mapStore;

const numberOfFeatures = computed(() => allFeatureStore.allFeatures.length);
const numberOfCategories = computed(() => Object.keys(allFeatureStore.featuresByCategory).length);
const numberOfType = computed(() => Object.keys(allFeatureStore.featuresByType).length);

const currentMapType = ref<MapType>('vector');
const show = ref(true);
const layers = ref<string[]>([]);
const mapRef = ref(null);

const items = {
  grid: { icon: GridIcon, layer: Grid },
  heatmap: { icon: HeatMapIcon, layer: Heatmap },
  points: { icon: PointIcon, layer: Points },
  tesselation: { icon: TesselationIcon, layer: Tesselation },
  interpolate: { icon: InterpolateIcon, layer: Interpolate },
  buffer: { icon: BufferIcon, layer: Buffer },
};

function handleAddingLayer(item: string) {
  if (layers.value.includes(item)) {
    layers.value = layers.value.filter(l => l !== item);
  } else {
    layers.value.push(item);
  }
}

const mapInstance = computed(() => mapRef.value?.mapInstance ?? null);

// 🌍 UI Navigation Items
const leftItems = ref([
  { label: 'Drawing Participation', color: 'black', to: '/about/' },
  { label: 'Гуртомá', color: 'black', to: '/about/' },
]);

const rightItems = ref([]);
if(!import.meta.client) {
    rightItems.value = [ {
    icon: computed(() =>
      currentMapType.value === 'vector'
        ? 'i-heroicons:map'
        : 'i-heroicons:globe-americas-20-solid'
    ),
    onClick: () => {
      currentMapType.value = currentMapType.value === 'vector' ? 'satellite' : 'vector';
      setMapType(currentMapType.value);
    },
  },
  {
    icon: computed(() => 'i-ix:analyze'),
    onClick: () => {
      show.value = !show.value;
    },
  },]
}
const metaData = {
    'Geometric Type': numberOfType,
    'Categories': numberOfCategories,
    'Data Entries': numberOfFeatures
}
</script>

<template>
    <GeneralizedHeader class="z-20" :left-items="leftItems" :right-items="rightItems" logo-src="/restart-logo-icon.svg"
        logo-alt="Restart Agency Logo" logo-link="https://www.restartfuture.org/" />

    <div v-if="show"
        class="fixed inset-0 left-1/2 top-1/2 w-[60%] max-w-[1800px] flex flex-col gap-5 overflow-hidden rounded-lg bg-transparent z-10 -translate-x-1/2 -translate-y-1/2">
        <UCard class="flex-shrink-0 bg-white rounded-lg shadow-md hover:shadow-lg">
            <template #header>
                <div class="flex flex-col md:flex-row justify-between gap-6 md:gap-10">
                    <!-- Left Column -->
                    <div class="flex flex-col justify-start items-start w-full md:w-2/4">
                        <div class="h-4 flex justify-start items-end gap-1.5">
                            <div class="text-black text-base font-medium">Khayelitsha</div>
                            <div class="text-neutral-400 text-xs font-medium">Urban Analysis</div>
                        </div>
                        <div class="w-full text-black text-xs font-medium">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua.
                        </div>
                        <div class="w-full text-black text-xs font-medium">
                            → Upload Data<br />→ Switch Project
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="w-full">
                        <div class="flex flex-row flex-wrap gap-4 w-full justify-start md:justify-end">
                            <div v-for="(count, label) in metaData" :key="label"
                                class="flex-1 min-w-[8rem] max-w-[9rem] h-36 px-4 py-4 bg-white rounded-lg shadow-lg flex flex-col justify-center items-center">
                                <div class="text-center text-neutral-400 text-sm font-medium">
                                    {{ label }}
                                </div>
                                <div class="text-center text-black text-xl font-medium leading-10">
                                    <NumberCounter :start-number="0" :end-number="count.value" :step="2"
                                        :tick-rate="5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </UCard>

        <div class="flex-grow overflow-y-scroll h-fit">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <div v-for="(item, index) in Object.keys(items)" :key="index"
                    class="px-3 py-3 bg-neutral-50 rounded-lg flex flex-col justify-start items-start gap-3 shadow-md hover:shadow-lg">
                    <div class="w-full flex justify-between items-center">
                        <div class="h-4 flex justify-start items-center gap-1.5">
                            <div class="text-black text-base font-medium capitalize">{{ item }}</div>
                        </div>
                        <div class="flex flex-row justify-end items-center gap-2">
                            <UIcon name="i-ix:add-circle" class="w-6 h-5 text-black text-base cursor-pointer"
                                @click="() => handleAddingLayer(item)" />
                        </div>
                    </div>
                    <div
                        class="w-full h-40 rounded-[5px] flex justify-center items-center bg-[url(/assets/images/street.png)] bg-cover bg-center bg-no-repeat">
                        <component :is="items[item].icon" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <GeneralizedBackgroundMap ref="mapRef">
        <template #layers>
            <component v-for="(layer, index) in layers" :key="index" :is="items[layer].layer" />
        </template>
        <template #overlays>
            <ToolTips :map-instance="mapInstance" :filter-keys="['fillColor']" />
        </template>
    </GeneralizedBackgroundMap>
</template>