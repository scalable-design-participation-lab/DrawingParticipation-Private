<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  images: string[]
  caption?: string
  alt?: string
  height?: string
}>(), {
  caption: '',
  alt: '',
  height: '220px',
})

const current = ref(0)

// Reset to the first slide whenever the image set changes (new project opened).
watch(
  () => props.images,
  () => {
    current.value = 0
  },
)

const hasImages = computed(() => Array.isArray(props.images) && props.images.length > 0)
const multiple = computed(() => props.images.length > 1)

function next() {
  current.value = (current.value + 1) % props.images.length
}
function prev() {
  current.value = (current.value - 1 + props.images.length) % props.images.length
}
</script>

<template>
  <div
    class="relative w-full overflow-hidden rounded-2xl bg-teal-50/60 dark:bg-white/5"
    :style="{ height }"
  >
    <template v-if="hasImages">
      <!-- object-contain: user photos are mostly portrait phone shots — cover
           was cropping away the subject. The container bg acts as letterbox. -->
      <img
        :src="images[current]"
        :alt="alt"
        class="h-full w-full object-contain"
      />

      <!-- Prev / next controls (only when there is more than one photo) -->
      <template v-if="multiple">
        <button
          type="button"
          :aria-label="$t('photo.prevPhoto')"
          class="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          @click.stop="prev"
        >
          <UIcon name="i-heroicons-chevron-left" class="h-5 w-5" />
        </button>
        <button
          type="button"
          :aria-label="$t('photo.nextPhoto')"
          class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          @click.stop="next"
        >
          <UIcon name="i-heroicons-chevron-right" class="h-5 w-5" />
        </button>

        <!-- Slide counter -->
        <div class="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
          {{ current + 1 }} / {{ images.length }}
        </div>

        <!-- Dot indicators -->
        <div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          <button
            v-for="(_, i) in images"
            :key="i"
            type="button"
            :aria-label="$t('photo.goToPhoto', { n: i + 1 })"
            class="h-1.5 rounded-full transition-all"
            :class="i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/60'"
            @click.stop="current = i"
          />
        </div>
      </template>

      <!-- Caption overlay -->
      <div
        v-if="caption"
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs text-white"
        :class="{ 'pb-5': multiple }"
      >
        {{ caption }}
      </div>
    </template>

    <!-- Empty state: dashed placeholder that reads on both light and dark cards -->
    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-teal-200 px-3 text-center dark:border-zinc-700"
    >
      <UIcon name="i-heroicons-photo" class="mb-1 h-8 w-8 text-teal-400 dark:text-teal-500" />
      <p class="text-sm font-medium text-gray-500 dark:text-gray-300">{{ $t('photo.noPhoto') }}</p>
      <p class="text-xs text-gray-400 dark:text-gray-500">{{ $t('photo.beFirst') }}</p>
    </div>
  </div>
</template>
