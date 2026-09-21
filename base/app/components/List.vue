<script setup lang="ts">
import { computed } from 'vue'

/**
 * Repeat the `item` template for every row: a stack or a grid. The spec
 * side of loops, since JSON cannot iterate on its own. Filtering, search,
 * sort and a limit are props so a page can bind them to its state.
 */
const props = withDefaults(defineProps<{
  /**
   * Rows to repeat over. A plain object is repeated over its entries
   * instead, each one arriving as { key, value } -- how a spec walks a map
   * (locale -> translation, label -> count) without an array to hand.
   */
  items?: unknown[] | Record<string, unknown>
  layout?: 'stack' | 'grid'
  cols?: 1 | 2 | 3 | 4
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg'
  /** Shown when there are no items. */
  empty?: string
  /** Keep rows whose `filterKey` equals `filterValue` (empty value = keep all). */
  filterKey?: string
  filterValue?: unknown
  /**
   * Keep rows whose `filterKey` is in this set: a list of values, or the
   * `{ value: boolean }` map a checkbox group or an IconBar emits. Omit it to
   * keep all, which is what an empty selection means everywhere else.
   */
  filterIn?: string[] | Record<string, boolean> | null
  /** Case-insensitive text search over `searchKeys` (all string fields when omitted). */
  search?: string
  searchKeys?: string[]
  sortBy?: string
  sortDesc?: boolean
  /**
   * Group rows by this key. The item template then repeats per group and
   * receives `{ value, count, rows }`, so a nested List over `$item.rows`
   * renders what is inside one.
   */
  groupBy?: string
  /** Groups that come first, in this order; the rest follow as they appear. */
  groupOrder?: string[]
  /**
   * Sort by how far each row is from this point, nearest first, and give the
   * item template a `distanceKm`. Bind it to the state `watchLocation` fills,
   * and it falls back to `sortBy` while the reader has not shared a location.
   */
  near?: [number, number] | null
  /** Where a row keeps its position, as [lon, lat] unless `coordinates` says otherwise. */
  coordinatesKey?: string
  coordinates?: 'lonlat' | 'webmercator'
  limit?: number
}>(), {
  items: () => [],
  layout: 'stack',
  cols: 3,
  gap: 'md',
  empty: '',
  filterKey: '',
  filterValue: '',
  filterIn: null,
  search: '',
  searchKeys: () => [],
  sortBy: '',
  sortDesc: false,
  groupBy: '',
  groupOrder: () => [],
  near: null,
  coordinatesKey: 'coordinates',
  coordinates: 'lonlat',
  limit: 0,
})

const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-8' }
const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }

/** A dotted key reads into nested rows, e.g. "properties.title". */
function field(row: unknown, key: string) {
  return key.split('.').reduce<unknown>((value, part) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined), row)
}

const HALF_WORLD = 20037508.34

/** Web Mercator metres -> [lon, lat], so a map's own coordinates work as they are. */
function lonLat(point: number[]): [number, number] {
  if (props.coordinates === 'lonlat') {
    return [point[0], point[1]]
  }
  const lon = (point[0] / HALF_WORLD) * 180
  const lat = (Math.atan(Math.exp(((point[1] / HALF_WORLD) * 180 * Math.PI) / 180)) * 360) / Math.PI - 90
  return [lon, lat]
}

/** Great-circle distance in km. */
function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function distanceFrom(origin: [number, number], row: unknown) {
  const point = field(row, props.coordinatesKey)
  if (!Array.isArray(point) || point.length < 2) {
    return null
  }
  return haversineKm(origin, lonLat(point as number[]))
}

// An object arrives as its entries: a value that is itself a row is spread so
// the template reads it normally, anything else lands in `value`. Both keep
// `key`, which is what the template usually wants to show.
const entries = computed<unknown[]>(() => (Array.isArray(props.items)
  ? props.items
  : Object.entries(props.items ?? {}).map(([key, value]) => (value && typeof value === 'object' && !Array.isArray(value)
      ? { key, ...(value as Record<string, unknown>) }
      : { key, value }))))

const rows = computed(() => {
  let out = entries.value
  if (props.filterKey && props.filterValue !== '' && props.filterValue != null) {
    out = out.filter(row => field(row, props.filterKey) === props.filterValue)
  }
  if (props.filterKey && props.filterIn) {
    const allowed = Array.isArray(props.filterIn)
      ? new Set(props.filterIn)
      : new Set(Object.entries(props.filterIn).filter(([, on]) => on).map(([value]) => value))
    if (allowed.size) {
      out = out.filter(row => allowed.has(String(field(row, props.filterKey))))
    }
  }
  const q = props.search.trim().toLowerCase()
  if (q) {
    out = out.filter((row) => {
      const values = props.searchKeys.length ? props.searchKeys.map(k => field(row, k)) : Object.values((row as Record<string, unknown>) ?? {})
      return values.some(v => typeof v === 'string' && v.toLowerCase().includes(q))
    })
  }
  // Nearest first wins over `sortBy`, but only once there is a location.
  if (props.near) {
    const origin = props.near
    out = [...out]
      .map(row => ({ row, km: distanceFrom(origin, row) }))
      .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
      .map(({ row, km }) => (km == null ? row : { ...(row as Record<string, unknown>), distanceKm: km }))
  }
  else if (props.sortBy) {
    const key = props.sortBy
    out = [...out].sort((a, b) => {
      const x = field(a, key) as string | number
      const y = field(b, key) as string | number
      return (x < y ? -1 : x > y ? 1 : 0) * (props.sortDesc ? -1 : 1)
    })
  }
  if (props.groupBy) {
    const groups = new Map<string, unknown[]>()
    for (const value of props.groupOrder) {
      groups.set(value, [])
    }
    for (const row of out) {
      const key = String(field(row, props.groupBy) ?? '')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(row)
    }
    out = [...groups]
      .filter(([, rows]) => rows.length)
      .map(([value, rows]) => ({ value, count: rows.length, rows }))
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
