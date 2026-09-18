<script setup lang="ts">
/** An image with enumerated width and corner options. */
const props = withDefaults(defineProps<{
  src: string
  alt?: string
  width?: 'auto' | 'full' | 'half' | 'third' | 'two-thirds'
  rounded?: boolean
  /** Wrap the image in a link. */
  href?: string
}>(), {
  alt: '',
  width: 'auto',
  rounded: false,
  href: '',
})

const WIDTH = { 'auto': '', 'full': 'w-full', 'half': 'w-1/2', 'third': 'w-1/3', 'two-thirds': 'w-7/12' }
const classes = [WIDTH[props.width], props.rounded ? 'rounded-md' : '']
</script>

<template>
  <a v-if="href" :href="href" target="_blank" rel="noopener">
    <img :src="src" :alt="alt" :class="classes">
  </a>
  <img v-else :src="src" :alt="alt" :class="classes">
</template>
