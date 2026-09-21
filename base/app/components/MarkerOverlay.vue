<script setup lang="ts">
import { computed } from 'vue'
import { fromLonLat } from 'ol/proj'

/**
 * One HTML overlay per item, placed on the map. Goes in the BackgroundMap
 * "overlays" slot; the `item` slot draws each marker.
 */
const props = withDefaults(defineProps<{
  items?: Record<string, unknown>[]
  /** One item instead of a list (e.g. the selected feature); null renders nothing. */
  item?: Record<string, unknown> | null
  positionKey?: string
  lonLat?: boolean
  positioning?: string
  stopEvent?: boolean
  /**
   * Merge items closer together than this many map units into one overlay, so
   * markers that sit on top of each other stay reachable. The item slot then
   * gets `{ position, members, count }` and draws the group; zero is off.
   */
  cluster?: number
  /** Keep rows whose `filterKey` is in this set, like List's `filterIn`. */
  filterKey?: string
  filterIn?: string[] | Record<string, boolean> | null
}>(), {
  items: () => [],
  item: null,
  positionKey: 'position',
  lonLat: true,
  positioning: 'center-center',
  stopEvent: false,
  cluster: 0,
  filterKey: '',
  filterIn: null,
})

function field(row: unknown, key: string) {
  return key.split('.').reduce<unknown>((value, part) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined), row)
}

const kept = computed(() => {
  const rows = props.item ? [...props.items, props.item] : props.items
  if (!props.filterKey || !props.filterIn) {
    return rows
  }
  const allowed = Array.isArray(props.filterIn)
    ? new Set(props.filterIn)
    : new Set(Object.entries(props.filterIn).filter(([, on]) => on).map(([value]) => value))
  return allowed.size ? rows.filter(row => allowed.has(String(field(row, props.filterKey)))) : rows
})

/**
 * Single-link clustering: anything within `cluster` map units of a member
 * joins the group, so a tight knot of pins becomes one overlay drawn side by
 * side rather than a stack nothing below can be tapped through.
 */
const all = computed(() => {
  const rows = kept.value
  if (!props.cluster) {
    return rows.map(row => ({ ...row, position: row[props.positionKey], members: [row], count: 1 }))
  }
  const points = rows
    .map(row => ({ row, at: field(row, props.positionKey) as number[] }))
    .filter(p => Array.isArray(p.at) && p.at.length === 2)
  const seen = Array.from({ length: points.length }).fill(false) as boolean[]
  const groups: { position: number[], members: Record<string, unknown>[], count: number }[] = []
  for (let i = 0; i < points.length; i++) {
    if (seen[i]) {
      continue
    }
    const members: Record<string, unknown>[] = []
    const queue = [i]
    while (queue.length) {
      const at = queue.shift()!
      if (seen[at]) {
        continue
      }
      seen[at] = true
      members.push(points[at].row)
      for (let j = 0; j < points.length; j++) {
        if (!seen[j] && Math.hypot(points[at].at[0] - points[j].at[0], points[at].at[1] - points[j].at[1]) < props.cluster) {
          queue.push(j)
        }
      }
    }
    groups.push({
      position: [
        members.reduce((sum, m) => sum + (field(m, props.positionKey) as number[])[0], 0) / members.length,
        members.reduce((sum, m) => sum + (field(m, props.positionKey) as number[])[1], 0) / members.length,
      ],
      members,
      count: members.length,
    })
  }
  return groups
})

function positionOf(entry: Record<string, unknown>) {
  const raw = (entry.position ?? field(entry, props.positionKey)) as [number, number]
  return props.lonLat ? fromLonLat(raw) : raw
}
</script>

<template>
  <ol-overlay
    v-for="(entry, i) in all"
    :key="i"
    :position="positionOf(entry)"
    :positioning="positioning"
    :stop-event="stopEvent"
  >
    <slot name="item" :item="entry" :index="i" />
  </ol-overlay>
</template>
