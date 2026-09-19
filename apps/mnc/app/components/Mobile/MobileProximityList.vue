<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toLonLat } from 'ol/proj'
import { useCatalog } from '../../composables/catalog'
import type { Entry } from '../../composables/catalog'
import { categoryMeta } from '../../composables/categoryMeta'
import { useLocalizedEntry } from '../../composables/useLocalizedEntry'

/** Mobile list: nearest first when the user shares their location, newest first otherwise. */
const props = withDefaults(defineProps<{ features?: Entry[] }>(), { features: () => [] })
const emit = defineEmits<{ select: [entry: Entry] }>()

const { t } = useI18n()
const { lf } = useLocalizedEntry()
const { entries } = useCatalog(() => props.features, () => [])

const userLonLat = ref<[number, number] | null>(null)
onMounted(() => {
  if (!import.meta.client || !navigator.geolocation) {
    return
  }
  navigator.geolocation.getCurrentPosition(
    pos => (userLonLat.value = [pos.coords.longitude, pos.coords.latitude]),
    () => {},
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
  )
})

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function distanceKm(entry: Entry) {
  if (!userLonLat.value) {
    return null
  }
  return haversineKm(userLonLat.value, toLonLat(entry.coordinates) as [number, number])
}

function distanceLabel(entry: Entry) {
  const d = distanceKm(entry)
  return d == null ? '' : t('list.kmAway', { d: d < 10 ? d.toFixed(1) : String(Math.round(d)) })
}

const search = ref('')
const sorted = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = entries.value.filter(f => !q
    || (f.comment || '').toLowerCase().includes(q)
    || lf(f.properties, 'title', '').toLowerCase().includes(q)
    || (f.properties?.location || '').toLowerCase().includes(q)
    || (f.properties?.primaryTag || '').toLowerCase().includes(q))
  if (userLonLat.value) {
    return list.sort((a, b) => (distanceKm(a) ?? Infinity) - (distanceKm(b) ?? Infinity))
  }
  return list.sort((a, b) => String(b.properties?.date ?? '').localeCompare(String(a.properties?.date ?? '')))
})
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center safe-bottom">
    <UCard
      class="pointer-events-auto w-full max-w-sm touch-manipulation shadow-xl"
      style="max-height: 60dvh;"
      :ui="{ base: 'overflow-hidden', rounded: 'rounded-t-3xl rounded-b-none', body: { padding: 'p-0' }, header: { padding: 'px-4 pt-3 pb-2' } }"
    >
      <template #header>
        <div class="flex flex-col items-center gap-2">
          <div class="h-1 w-10 rounded-full bg-gray-300" />
          <p class="w-full text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ userLonLat ? $t('list.nearest') : $t('list.all') }} <span class="text-gray-400">· {{ sorted.length }}</span>
          </p>
          <UInput v-model="search" icon="i-heroicons-magnifying-glass" :placeholder="$t('list.search')" :ui="{ rounded: 'rounded-full' }" class="w-full" />
        </div>
      </template>
      <div class="overflow-y-auto" style="max-height: calc(60dvh - 140px);">
        <button
          v-for="entry in sorted"
          :key="entry.id"
          type="button"
          class="flex w-full items-center gap-4 border-b border-gray-100 px-5 py-4 text-left hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
          @click="emit('select', entry)"
        >
          <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" :style="{ border: `2.5px solid ${categoryMeta(entry.properties?.primaryTag).color}`, background: 'rgba(24,24,27,0.04)' }">
            <UIcon :name="categoryMeta(entry.properties?.primaryTag).icon" class="h-5 w-5" :style="{ color: categoryMeta(entry.properties?.primaryTag).color }" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {{ lf(entry.properties, 'title', entry.comment) }}
            </p>
            <p class="mt-0.5 truncate text-xs text-gray-400">
              {{ distanceLabel(entry) || entry.properties?.location || '' }}
            </p>
          </div>
        </button>
        <p v-if="sorted.length === 0" class="py-8 text-center text-sm text-gray-400">
          {{ search.trim() ? $t('list.empty', { q: search }) : $t('list.emptyList') }}
        </p>
      </div>
    </UCard>
  </div>
</template>
