<script setup lang="ts">
import { ref, type PropType } from 'vue'

interface MarkerPosition {
  x: number
  y: number
}

const props = defineProps({
  markerPosition: {
    type: Object as PropType<MarkerPosition>,
    default: () => ({ x: 0, y: 0 }),
  },
  showPreviousArrow: {
    type: Boolean,
    default: undefined,
  },
  showNextArrow: {
    type: Boolean,
    default: undefined,
  },
  showExpand: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['click-expand', 'click-close', 'click-previous', 'click-next'])

</script>

<template>
  <GeneralizedQuickLook
    :marker-position="props.markerPosition"
    :show-previous-arrow="props.showPreviousArrow"
    :show-next-arrow="props.showNextArrow"
    :show-expand="props.showExpand"
    @click-expand="emit('click-expand')"
    @click-close="emit('click-close')"
    @click-previous="emit('click-previous')"
    @click-next="emit('click-next')"
  >
    <template #quickBody>
      <h1>hi</h1>
    </template>
  </GeneralizedQuickLook>
</template>