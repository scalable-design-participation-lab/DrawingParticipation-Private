<script setup lang="ts">
import { computed } from 'vue'

/** Vector / satellite switch, styled like a header pill. Pairs with BackgroundMap's `mapType`. */
const props = withDefaults(defineProps<{ modelValue?: 'vector' | 'satellite' }>(), { modelValue: 'vector' })
const emit = defineEmits<{ 'update:modelValue': [value: 'vector' | 'satellite'] }>()

const icon = computed(() => (props.modelValue === 'vector' ? 'i-heroicons:map' : 'i-heroicons:globe-americas-20-solid'))

function toggle() {
  emit('update:modelValue', props.modelValue === 'vector' ? 'satellite' : 'vector')
}
</script>

<template>
  <UButton
    :icon="icon"
    class="h-full px-2 md:px-3 lg:px-4 text-xs md:text-base lg:text-lg rounded-full !bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black shadow-lg dark:hover:!bg-slate-800 text-black dark:text-white"
    :aria-label="modelValue === 'vector' ? 'Satellite map' : 'Vector map'"
    @click="toggle"
  />
</template>
