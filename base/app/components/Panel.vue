<script setup lang="ts">
/** A box. `variant` is the look, `padding` the inner space; nothing else to decide. */
const props = withDefaults(defineProps<{
  variant?: 'plain' | 'card' | 'outline' | 'paper'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Constrain the width to a readable measure. */
  measure?: 'none' | 'prose' | 'wide'
  as?: string
}>(), {
  variant: 'plain',
  padding: 'none',
  measure: 'none',
  as: 'div',
})

const VARIANT = {
  plain: '',
  card: 'rounded-xl bg-white shadow-md dark:bg-neutral-900',
  outline: 'rounded-xl border border-zinc-200 dark:border-zinc-600',
  // The Figma "ink on paper" box (chapultepec).
  paper: 'border border-black bg-white',
}
const PADDING = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-8' }
const MEASURE = { none: '', prose: 'md:w-9/12 md:max-w-[1100px]', wide: 'max-w-[1800px]' }

const classes = [VARIANT[props.variant], PADDING[props.padding], MEASURE[props.measure]]
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
