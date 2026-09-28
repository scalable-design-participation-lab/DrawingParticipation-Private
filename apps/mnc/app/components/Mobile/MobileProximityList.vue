<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toLonLat } from 'ol/proj'
import type { Feature } from '@base/stores/types/store'
import { useFilterStore } from '../../stores/filter'
import { categoryMeta } from '../../composables/categoryMeta'
import { useLocalizedEntry } from '../../composables/useLocalizedEntry'

const emit = defineEmits<{
  'select-feature': [feature: Feature]
}>()

const { t } = useI18n()
const { lf } = useLocalizedEntry()
const filterStore = useFilterStore()

// The user's location, once granted. null until resolved / if denied.
const userLonLat = ref<[number, number] | null>(null)

onMounted(() => {
  if (!import.meta.client || !navigator.geolocation)
    return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLonLat.value = [pos.coords.longitude, pos.coords.latitude]
    },
    () => {
      // Permission denied / unavailable: fall back to date order, no distances.
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
  )
})

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function distanceKm(feature: Feature): number | null {
  if (!userLonLat.value) return null
  const c = feature.coordinates
  if (!Array.isArray(c) || typeof c[0] !== 'number' || typeof c[1] !== 'number') return null
  const lonLat = toLonLat([c[0], c[1]]) as [number, number]
  return haversineKm(userLonLat.value, lonLat)
}

function distanceLabel(feature: Feature): string {
  const d = distanceKm(feature)
  if (d == null) return ''
  const value = d < 10 ? d.toFixed(1) : String(Math.round(d))
  return t('list.kmAway', { d: value })
}

// Free-text search over the same fields the desktop "All Solutions" panel uses,
// plus the title in the current language so a Spanish/Portuguese search matches.
const search = ref('')

const matchingFeatures = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q)
    return filterStore.mncFeatures
  return filterStore.mncFeatures.filter((f) => {
    const p = (f.properties as any) ?? {}
    return (f.comment || '').toLowerCase().includes(q)
      || lf(p, 'title', '').toLowerCase().includes(q)
      || (p.location || '').toLowerCase().includes(q)
      || (p.primaryTag || '').toLowerCase().includes(q)
  })
})

// Sorted by real proximity when we have the user's location, else by date
// (newest first) as a stable fallback. Uses the de-duplicated catalog.
const sortedFeatures = computed(() => {
  const list = matchingFeatures.value.slice()
  if (userLonLat.value) {
    return list.sort((a, b) => (distanceKm(a) ?? Infinity) - (distanceKm(b) ?? Infinity))
  }
  return list.sort((a, b) => {
    const dateA = String((a.properties as any)?.date ?? '')
    const dateB = String((b.properties as any)?.date ?? '')
    return dateB.localeCompare(dateA)
  })
})
</script>

<template>
  <div class="fixed bottom-24 safe-bottom left-0 right-0 z-40 flex justify-center pointer-events-none">
    <UCard
      class="pointer-events-auto touch-manipulation w-full max-w-sm shadow-xl"
      style="max-height: 60dvh;"
      :ui="{
        base: 'overflow-hidden',
        rounded: 'rounded-t-3xl rounded-b-none',
        body: { padding: 'p-0' },
        header: { padding: 'px-4 pt-3 pb-2' },
      }"
    >
      <template #header>
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-1 bg-gray-300 rounded-full" />
          <p class="w-full text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ userLonLat ? $t('list.nearest') : $t('list.all') }}
            <span class="text-gray-400">· {{ sortedFeatures.length }}</span>
          </p>
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            :placeholder="$t('list.search')"
            :ui="{ rounded: 'rounded-full' }"
            class="w-full"
          />
        </div>
      </template>

      <!-- One scrollable list (no pagination) -->
      <div class="overflow-y-auto" style="max-height: calc(60dvh - 140px);">
        <button
          v-for="feature in sortedFeatures"
          :key="feature.id"
          type="button"
          class="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-zinc-800 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
          @click="emit('select-feature', feature)"
        >
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            :style="{ border: `2.5px solid ${categoryMeta((feature.properties as any)?.primaryTag).color}`, background: 'rgba(24,24,27,0.04)' }"
          >
            <UIcon
              :name="categoryMeta((feature.properties as any)?.primaryTag).icon"
              class="w-5 h-5"
              :style="{ color: categoryMeta((feature.properties as any)?.primaryTag).color }"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white truncate text-sm">{{ lf(feature.properties, 'title', feature.comment) }}</p>
            <p class="text-gray-400 text-xs mt-0.5 truncate">
              <span v-if="distanceLabel(feature)">{{ distanceLabel(feature) }}</span>
              <span v-else>{{ (feature.properties as any)?.location || '' }}</span>
            </p>
          </div>
        </button>

        <p v-if="sortedFeatures.length === 0" class="text-center text-gray-400 py-8 text-sm">
          {{ search.trim() ? $t('list.empty', { q: search }) : $t('list.emptyList') }}
        </p>
      </div>
    </UCard>
  </div>
</template>
