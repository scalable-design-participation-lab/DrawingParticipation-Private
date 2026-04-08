<!--
 * Quick Loop Component
 *
 * Shows card on background map. Can have arrows and expand buttons in header.
 *
 -->

<script setup lang="ts">
import { computed, ref } from 'vue'
import type Feature from 'ol/Feature'
import { useMapStore } from '../stores/map'

interface MarkerPosition {
  x: number
  y: number
}

const props = defineProps({
  markerPosition: {
    type: Object as PropType<MarkerPosition>,
    required: true,
  },
  showNextArrow: {
    type: Boolean,
    default: undefined,
  },
  showPreviousArrow: {
    type: Boolean,
    default: undefined,
  },
  showExpand: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['click-previous', 'click-next', 'click-close', 'click-expand'])

const positionStyle = computed(() => {
  const { x, y } = props.markerPosition
  const offset = 0
  const infoWidth = 280
  const infoHeight = 250

  let left = x + offset
  let top = y + offset

  if (typeof window !== 'undefined') {
    const { innerWidth, innerHeight } = window
    if (left + infoWidth > innerWidth) {
      left = x - infoWidth - offset
    }
    if (top + infoHeight > innerHeight) {
      top = y - infoHeight - offset
    }
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

const cardStyle = {
  base: 'bg-white dark:bg-gray-800 shadow-lg',
  body: 'p-0',
  header: 'p-3 border-b border-gray-200 dark:border-gray-700',
}
</script>

<template>
  <UCard
    class="w-[280px] z-[2000] pointer-events-auto fixed"
    :ui="cardStyle"
    :style="positionStyle"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex gap-2">
          <UButton
            v-if="showPreviousArrow"
            data-testid="previous-sensor"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            @click="$emit('click-previous')"
          />
          <UButton
            v-if="showNextArrow"
            data-testid="next-sensor"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-right"
            @click="$emit('click-next')"
          />
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="showExpand"
            data-testid="open-detail"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-top-right-on-square"
            @click="$emit('click-expand')"
          />
          <UButton
            data-testid="close-info"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="$emit('click-close')"
          />
        </div>
      </div>
    </template>
    <slot name="quickBody" />
  </UCard>
</template>
