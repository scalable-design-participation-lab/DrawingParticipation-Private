<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Full-screen splash with a progress bar that fills over `duration`, cycling
 * through `steps` as it goes, and emits `done` when it reaches the end.
 *
 * The progress is a reassurance, not a measurement: nothing here knows what the
 * page is loading. A page that can measure its own loading should bind
 * `$sources.<name>.loading` to an `if` instead of using this.
 */
const props = withDefaults(defineProps<{
  title?: string
  message?: string
  /** Shown in turn under the bar, one per equal slice of the duration. */
  steps?: string[]
  /** How long the bar takes to fill, in milliseconds. */
  duration?: number
  icon?: string
}>(), {
  title: 'Loading',
  message: '',
  steps: () => [],
  duration: 2500,
  icon: 'i-heroicons-arrow-path',
})

const emit = defineEmits<{ done: [] }>()

const progress = ref(0)
const step = ref(props.steps[0] ?? '')
let timer: ReturnType<typeof setInterval> | undefined

const TICK = 50

onMounted(() => {
  const perTick = 100 / Math.max(1, props.duration / TICK)
  timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + perTick)
    if (props.steps.length) {
      const index = Math.min(props.steps.length - 1, Math.floor(progress.value / (100 / props.steps.length)))
      step.value = props.steps[index]
    }
    if (progress.value >= 100) {
      clearInterval(timer)
      timer = undefined
      emit('done')
    }
  }, TICK)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
    <div class="text-center">
      <UIcon :name="icon" class="mx-auto mb-4 h-16 w-16 animate-spin text-primary-500" />
      <h2 class="mb-2 text-2xl font-semibold">
        {{ title }}
      </h2>
      <p v-if="message" class="text-gray-600 dark:text-gray-400">
        {{ message }}
      </p>

      <div class="mx-auto mt-6 max-w-md">
        <UProgress :value="progress" class="w-64" />
        <p v-if="step" class="mt-2 text-sm text-gray-500">
          {{ step }}
        </p>
      </div>
    </div>
  </div>
</template>
