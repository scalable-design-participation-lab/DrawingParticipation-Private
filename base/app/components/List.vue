<script setup lang="ts">
import { computed } from 'vue'

/**
 * Repeat the `item` template for every row: a stack or a grid. The spec
 * side of loops, since JSON cannot iterate on its own. Filtering, search,
 * sort and a limit are props so a page can bind them to its state.
 */
const props = withDefaults(defineProps<{
  items?: unknown[]
  layout?: 'stack' | 'grid'
  cols?: 1 | 2 | 3 | 4
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg'
  /** Shown when there are no items. */
  empty?: string
  /** Keep rows whose `filterKey` equals `filterValue` (empty value = keep all). */
  filterKey?: string
  filterValue?: unknown
  /** Case-insensitive text search over `searchKeys` (all string fields when omitted). */
  search?: string
  searchKeys?: string[]
  sortBy?: string
  sortDesc?: boolean
  limit?: number
}>(), {
  items: () => [],
  layout: 'stack',
  cols: 3,
  gap: 'md',
  empty: '',
  filterKey: '',
  filterValue: '',
  search: '',
  searchKeys: () => [],
  sortBy: '',
  sortDesc: false,
  limit: 0,
})

const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-8' }
const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }

const field = (row: unknown, key: string) => (row as Record<string, unknown>)?.[key]

const rows = computed(() => {
  let out = props.items
  if (props.filterKey && props.filterValue !== '' && props.filterValue != null) {
    out = out.filter(row => field(row, props.filterKey) === props.filterValue)
  }
  const q = props.search.trim().toLowerCase()
  if (q) {
    out = out.filter((row) => {
      const values = props.searchKeys.length ? props.searchKeys.map(k => field(row, k)) : Object.values((row as Record<string, unknown>) ?? {})
      return values.some(v => typeof v === 'string' && v.toLowerCase().includes(q))
    })
  }
  if (props.sortBy) {
    const key = props.sortBy
    out = [...out].sort((a, b) => {
      const x = field(a, key) as string | number
      const y = field(b, key) as string | number
      return (x < y ? -1 : x > y ? 1 : 0) * (props.sortDesc ? -1 : 1)
    })
  }
  return props.limit > 0 ? out.slice(0, props.limit) : out
})
</script>

<template>
  <p v-if="!rows.length && empty" class="text-sm text-gray-500">
    {{ empty }}
  </p>
  <div v-else :class="[GAP[gap], layout === 'grid' ? ['grid', COLS[cols]] : 'flex flex-col']">
    <slot v-for="(item, i) in rows" :key="i" name="item" :item="item" :index="i" />
  </div>
</template>
