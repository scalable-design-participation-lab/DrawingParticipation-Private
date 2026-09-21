<script setup lang="ts">
import { computed } from 'vue'

/**
 * An icon with the same enumerated size / tone vocabulary as Text. Registered
 * for specs as "Icon"; the file is NOT called Icon.vue because Nuxt would then
 * auto-import it as the global <Icon>, which is what Nuxt UI's UIcon renders
 * internally — the component would recurse into itself.
 */
const props = withDefaults(defineProps<{
  /**
   * An icon name, or a value to look up in `icons` when a row decides which
   * icon it gets: bind `$item.category` and give the map once, the same way
   * FeatureLayer and IconBar take theirs.
   */
  name: string
  icons?: Record<string, string>
  /** value -> colour, for the same lookup. A tone is used when there is none. */
  colors?: Record<string, string>
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'default' | 'muted' | 'accent' | 'inverse'
}>(), {
  icons: () => ({}),
  colors: () => ({}),
  size: 'md',
  tone: 'default',
})

const SIZE = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7', xl: 'h-10 w-10' }
const TONE = { default: '', muted: 'text-gray-500 dark:text-gray-400', accent: 'text-primary-500', inverse: 'text-white dark:text-black' }

const icon = computed(() => props.icons[props.name] ?? props.name)
const colour = computed(() => props.colors[props.name])
const classes = computed(() => [SIZE[props.size], colour.value ? '' : TONE[props.tone], 'shrink-0'])
</script>

<template>
  <UIcon :name="icon" :class="classes" :style="colour ? { color: colour } : undefined" />
</template>
