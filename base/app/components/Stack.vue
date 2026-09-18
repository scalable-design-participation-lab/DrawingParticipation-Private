<script setup lang="ts">
/** Flex container with enumerated spacing, so layout is a choice, not a class string. */
const props = withDefaults(defineProps<{
  direction?: 'row' | 'column'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  /** Stack rows on phones, side by side from `md` up. */
  responsive?: boolean
  as?: string
}>(), {
  direction: 'column',
  gap: 'md',
  align: 'stretch',
  justify: 'start',
  wrap: false,
  responsive: false,
  as: 'div',
})

// Static maps so Tailwind can see every class.
const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-8', xl: 'gap-12' }
const ALIGN = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch', baseline: 'items-baseline' }
const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' }
const DIRECTION = { row: 'flex-row', column: 'flex-col' }

const classes = [
  'flex',
  props.responsive ? 'flex-col md:flex-row' : DIRECTION[props.direction],
  GAP[props.gap],
  ALIGN[props.align],
  JUSTIFY[props.justify],
  props.wrap ? 'flex-wrap' : '',
]
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
