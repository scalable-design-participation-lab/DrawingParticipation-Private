<template>
  <UCard 
    class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden"
  >
    <div 
      class="flex-1 overflow-y-hidden max-h-[calc(100vh-13rem)] px-1"
    >
      <div v-if="sections.length">
        <div v-for="section in sections" :key="section">
          <span class="my-1 capitalize text-black font-semibold"> {{ section }} </span>
          <div class="flex-auto"> 
            <UButton 
              v-for="button in categories[section]" 
              :class="highlightedButtons.has(button) ? 'bg-black text-white' : 'bg-white text-black '" 
              class="mx-1 my-1 border border-black  hover:bg-black hover:text-white rounded-full capitalize" 
              :key="button" 
              @click="handleClick(button, section)"
            >
              {{ button }}
            </UButton>
          </div> 
        </div>
        <div class="flex justify-between" v-for="filter in filters" :key="filter">
          <span class="my-1 capitalize text-black font-semibold"> {{ filter }} </span>
            <UToggle 
              :key="filter" 
              class="my-1"
              color="green"
              size="lg"
              on-icon="i-heroicons-check-20-solid"
              off-icon="i-heroicons-x-mark-20-solid"
              :modelValue="highlightedButtons.has(filter)"
              @click="handleFilter(filter)"
            >
              {{ highlightedButtons.has(filter) ? "Off" : "On"  }}
            </UToggle>
      </div>
      </div>
      <div v-else>
        <p>No data available to display.</p>
      </div>
    </div>
  </UCard>
</template>
  
  <style scoped>
  /* WebKit scrollbar styling for Mac and Chrome */
.overflow-y-scroll::-webkit-scrollbar {
  -webkit-appearance: none;
}

.overflow-y-scroll::-webkit-scrollbar-thumb {
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.overflow-y-scroll::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
  
<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useAllFeatureStore } from '@base/stores/all-features';

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

</script>
  