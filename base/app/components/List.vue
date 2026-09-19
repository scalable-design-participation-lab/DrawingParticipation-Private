<script setup lang="ts">
/**
 * Repeat the `item` template for every row: a stack or a grid. The spec
 * side of loops, since JSON cannot iterate on its own.
 */
withDefaults(defineProps<{
  items?: unknown[]
  layout?: 'stack' | 'grid'
  cols?: 1 | 2 | 3 | 4
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg'
  /** Shown when there are no items. */
  empty?: string
}>(), {
  items: () => [],
  layout: 'stack',
  cols: 3,
  gap: 'md',
  empty: '',
})

const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-8' }
const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }
</script>

<template>
  <p v-if="!items.length && empty" class="text-sm text-gray-500">
    {{ empty }}
  </p>
  <div v-else :class="[GAP[gap], layout === 'grid' ? ['grid', COLS[cols]] : 'flex flex-col']">
    <slot v-for="(item, i) in items" :key="i" name="item" :item="item" :index="i" />
  </div>
</template>
