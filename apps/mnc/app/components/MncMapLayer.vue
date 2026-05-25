<script setup lang="ts">
import { computed } from 'vue'
import type { Feature } from '@base/stores/types/store'
import healthIcon from '@base/assets/icons/Health.svg'
import transportIcon from '@base/assets/icons/Transportation.svg'
import connectivityIcon from '@base/assets/icons/Connectivity.svg'
import artIcon from '@base/assets/icons/Art.svg'
import communityIcon from '@base/assets/icons/Community.svg'
import { useFilterStore } from '../stores/filter'

const emit = defineEmits<{
  'toggle-icon-details': [payload: { feature: Feature, markerPosition: { x: number, y: number } }]
}>()

const filterStore = useFilterStore()

// Cluster any features whose centers are within this many EPSG:3857 meters.
const CLUSTER_THRESHOLD_M = 250

const ICONS: Record<string, string> = {
  'Health & Crisis Response': healthIcon,
  'Transportation & Mobility': transportIcon,
  'Digital Access & Connectivity': connectivityIcon,
  'Community Mapping & Visibility': communityIcon,
  'Art & Cultural Expression': artIcon,
}

function iconFor(feature: Feature): string {
  const tag = (feature.properties as any)?.primaryTag
  return ICONS[tag] ?? healthIcon
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
  <template v-for="cluster in clusters" :key="cluster.id">
    <ol-overlay
      :position="cluster.centroid"
      :stop-event="false"
      positioning="center-center"
    >
      <div class="mnc-pin">
        <button
          v-for="member in cluster.members"
          :key="member.id"
          type="button"
          class="mnc-pin__item"
          :aria-label="member.comment || 'Map pin'"
          @click.stop="onPinClick(member, $event)"
        >
          <img
            :src="iconFor(member)"
            :alt="(member.properties as any)?.primaryTag || ''"
            class="mnc-pin__icon"
          />
        </button>
      </div>
    </ol-overlay>
  </template>
</template>

<style scoped>
.mnc-pin {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  border: 2.5px solid transparent;
  background-image:
    linear-gradient(white, white),
    conic-gradient(
      from 0deg,
      #FB6D6D 0deg,
      #57C9C0 90deg,
      #f9d876 180deg,
      #84e8a0 270deg,
      #FB6D6D 360deg
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.mnc-pin__item {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background 0.15s ease;
}

.mnc-pin__item:hover {
  background: #f3f4f6;
}

.mnc-pin__icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
  pointer-events: none;
}
</style>
