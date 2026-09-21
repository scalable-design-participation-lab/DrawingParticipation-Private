<script setup lang="ts">
/** CSS grid with enumerated columns: `cols` on phones, `colsMd` from the md breakpoint up. */
const props = withDefaults(defineProps<{
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  as?: string
}>(), {
  cols: 1,
  colsMd: undefined,
  gap: 'md',
  as: 'div',
})

const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }
const COLS_MD = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' }
const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-8', xl: 'gap-12' }

const classes = ['grid', COLS[props.cols], props.colsMd ? COLS_MD[props.colsMd] : '', GAP[props.gap]]
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
