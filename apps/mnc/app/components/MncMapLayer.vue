<script setup lang="ts">
import { computed } from 'vue'
import { categoryMeta } from '../composables/categoryMeta'
import { useCatalog } from '../composables/catalog'
import type { Entry } from '../composables/catalog'

/** Category-colored pins, clustered within 250 m so overlapping entries stay tappable. */
const props = withDefaults(defineProps<{ features?: Entry[], visibleTags?: string[] }>(), {
  features: () => [],
  visibleTags: () => [],
})

const emit = defineEmits<{ select: [entry: Entry] }>()

const { visible } = useCatalog(() => props.features, () => props.visibleTags)
const CLUSTER_THRESHOLD_M = 250

interface Cluster { id: string, centroid: [number, number], members: Entry[] }

const clusters = computed<Cluster[]>(() => {
  const list = visible.value.filter(f => Array.isArray(f.coordinates) && f.coordinates.length === 2)
  const visited = Array.from({ length: list.length }).fill(false)
  const out: Cluster[] = []
  for (let i = 0; i < list.length; i++) {
    if (visited[i]) {
      continue
    }
    const members: Entry[] = []
    const queue = [i]
    while (queue.length) {
      const idx = queue.shift()!
      if (visited[idx]) {
        continue
      }
      visited[idx] = true
      members.push(list[idx])
      const [ax, ay] = list[idx].coordinates
      for (let j = 0; j < list.length; j++) {
        const [bx, by] = list[j].coordinates
        if (!visited[j] && Math.hypot(ax - bx, ay - by) < CLUSTER_THRESHOLD_M) {
          queue.push(j)
        }
      }
    }
    out.push({
      id: members.map(m => m.id).sort().join('-'),
      centroid: [members.reduce((s, f) => s + f.coordinates[0], 0) / members.length, members.reduce((s, f) => s + f.coordinates[1], 0) / members.length],
      members,
    })
  }
  return out
})
</script>

<template>
  <ol-overlay v-for="cluster in clusters" :key="cluster.id" :position="cluster.centroid" positioning="bottom-center">
    <div class="mnc-pins">
      <button
        v-for="member in cluster.members"
        :key="member.id"
        type="button"
        class="mnc-pin"
        :class="{ 'mnc-pin--pending': member.properties?.pending }"
        :style="{ '--pin-color': categoryMeta(member.properties?.primaryTag).color }"
        :aria-label="member.properties?.pending ? `${member.comment || 'Map pin'} — pending review` : (member.comment || 'Map pin')"
        @click.stop="emit('select', member)"
      >
        <UIcon :name="categoryMeta(member.properties?.primaryTag).icon" class="mnc-pin__icon" :style="{ color: categoryMeta(member.properties?.primaryTag).color }" />
        <span v-if="member.properties?.pending" class="mnc-pin__pending" title="Pending review" />
      </button>
    </div>
  </ol-overlay>
</template>

<style scoped>
.mnc-pins {
  display: inline-flex;
  align-items: flex-end;
  gap: 4px;
  pointer-events: auto;
}
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
  margin-bottom: 8px;
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.35),
    0 0 12px -2px var(--pin-color);
  transition: transform 0.15s ease;
}
.mnc-pin:hover {
  transform: translateY(-2px) scale(1.06);
}
.mnc-pin::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 9px solid var(--pin-color);
}
.mnc-pin__icon {
  width: 22px;
  height: 22px;
  pointer-events: none;
}
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
