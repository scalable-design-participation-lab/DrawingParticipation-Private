<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Feature } from '@base/stores/types/store'
import healthIcon from '@base/assets/icons/Health.svg'
import transportIcon from '@base/assets/icons/Transportation.svg'
import connectivityIcon from '@base/assets/icons/Connectivity.svg'
import artIcon from '@base/assets/icons/Art.svg'
import communityIcon from '@base/assets/icons/Community.svg'
import { useFilterStore } from '../stores/filter'
import { categoryMeta } from '../composables/categoryMeta'

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

// Case studies matching the active theme filter (so a tag click / theme toggle
// narrows this list too), filtered by the search query, sorted A→Z by title.
const items = computed<Feature[]>(() => {
  const q = search.value.trim().toLowerCase()
  const all = [...filterStore.visibleFeatures].sort((a, b) =>
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

// Category chip: tinted background in both themes, with the darkened ink on the
// light card and the vivid color on the dark card so the label stays legible.
const colorMode = useColorMode()
function tagChipStyle(tag: string) {
  const m = categoryMeta(tag)
  return {
    backgroundColor: `${m.color}22`,
    color: colorMode.value === 'dark' ? m.color : m.ink,
  }
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
  <AppModal max-width="max-w-5xl" @close="filterStore.toggleList()">
    <template #header>
      <div class="min-w-0 flex-1">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ $t('list.title') }}
          <span class="font-normal text-gray-400">({{ items.length }})</span>
        </h2>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          :placeholder="$t('list.search')"
          :ui="{ rounded: 'rounded-full' }"
          class="mt-3"
        />
      </div>
    </template>

    <p v-if="!items.length" class="py-12 text-center text-sm text-gray-400">
      {{ $t('list.empty', { q: search }) }}
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
                class="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                :style="tagChipStyle(primaryTag(feature))"
              >
                <UIcon :name="categoryMeta(primaryTag(feature)).icon" class="h-3 w-3" />
                {{ primaryTag(feature) }}
              </span>
              <p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                {{ feature.comment || $t('list.untitled') }}
              </p>
              <p v-if="itemMeta(feature)" class="mt-auto truncate text-xs text-gray-400">
                {{ itemMeta(feature) }}
              </p>
            </div>
          </button>
        </div>
  </AppModal>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
