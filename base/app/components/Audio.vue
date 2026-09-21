<script setup lang="ts">
import { computed } from 'vue'

/**
 * Plays a recording, or a list of them: the read side of `VoiceRecorder`, for
 * the people who answered by speaking. The browser's own controls, because a
 * custom transport is one more thing to learn and one more thing to break.
 *
 * A source that fails to load is dropped rather than left as a dead player.
 */
const props = withDefaults(defineProps<{
  /** One URL or several; an empty list renders nothing at all. */
  src?: string | string[]
  /** Heading above the players, e.g. a "$t." key for "Voice notes". */
  label?: string
  tone?: 'default' | 'inverse'
}>(), {
  src: () => [],
  label: '',
  tone: 'default',
})

const urls = computed(() => [...new Set([props.src].flat().filter(Boolean))] as string[])
</script>

<template>
  <div v-if="urls.length" class="space-y-2">
    <p v-if="label" class="text-sm font-bold" :class="tone === 'inverse' ? 'text-white' : 'text-gray-900 dark:text-white'">
      {{ label }}
    </p>
    <audio v-for="url in urls" :key="url" :src="url" controls preload="none" class="w-full" />
  </div>
</template>
