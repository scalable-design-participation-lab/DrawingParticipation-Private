<script setup lang="ts">
import { computed } from 'vue'

/**
 * Welcome / onboarding text in a modal. Generic replacement for the per-app
 * MapIntroModal / OnboardingModal variants.
 */
const props = withDefaults(defineProps<{
  modelValue?: boolean
  title?: string
  text?: string
  buttonLabel?: string
  bodyClass?: string
  ui?: Record<string, unknown>
}>(), {
  modelValue: true,
  title: '',
  text: '',
  buttonLabel: '',
  bodyClass: '',
  ui: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    if (!value) {
      emit('close')
    }
  },
})
</script>

<template>
  <UModal v-model="open" :ui="ui">
    <div :class="bodyClass || 'rounded-lg bg-white p-6 dark:bg-gray-900'">
      <h2 v-if="title" class="mb-3 text-lg font-semibold">
        {{ title }}
      </h2>
      <slot>
        <p class="whitespace-pre-line">
          {{ text }}
        </p>
      </slot>
      <div v-if="buttonLabel" class="mt-4 flex justify-end">
        <UButton color="black" @click="open = false">
          {{ buttonLabel }}
        </UButton>
      </div>
      <button v-else type="button" class="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="close" @click="open = false" />
    </div>
  </UModal>
</template>
