<script setup lang="ts">
import { computed } from 'vue'

/**
 * An icon with the same enumerated size / tone vocabulary as Text. Registered
 * for specs as "Icon"; the file is NOT called Icon.vue because Nuxt would then
 * auto-import it as the global <Icon>, which is what Nuxt UI's UIcon renders
 * internally — the component would recurse into itself.
 */
const props = withDefaults(defineProps<{
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'default' | 'muted' | 'accent' | 'inverse'
}>(), {
  size: 'md',
  tone: 'default',
})

const SIZE = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7', xl: 'h-10 w-10' }
const TONE = { default: '', muted: 'text-gray-500 dark:text-gray-400', accent: 'text-primary-500', inverse: 'text-white dark:text-black' }

const classes = computed(() => [SIZE[props.size], TONE[props.tone], 'shrink-0'])
</script>

<template>
  <UIcon :name="name" :class="classes" />
</template>
