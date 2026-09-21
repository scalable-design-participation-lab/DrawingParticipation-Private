<script setup lang="ts">
import { computed } from 'vue'

/**
 * A card that walks through numbered steps: progress bar, the current
 * step's title / text / icon, its buttons and icon grid, prev / next arrows.
 * Everything is data; picking a button or an icon emits its `value`.
 */
export interface StepButton {
  label: string
  color?: string
  variant?: 'solid' | 'outline'
  tooltip?: string
  value?: unknown
}

export interface StepIcon {
  name: string
  src: string
  tooltip?: string
  value?: unknown
}

export interface Step {
  title?: string
  text?: string
  icon?: string
  buttons?: StepButton[]
  iconGrid?: { title?: string, icons: StepIcon[] }
}

const props = withDefaults(defineProps<{
  /** 1-based current step. */
  step?: number
  steps: Step[]
}>(), {
  step: 1,
})

const emit = defineEmits<{
  'update:step': [step: number]
  /** A button or an icon was chosen: its `value` (or its label / name). */
  'select': [value: unknown]
}>()

const current = computed(() => props.steps[props.step - 1] ?? {})
const progress = computed(() => (props.step / Math.max(props.steps.length, 1)) * 100)

const BORDER: Record<string, string> = {
  red: 'border-2 border-red-500',
  green: 'border-2 border-green-500',
  blue: 'border-2 border-blue-500',
  yellow: 'border-2 border-yellow-500',
  purple: 'border-2 border-purple-500',
}
</script>

<template>
  <UCard class="dark:bg-black">
    <div class="space-y-3">
      <UProgress :value="progress" />
      <div v-if="current.title || current.icon">
        <UIcon v-if="current.icon" :name="current.icon" />
        <h2 v-if="current.title" class="text-md font-semibold !leading-tight md:text-lg">
          {{ current.title }}
        </h2>
      </div>
      <p v-if="current.text" class="pb-2 text-xs !leading-tight md:text-sm">
        {{ current.text }}
      </p>

      <div v-if="current.buttons?.length" class="flex flex-col space-y-2">
        <UTooltip v-for="button in current.buttons" :key="button.label" :text="button.tooltip" :disabled="!button.tooltip">
          <UButton
            :color="button.color"
            :variant="button.variant ?? 'solid'"
            class="w-full justify-center"
            :class="button.variant === 'outline' ? ['rounded-full hover:!bg-gray-50 dark:hover:!bg-zinc-800', BORDER[button.color ?? '']] : ''"
            @click="emit('select', button.value ?? button.label)"
          >
            {{ button.label }}
          </UButton>
        </UTooltip>
      </div>

      <div v-if="current.iconGrid">
        <p v-if="current.iconGrid.title" class="mb-2 text-sm text-gray-400">
          {{ current.iconGrid.title }}
        </p>
        <UCard class="dark:!bg-zinc-950">
          <div class="grid grid-cols-3 gap-3">
            <UTooltip v-for="icon in current.iconGrid.icons" :key="icon.name" :text="icon.tooltip" :disabled="!icon.tooltip">
              <UButton variant="ghost" :aria-label="icon.tooltip ?? icon.name" @click="emit('select', icon.value ?? icon.name)">
                <img :src="icon.src" :alt="icon.name" class="h-8 w-auto dark:!invert">
              </UButton>
            </UTooltip>
          </div>
        </UCard>
      </div>

      <slot />

      <div class="flex justify-between">
        <UButton icon="i-heroicons-arrow-left-20-solid" color="white" variant="solid" class="rounded-full p-2" :disabled="step <= 1" aria-label="previous" @click="emit('update:step', step - 1)" />
        <UButton icon="i-heroicons-arrow-right-20-solid" color="white" variant="solid" class="rounded-full p-2" :disabled="step >= steps.length" aria-label="next" @click="emit('update:step', step + 1)" />
      </div>
    </div>
  </UCard>
</template>
