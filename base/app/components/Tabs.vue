<script setup lang="ts">
/** A row of pills, one selected: `modelValue` is the chosen option's value. */
withDefaults(defineProps<{
  options: { label: string, value: string }[]
  modelValue?: string
}>(), { modelValue: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex flex-wrap gap-2" role="tablist">
    <UButton
      v-for="option in options"
      :key="option.value"
      role="tab"
      :aria-selected="option.value === modelValue"
      :color="option.value === modelValue ? 'primary' : 'gray'"
      :variant="option.value === modelValue ? 'solid' : 'soft'"
      size="sm"
      class="rounded-full"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </UButton>
  </div>
</template>
