<script setup lang="ts">
import { computed } from 'vue'

/**
 * The one modal: title, body (text or children), an optional confirm button,
 * an optional footer slot for anything else. Every per-app modal (intro,
 * onboarding, help, menu, thank-you, coming-soon…) is this plus JSON.
 */
const props = withDefaults(defineProps<{
  modelValue?: boolean
  title?: string
  text?: string
  /** Label of the confirm button; omitted = no button (click outside / the × closes). */
  buttonLabel?: string
  align?: 'left' | 'center'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /**
   * Cap the height and scroll the body, keeping the title and the footer in
   * place. Without it a long list pushes the buttons off the screen.
   */
  scroll?: boolean
  /** Show a × in the header. */
  closable?: boolean
  bodyClass?: string
  ui?: Record<string, unknown>
}>(), {
  modelValue: true,
  title: '',
  text: '',
  buttonLabel: '',
  align: 'left',
  size: 'md',
  scroll: false,
  closable: false,
  bodyClass: '',
  ui: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  /** The confirm button was pressed (the modal also closes). */
  'confirm': []
}>()

const WIDTH = { 'sm': 'sm:max-w-md', 'md': 'sm:max-w-lg', 'lg': 'sm:max-w-xl', 'xl': 'sm:max-w-2xl', '2xl': 'sm:max-w-4xl', '3xl': 'sm:max-w-6xl' }

const open = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    if (!value) {
      emit('close')
    }
  },
})

function confirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <UModal v-model="open" :ui="{ width: WIDTH[size], ...ui }">
    <div
      :class="[
        bodyClass || 'rounded-lg bg-white p-6 dark:bg-gray-900',
        align === 'center' ? 'text-center' : '',
        scroll ? 'flex max-h-[85dvh] flex-col overflow-hidden' : '',
      ]"
    >
      <div v-if="title || closable" class="mb-3 flex items-start justify-between gap-2" :class="scroll ? 'shrink-0' : ''">
        <h2 class="text-lg font-semibold" :class="align === 'center' ? 'w-full text-center' : ''">
          {{ title }}
        </h2>
        <UButton v-if="closable" color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" aria-label="close" @click="open = false" />
      </div>
      <div :class="scroll ? 'min-h-0 flex-1 overflow-y-auto' : ''">
        <slot>
          <p class="whitespace-pre-line">
            {{ text }}
          </p>
        </slot>
      </div>
      <div v-if="buttonLabel" class="mt-4 flex" :class="[align === 'center' ? 'justify-center' : 'justify-end', scroll ? 'shrink-0' : '']">
        <UButton color="black" class="rounded-full px-6 py-3" @click="confirm">
          {{ buttonLabel }}
        </UButton>
      </div>
      <slot name="footer" />
      <button v-if="!buttonLabel && !closable" type="button" class="absolute inset-0 -z-10 h-full w-full cursor-pointer opacity-0" aria-label="close" @click="open = false" />
    </div>
  </UModal>
</template>
