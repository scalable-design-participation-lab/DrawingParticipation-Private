<script setup lang="ts">
import { computed } from 'vue'

/** An image with enumerated width and corner options. */
const props = withDefaults(defineProps<{
  src: string
  alt?: string
  width?: 'auto' | 'full' | 'half' | 'third' | 'two-thirds'
  rounded?: boolean
  /** Wrap the image in a link. */
  href?: string
  /**
   * Ask for a derivative that a build step wrote next to the original, e.g.
   * "thumb" turns /photos/a.webp into /photos/a-thumb.webp. Only same-origin
   * paths are rewritten: an uploaded file on someone else's host has no
   * derivative to ask for.
   */
  variant?: string
}>(), {
  alt: '',
  width: 'auto',
  rounded: false,
  href: '',
  variant: '',
})

const WIDTH = { 'auto': '', 'full': 'w-full', 'half': 'w-1/2', 'third': 'w-1/3', 'two-thirds': 'w-7/12' }
const classes = [WIDTH[props.width], props.rounded ? 'rounded-md' : '']

const url = computed(() => (props.variant && props.src.startsWith('/')
  ? props.src.replace(/(\.[a-z0-9]+)$/i, `-${props.variant}$1`)
  : props.src))
</script>

<template>
  <a v-if="href" :href="href" target="_blank" rel="noopener">
    <img :src="url" :alt="alt" :class="classes">
  </a>
  <img v-else :src="url" :alt="alt" :class="classes">
</template>
