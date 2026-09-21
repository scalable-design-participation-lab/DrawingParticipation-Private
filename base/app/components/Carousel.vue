<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * A strip of images with arrows, a counter and dots. Every label is a prop so
 * a page can translate them, and the empty state says what it is missing
 * rather than showing an empty box.
 *
 * A URL that fails to load is dropped, so the "3 / 5" counter can never
 * promise a slide the viewer cannot actually see.
 */
const props = withDefaults(defineProps<{
  images?: string[]
  caption?: string
  alt?: string
  height?: 'sm' | 'md' | 'lg'
  emptyTitle?: string
  emptyText?: string
  prevLabel?: string
  nextLabel?: string
}>(), {
  images: () => [],
  caption: '',
  alt: '',
  height: 'md',
  emptyTitle: '',
  emptyText: '',
  prevLabel: 'Previous',
  nextLabel: 'Next',
})

const HEIGHT = { sm: 'h-56', md: 'h-72', lg: 'h-96' }

const current = ref(0)
const broken = ref<Set<string>>(new Set())

// A different set of photos starts again from the first one.
watch(() => props.images, () => {
  current.value = 0
  broken.value = new Set()
})

const slides = computed(() => [...new Set(props.images)].filter(url => url && !broken.value.has(url)))
const multiple = computed(() => slides.value.length > 1)

function onError(url: string) {
  broken.value = new Set(broken.value).add(url)
  if (current.value >= slides.value.length) {
    current.value = 0
  }
}

function step(by: number) {
  current.value = (current.value + by + slides.value.length) % slides.value.length
}
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5" :class="HEIGHT[height]">
    <template v-if="slides.length">
      <!-- object-contain: phone photos are mostly portrait, and cover crops the
           subject away. The container colour acts as the letterbox. -->
      <img
        :src="slides[current]"
        :alt="alt"
        decoding="async"
        class="h-full w-full object-contain"
        @error="onError(slides[current])"
      >

      <template v-if="multiple">
        <button
          type="button"
          :aria-label="prevLabel"
          class="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          @click.stop="step(-1)"
        >
          <UIcon name="i-heroicons-chevron-left" class="h-5 w-5" />
        </button>
        <button
          type="button"
          :aria-label="nextLabel"
          class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          @click.stop="step(1)"
        >
          <UIcon name="i-heroicons-chevron-right" class="h-5 w-5" />
        </button>

        <div class="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
          {{ current + 1 }} / {{ slides.length }}
        </div>

        <div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          <button
            v-for="(_, i) in slides"
            :key="i"
            type="button"
            :aria-label="`${i + 1}`"
            class="h-1.5 rounded-full transition-all"
            :class="i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/60'"
            @click.stop="current = i"
          />
        </div>
      </template>

      <div
        v-if="caption"
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs text-white"
        :class="{ 'pb-5': multiple }"
      >
        {{ caption }}
      </div>
    </template>

    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-300 px-3 text-center dark:border-zinc-700"
    >
      <UIcon name="i-heroicons-photo" class="mb-1 h-8 w-8 text-gray-400" />
      <p v-if="emptyTitle" class="text-sm font-medium text-gray-500 dark:text-gray-300">
        {{ emptyTitle }}
      </p>
      <p v-if="emptyText" class="text-xs text-gray-400 dark:text-gray-500">
        {{ emptyText }}
      </p>
    </div>
  </div>
</template>
