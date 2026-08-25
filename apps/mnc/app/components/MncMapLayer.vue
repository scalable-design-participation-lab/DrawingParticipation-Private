<script setup lang="ts">
import { computed } from 'vue'
import type { Feature } from '@base/stores/types/store'
import { useFilterStore } from '../stores/filter'
import { categoryMeta } from '../composables/categoryMeta'

const emit = defineEmits<{
  'toggle-icon-details': [payload: { feature: Feature, markerPosition: { x: number, y: number } }]
}>()

const filterStore = useFilterStore()

// Cluster any features whose centers are within this many EPSG:3857 meters.
const CLUSTER_THRESHOLD_M = 250

// Per-category accent color + glyph, shared with the detail panel and filters.
function metaFor(feature: Feature) {
  return categoryMeta((feature.properties as any)?.primaryTag)
}

interface Cluster {
  id: string
  centroid: [number, number]
  members: Feature[]
}

const clusters = computed<Cluster[]>(() => {
  const features = filterStore.visibleFeatures.filter(
    f => Array.isArray(f.coordinates) && f.coordinates.length === 2,
  ) as Feature[]
  const n = features.length
  const visited = new Array<boolean>(n).fill(false)
  const out: Cluster[] = []

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue
    const memberIdxs: number[] = []
    const queue = [i]
    while (queue.length) {
      const idx = queue.shift()!
      if (visited[idx]) continue
      visited[idx] = true
      memberIdxs.push(idx)
      const [ax, ay] = features[idx].coordinates as [number, number]
      for (let j = 0; j < n; j++) {
        if (visited[j]) continue
        const [bx, by] = features[j].coordinates as [number, number]
        if (Math.hypot(ax - bx, ay - by) < CLUSTER_THRESHOLD_M) queue.push(j)
      }
    }
    const members = memberIdxs.map(idx => features[idx])
    const cx = members.reduce((s, f) => s + (f.coordinates as [number, number])[0], 0) / members.length
    const cy = members.reduce((s, f) => s + (f.coordinates as [number, number])[1], 0) / members.length
    out.push({
      id: members.map(m => m.id).sort().join('-'),
      centroid: [cx, cy],
      members,
    })
  }
  return out
})

function onPinClick(feature: Feature, event: MouseEvent) {
  emit('toggle-icon-details', {
    feature,
    markerPosition: { x: event.clientX, y: event.clientY },
  })
}
</script>

<template>
  <ol-overlay
    v-for="cluster in clusters"
    :key="cluster.id"
    :position="cluster.centroid"
    positioning="bottom-center"
  >
    <div class="mnc-pins">
      <button
        v-for="member in cluster.members"
        :key="member.id"
        type="button"
        class="mnc-pin"
        :class="{ 'mnc-pin--pending': (member.properties as any)?.pending }"
        :style="{ '--pin-color': metaFor(member).color }"
        :aria-label="(member.properties as any)?.pending ? `${member.comment || 'Map pin'} — pending review` : (member.comment || 'Map pin')"
        @click.stop="onPinClick(member, $event)"
      >
        <UIcon
          :name="metaFor(member).icon"
          class="mnc-pin__icon"
          :style="{ color: metaFor(member).color }"
        />
        <!-- Amber marker on pins still awaiting moderator approval (admins only) -->
        <span v-if="(member.properties as any)?.pending" class="mnc-pin__pending" title="Pending review" />
      </button>
    </div>
  </ol-overlay>
</template>

<style scoped>
/* A cluster renders each member as its own category-colored pin, laid out in a
   row so overlapping projects stay individually tappable. */
.mnc-pins {
  display: inline-flex;
  align-items: flex-end;
  gap: 4px;
  pointer-events: auto;
}

/* Category-colored teardrop pin: a ringed circle over a downward tail. The dark
   translucent fill keeps the colored ring + glyph legible on both the light and
   dark basemaps. */
.mnc-pin {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2.5px solid var(--pin-color);
  background: rgba(24, 24, 27, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-bottom: 8px; /* room for the tail */
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.35),
    0 0 12px -2px var(--pin-color);
  transition: transform 0.15s ease;
}

.mnc-pin:hover {
  transform: translateY(-2px) scale(1.06);
}

/* Downward-pointing tail, colored to match the ring. */
.mnc-pin::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 9px solid var(--pin-color);
}

.mnc-pin__icon {
  width: 22px;
  height: 22px;
  pointer-events: none;
}

/* Pins awaiting moderator approval: dashed ring, slightly faded, amber marker.
   Only admins ever load these, so the public never sees the pending state. */
.mnc-pin--pending {
  border-style: dashed;
  opacity: 0.9;
}

.mnc-pin__pending {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid rgba(24, 24, 27, 0.9);
  pointer-events: none;
}
</style>
