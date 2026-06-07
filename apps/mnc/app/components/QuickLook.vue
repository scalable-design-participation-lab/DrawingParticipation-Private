<script setup lang="ts">
import { computed, type PropType } from 'vue'

interface MarkerPosition {
  x: number
  y: number
}

const props = defineProps({
  markerPosition: {
    type: Object as PropType<MarkerPosition>,
    default: () => ({ x: 0, y: 0 }),
  },
  title: {
    type: String,
    default: 'Title',
  },
  datePublished: {
    type: [String, Number],
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  imagePath: {
    type: String,
    default: '',
  },
  caption: {
    type: [String, Array] as PropType<string | string[]>,
    default: '',
  },
  primaryTag: {
    type: String,
    default: '',
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
  floating: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['click-expand', 'click-close', 'click-previous', 'click-next'])

const normalizedCaption = computed(() => {
  if (Array.isArray(props.caption)) {
    return props.caption[0] || ''
  }

  return props.caption
})

const formattedDate = computed(() => String(props.datePublished || ''))

</script>

<template>
  <GeneralizedQuickLook
    :marker-position="props.markerPosition"
    :floating="props.floating"
    :show-previous-arrow="props.showPreviousArrow"
    :show-next-arrow="props.showNextArrow"
    :show-expand="props.showExpand"
    @click-expand="emit('click-expand')"
    @click-close="emit('click-close')"
    @click-previous="emit('click-previous')"
    @click-next="emit('click-next')"
  >
    <template #quickBody>
      <div class="px-4 pb-3 space-y-3">
        <span v-if="props.primaryTag" >
          <UBadge color = "mnc_tag1" class="rounded-xl">
            <p class="text-sm text-black">{{ props.primaryTag }}</p>
          </UBadge>
        </span>
      </div>
      <div class="px-4 pb-3 space-y-3">
        <h2 class="font-semibold leading-tight text-black dark:text-white">
          {{ props.title }}
        </h2>

        <div class="flex flex-wrap gap-1.5">
          <span
            v-if="formattedDate"
          >
            <UBadge color="info" variant="outline" class="rounded-sm">{{ formattedDate }}</UBadge>
          </span>
          <span
            v-if="props.location"
          >
            <UBadge color="info" variant="outline" class="rounded-sm">
            {{ props.location }} </UBadge>
          </span>
        </div>

        <div class="h-40 w-full overflow-hidden rounded-lg bg-teal-50">
          <img
            v-if="props.imagePath"
            :src="props.imagePath"
            :alt="props.title"
            class="h-full w-full object-cover"
          >
          <div
            v-else
            class="flex h-full w-full items-center justify-center px-2 text-center text-xs text-teal-700"
          >
            {{ normalizedCaption || 'No image available' }}
          </div>
        </div>
      </div>
    </template>
  </GeneralizedQuickLook>
</template>