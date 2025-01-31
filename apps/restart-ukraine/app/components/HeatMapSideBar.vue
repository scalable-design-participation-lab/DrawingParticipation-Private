<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useAllFeatureStore } from '@base/stores/all-features';
import { sub, format, isSameDay, type Duration } from 'date-fns'

// 🎨 Function to Generate Random Hex Colors
function getRandomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
}

// 🔥 Reactive State for Button Settings
const buttonSettings = reactive<Record<string, {
  weight: number;
  blur: number;
  radius: number;
  opacity: number;
  gradient: string[];
  visible: boolean;
  zIndex: number;
}>>({});

const currentZIndex = useState("zIndex", () => 1)
const emit = defineEmits(['updateSelection', 'updateFilter', 'updateFilterTime']);
const { featuresByCategory } = useAllFeatureStore();

// 📌 Compute Categories and Sections
const categories = computed(() => {
  const grouped: Record<string, string[]> = {};
  Object.keys(featuresByCategory).forEach((key) => {
    const [section, category] = key.split('.');
    if (section && category) {
      grouped[section] = grouped[section] || [];
      grouped[section].push(category);
    }
  });
  return grouped;
});
const sections = computed(() => Object.keys(categories.value));

// 🌟 Active Highlighted Buttons
const highlightedButtons = reactive(new Set<string>());

// 🎯 Handle Button Clicks (Selection/Deselection)
function handleClick(button: string, section: string) { 
  const key = `${section}.${button}`;
  const isSelected = highlightedButtons.has(button);

  if (isSelected) {
    highlightedButtons.delete(button);
    buttonSettings[key].visible = false;
    buttonSettings[key].zIndex = 0; 
  } else {
    highlightedButtons.add(button);
    if (!buttonSettings[key]) {
      buttonSettings[key] = {
        weight: 1,
        blur: 20,
        radius: 20,
        opacity: 0.8,
        gradient: [getRandomHexColor(),  '#0ff', '#0f0', '#ff0', getRandomHexColor()],
        visible: true,
        zIndex: currentZIndex.value,
      };
      currentZIndex.value += 1
    } else {
      buttonSettings[key].zIndex = currentZIndex.value; 
      buttonSettings[key].visible = true;
    }
  }

  emit('updateSelection', key, buttonSettings[key]);
}

// 🔥 Handle Gradient Color Updates (Ensuring Reactivity)
function updateGradient(section: string, button: string, index: number, color: string) {
  const key = `${section}.${button}`;
  if (buttonSettings[key]) {
    buttonSettings[key].gradient = [...buttonSettings[key].gradient]; // Ensure reactivity
    buttonSettings[key].gradient[index] = color;
  }
}

// 📌 Watcher to Emit Button Settings Changes
watch(buttonSettings, (newSettings) => {
  Object.entries(newSettings).forEach(([key, settings]) => {
    emit('updateSelection', key, settings);
  });
}, { deep: true });

// 🏷 Filters
const filters = ref({"Comments": false});

// 🎯 Handle Filter Toggle
function handleFilter(key: string) {
  filters.value[key] = !filters.value[key]
  emit('updateFilter');
}

// ⏳ Handle Fitler Time 
const ranges = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } }
]
const selected = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })

function isRangeSelected(duration: Duration) {
  return isSameDay(selected.value.start, sub(new Date(), duration)) && isSameDay(selected.value.end, new Date())
}

function selectRange(duration: Duration) {
  selected.value = { start: sub(new Date(), duration), end: new Date() }
  emit("updateFilterTime", selected.value)
}
const buttonBackground = (section: string, button: string) => {
  return buttonSettings[`${section}.${button}`]?.gradient?.[4] || 'transparent';
};
</script>

<template>
  <UCard class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden">
    <UTabs 
        :items="[
          { label: 'Data', slot: 'data' },
          { label: 'Layers', slot: 'layers' },
        ]" 
      >
        <!-- Data Tab -->
      <template #data="{ item }">
        <div class="flex-1 overflow-auto max-h-[calc(100vh-13rem)] px-1">
          <div v-if="sections.length">
            <div v-for="section in sections" :key="section" class="my-2">
              <span class="my-1 capitalize text-black font-semibold dark:text-white">{{ section }}</span>
              <div class="flex-wrap flex"> 
                <template v-for="button in categories[section]" :key="button">
                    <UButton 
                    size="2xs"
                      v-if="highlightedButtons.has(button)"
                      :class="['mx-1 my-1 rounded-full capitalize flex p text-white align-middle dark:text-white']"
                      :style="highlightedButtons.has(button) ? { backgroundColor: buttonBackground(section, button) } : {}"
                      @click="handleClick(button, section)"
                    >
                    {{ button }}
                    <UIcon name="i-tabler:minus-vertical"/>

                  <UPopover 
                    :popper="{ placement: 'auto'}"
                    :ui="{ rounded: 'rounded-3xl', trigger: 'inline-flex w-auto max-w-max' }"
                    @click.stop
                  >
                    <UIcon 
                      name="i-heroicons-chevron-down-20-solid"
                      class="hover:cursor-pointer hover:opacity-80 mt-1"
                    />
                  
                    <template #panel>
                      <div class="p-5 bg-white shadow-lg border dark:bg-gray-800 dark:border-gray-700 rounded-2xl">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings for {{ button }}</h3>
                        
                        <div class="grid grid-cols-2 gap-4">
                          <!-- Weight -->
                          <div class="space-y-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight</label>
                            <UInput 
                              v-model="buttonSettings[`${section}.${button}`].weight"
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
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Blur (px)</label>
                            <UInput 
                              v-model="buttonSettings[`${section}.${button}`].blur"
                              type="number"
                              :min="0"
                              :max="100"
                              class="w-full"
                              :ui="{ base: 'text-center' }"
                            />
                          </div>

                          <!-- Radius -->
                          <div class="space-y-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Radius (px)</label>
                            <UInput 
                              v-model="buttonSettings[`${section}.${button}`].radius"
                              type="number"
                              :min="0"
                              :max="100"
                              class="w-full"
                              :ui="{ base: 'text-center' }"
                            />
                          </div>

                          <!-- Opacity -->
                          <div class="space-y-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Opacity (%)</label>
                            <UInput 
                              :model-value="Math.round(buttonSettings[`${section}.${button}`].opacity * 100)"
                              @update:model-value="buttonSettings[`${section}.${button}`].opacity = $event / 100"
                              type="number"
                              :min="0"
                              :max="100"
                              class="w-full"
                              :ui="{ base: 'text-center' }"
                            />
                          </div>

                          <!-- Color Pickers -->
                          <div class="col-span-2 grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Color</label>
                              <color-picker-block
                                v-model="buttonSettings[`${section}.${button}`].gradient[0]"
                                @change="updateGradient(section, button, 0, $event.hex)"
                                class="w-full h-10 rounded-lg overflow-hidden"
                              />
                            </div>
                            <div class="space-y-1">
                              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Color</label>
                              <color-picker-block
                                v-model="buttonSettings[`${section}.${button}`].gradient[4]"
                                @change="updateGradient(section, button, 4, $event.hex)"
                                class="w-full h-10 rounded-lg overflow-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </UPopover>
                  </UButton>

                  <UButton 
                  size="2xs"
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
            <!-- Date Time Range Picker -->
            <div class="flex-auto"> 
              <span class="my-1 capitalize text-black font-semibold dark:text-white">Time </span>
              <UPopover :popper="{ placement: 'auto' }" class="px-5 py-2">
                <UButton icon="i-heroicons-calendar-days-20-solid" color="green">
                  {{ format(selected.start, 'd MMM, yyy') }} - {{ format(selected.end, 'd MMM, yyy') }}
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
            <!-- 🎛 Filters -->
            <div class="flex justify-between" v-for="key in Object.keys(filters)" :key="key">
              <span class="my-1 capitalize text-black font-semibold dark:text-white">{{ key }}</span>
              <UToggle 
                :key="filters[key]" 
                class="my-1"
                color="green"
                size="lg"
                on-icon="i-heroicons-check-20-solid"
                off-icon="i-heroicons-x-mark-20-solid"
                :modelValue="filters[key]"
                @click="handleFilter(key)"
              />
            </div>
            
          </div>
          <div v-else>
            <p>No data available to display.</p>
          </div>
        </div>
      </template>
      <!-- Layers Tab -->
      <template  #layers="{item}">
        <div class="flex-1 overflow-auto max-h-[calc(100vh-13rem)] px-4 py-2">
          <p v-for="key in Object.keys(buttonSettings)" class="text-gray-600 dark:text-gray-300">
            {{ key }}
          </p>
        </div>
    </template>
    </UTabs>
  </UCard>
</template>