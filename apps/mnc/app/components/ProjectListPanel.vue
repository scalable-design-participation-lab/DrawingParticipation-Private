<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Feature } from '@base/stores/types/store'
import healthIcon from '@base/assets/icons/Health.svg'
import transportIcon from '@base/assets/icons/Transportation.svg'
import connectivityIcon from '@base/assets/icons/Connectivity.svg'
import artIcon from '@base/assets/icons/Art.svg'
import communityIcon from '@base/assets/icons/Community.svg'
import { useFilterStore } from '../stores/filter'

const filterStore = useFilterStore()
const search = ref('')

const ICONS: Record<string, string> = {
  'Health & Crisis Response': healthIcon,
  'Transportation & Mobility': transportIcon,
  'Digital Access & Connectivity': connectivityIcon,
  'Community Mapping & Visibility': communityIcon,
  'Art & Cultural Expression': artIcon,
}

function categoryIcon(tag: string | undefined): string | null {
  return tag ? ICONS[tag] ?? null : null
}

// All case studies (curated + user-submitted), filtered by the search query,
// sorted alphabetically by title.
const items = computed<Feature[]>(() => {
  const q = search.value.trim().toLowerCase()
  const all = [...filterStore.mncFeatures].sort((a, b) =>
    (a.comment || '').localeCompare(b.comment || ''),
  )
  if (!q)
    return all
  return all.filter((f) => {
    const p = (f.properties as any) ?? {}
    return (f.comment || '').toLowerCase().includes(q)
      || (p.location || '').toLowerCase().includes(q)
      || (p.primaryTag || '').toLowerCase().includes(q)
  })
})

function coverImage(feature: Feature): string | null {
  const photos = (feature.properties as any)?.photos
  return Array.isArray(photos) && photos.length ? photos[0] : null
}

function primaryTag(feature: Feature): string {
  return (feature.properties as any)?.primaryTag || ''
}

function itemMeta(feature: Feature): string {
  const p = (feature.properties as any) ?? {}
  const parts: string[] = []
  if (p.location)
    parts.push(p.location)
  if (p.date)
    parts.push(String(p.date))
  return parts.join(' · ')
}

function select(feature: Feature) {
  filterStore.selectFeature(feature)
  filterStore.toggleList()
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="filterStore.toggleList()"
  >
    <div
      class="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900"
    >
      <!-- Header -->
      <div class="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            All Solutions
            <span class="font-normal text-gray-400">({{ items.length }})</span>
          </h2>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            aria-label="Close"
            :ui="{ rounded: 'rounded-full' }"
            @click="filterStore.toggleList()"
          />
        </div>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search solutions…"
          :ui="{ rounded: 'rounded-full' }"
        />
      </div>

      <!-- Tiled grid -->
      <div class="mnc-grid-scroll flex-1 overflow-y-auto p-6">
        <p v-if="!items.length" class="py-12 text-center text-sm text-gray-400">
          No solutions match “{{ search }}”.
        </p>

        <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="feature in items"
            :key="feature.id"
            type="button"
            class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg dark:border-zinc-700"
            @click="select(feature)"
          >
            <!-- Cover -->
            <div class="relative h-36 overflow-hidden bg-teal-50 dark:bg-teal-950/30">
              <img
                v-if="coverImage(feature)"
                :src="coverImage(feature)!"
                :alt="feature.comment"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-950/30"
              >
                <img
                  v-if="categoryIcon(primaryTag(feature))"
                  :src="categoryIcon(primaryTag(feature))!"
                  :alt="primaryTag(feature)"
                  class="h-10 w-10 object-contain opacity-70"
                />
                <UIcon v-else name="i-heroicons-map-pin" class="h-10 w-10 text-teal-400" />
              </div>
            </div>

            <!-- Body -->
            <div class="flex flex-1 flex-col gap-1.5 p-4">
              <span
                v-if="primaryTag(feature)"
                class="inline-flex w-fit items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
              >
                {{ primaryTag(feature) }}
              </span>
              <p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                {{ feature.comment || 'Untitled' }}
              </p>
              <p v-if="itemMeta(feature)" class="mt-auto truncate text-xs text-gray-400">
                {{ itemMeta(feature) }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mnc-grid-scroll::-webkit-scrollbar {
  width: 10px;
}
.mnc-grid-scroll::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
.mnc-grid-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.45);
  border-radius: 9999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
.mnc-grid-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}
</style>
