<script setup lang="ts">
import { computed } from 'vue'

/**
 * Results as data: group `items` by `by` and show a bar per group with the
 * count, or the sum / average of `valueKey`. The spec's aggregation.
 */
const props = withDefaults(defineProps<{
  items?: unknown[]
  /** Field to group by. */
  by: string
  mode?: 'count' | 'sum' | 'avg'
  /** Numeric field for sum / avg. */
  valueKey?: string
  /** value -> label. */
  labels?: Record<string, string>
  empty?: string
  decimals?: number
}>(), {
  items: () => [],
  mode: 'count',
  valueKey: '',
  labels: () => ({}),
  empty: '',
  decimals: 1,
})

interface Row { key: string, label: string, value: number, n: number }

const rows = computed<Row[]>(() => {
  const groups = new Map<string, { sum: number, n: number }>()
  for (const item of props.items) {
    const row = (item as Record<string, unknown>) ?? {}
    const key = String(row[props.by] ?? '')
    const raw = props.valueKey ? Number(row[props.valueKey]) : 1
    const g = groups.get(key) ?? { sum: 0, n: 0 }
    g.n += 1
    g.sum += Number.isFinite(raw) ? raw : 0
    groups.set(key, g)
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, label: props.labels[key] ?? (key || '—'), n: g.n, value: props.mode === 'count' ? g.n : props.mode === 'sum' ? g.sum : g.n ? g.sum / g.n : 0 }))
    .sort((a, b) => b.value - a.value)
})
const max = computed(() => Math.max(...rows.value.map(r => r.value), 0))
// Grouped thousands, and no more decimals than asked for.
const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: Number.isInteger(v) ? 0 : props.decimals })
</script>

<template>
  <p v-if="!rows.length && empty" class="text-sm text-gray-500">
    {{ empty }}
  </p>
  <div v-else class="space-y-2">
    <div v-for="row in rows" :key="row.key">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="truncate">{{ row.label }}</span>
        <span class="shrink-0 tabular-nums text-gray-500">{{ fmt(row.value) }}<span v-if="mode !== 'count'" class="ml-1.5 text-xs opacity-70">n={{ row.n }}</span></span>
      </div>
      <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div class="h-full rounded-full bg-primary-500" :style="{ width: `${max ? (row.value / max) * 100 : 0}%` }" />
      </div>
    </div>
  </div>
</template>
