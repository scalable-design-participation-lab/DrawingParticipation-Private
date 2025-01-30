<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useAllFeatureStore } from '@base/stores/all-features';

const weight = ref(1);
const blur = ref(5);
const radius = ref(10);
const opacity = ref(0.8);
const primaryColor = ref('#ff0000');
const secondaryColor = ref('#00ff00');

const emit = defineEmits(['updateSelection', 'updateFilter'])

const { featuresByCategory } = useAllFeatureStore();

const categories = computed(() => {
  const grouped: Record<string, string[]> = {};
  Object.keys(featuresByCategory).forEach((key) => {
    const [section, category] = key.split('.');
    if (section && category) {
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(category);
    }
  });
  return grouped;
});

const sections = computed(() => Object.keys(categories.value));

const highlightedButtons = reactive(new Set<string>());

function handleClick(button: string, section: string) { 
  highlightedButtons.has(button) 
    ? highlightedButtons.delete(button) 
    : highlightedButtons.add(button);

  emit('updateSelection', `${section}.${button}`)
}

const filters = ref(["Comments"])

function handleFilter(button: string) {
  highlightedButtons.has(button) ? highlightedButtons.delete(button) : highlightedButtons.add(button); 

  emit('updateFilter')
}

const refVariable = ref('#000');
</script>

<template>
  <UCard 
    class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden"
  >
    <div 
      class="flex-1 overflow-auto max-h-[calc(100vh-13rem)] px-1 "
    >
      <div v-if="sections.length" >
        <div v-for="section in sections" :key="section" class="my-2">
          <span class="my-1 capitalize text-black font-semibold dark:text-white"> {{ section }} </span>
          <div class="flex-wrap flex"> 
            <template v-for="button in categories[section]" :key="button">
              <UPopover
                v-if="highlightedButtons.has(button)"
                :popper="{ placement: 'auto', arrow: true, resize: true}"
                :ui="{ rounded: 'rounded-3xl', trigger: 'inline-flex w-auto max-w-max' }"
                mode="hover"
              >
                <UButton 
                  :class="['mx-1 my-1 rounded-full capitalize flex p', 
                    highlightedButtons.has(button) 
                      ? 'bg-black text-white dark:bg-green-500 hover:bg-black dark:hover:bg-green-600' 
                      : 'bg-gray-100 text-black dark:bg-gray-100 dark:text-black hover:bg-green-500 dark:hover:bg-green-500 hover:text-white']"
                  @click="handleClick(button, section)"
                  trailing-icon="i-heroicons-chevron-down-20-solid"
                >
                  {{ button }}
                </UButton>

                <template #panel>
                  <div class="p-5 bg-white shadow-lg border dark:bg-gray-800 dark:border-gray-700 rounded-3xl">
                    <p class="text-black dark:text-white mb-4">Settings for {{ button }}</p>
                    <div class="mb-3">
                      <label class="text-sm text-gray-700 dark:text-gray-300">Weight</label>
                      <UInput v-model="weight" type="number" class="w-full" />
                    </div>

                    <div class="mb-3">
                      <label class="text-sm text-gray-700 dark:text-gray-300">Blur</label>
                      <URange v-model="blur" :min="0" :max="20" class="w-full" />
                    </div>

                    <div class="mb-3">
                      <label class="text-sm text-gray-700 dark:text-gray-300">Radius</label>
                      <URange v-model="radius" :min="0" :max="100" class="w-full" />
                    </div>

                    <div class="mb-3">
                      <label class="text-sm text-gray-700 dark:text-gray-300">Opacity</label>
                      <UInput v-model="opacity" type="number" step="0.1" min="0" max="1" class="w-full" />
                    </div>

                    <div class="flex gap-4">
                      <div>
                        <label class="text-sm text-gray-700 dark:text-gray-300">Primary Color</label>
                        <color-picker-block
                          v-model="primaryColor"
                          @change="console.log('New color:', $event)"
                        />
                      </div>
                      <div>
                        <label class="text-sm text-gray-700 dark:text-gray-300">Secondary Color</label>
                        <color-picker-block
                          v-model="secondaryColor"
                          @change="console.log('new color:', $event)"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </UPopover>

              <UButton 
                v-else
                :class="['mx-1 my-1 rounded-full capitalize', 
                  highlightedButtons.has(button) 
                    ? 'bg-black text-white dark:bg-green-500 hover:bg-black dark:hover:bg-green-600' 
                    : 'bg-gray-100 text-black dark:bg-gray-100 dark:text-black hover:bg-green-500 dark:hover:bg-green-500 hover:text-white']"
                @click="handleClick(button, section)"
              >
                {{ button }}
              </UButton>
            </template>
          </div> 
        </div>
        <div class="flex justify-between" v-for="filter in filters" :key="filter">
          <span class="my-1 capitalize text-black font-semibold dark:text-white"> {{ filter }} </span>
          <UToggle 
            :key="filter" 
            class="my-1"
            color="green"
            size="lg"
            on-icon="i-heroicons-check-20-solid"
            off-icon="i-heroicons-x-mark-20-solid"
            :modelValue="highlightedButtons.has(filter)"
            @click="handleFilter(filter)"
          />
        </div>
      </div>
      <div v-else>
        <p>No data available to display.</p>
      </div>
    </div>
  </UCard>
</template>