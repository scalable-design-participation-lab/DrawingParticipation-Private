<script setup lang="ts">
import { computed, ref } from 'vue'
import healthIcon from '@base/assets/icons/Health.svg'
import transportIcon from '@base/assets/icons/Transportation.svg'
import connectivityIcon from '@base/assets/icons/Connectivity.svg'
import artIcon from '@base/assets/icons/Art.svg'
import communityIcon from '@base/assets/icons/Community.svg'
import { useCatalog } from '../composables/catalog'
import type { Entry } from '../composables/catalog'
import { categoryMeta } from '../composables/categoryMeta'
import { photoThumb } from '../composables/photoThumb'
import { useLocalizedEntry } from '../composables/useLocalizedEntry'

/** "All solutions": searchable card grid of the visible entries. */
const props = withDefaults(defineProps<{ features?: Entry[], visibleTags?: string[] }>(), {
  features: () => [],
  visibleTags: () => [],
})
const emit = defineEmits<{ select: [entry: Entry], close: [] }>()

const search = ref('')
const { lf, tagLabel } = useLocalizedEntry()
const { visible } = useCatalog(() => props.features, () => props.visibleTags)

const ICONS: Record<string, string> = {
  'Health & Crisis Response': healthIcon,
  'Transportation & Mobility': transportIcon,
  'Digital Access & Connectivity': connectivityIcon,
  'Community Mapping & Visibility': communityIcon,
  'Art & Cultural Expression': artIcon,
}

const items = computed<Entry[]>(() => {
  const q = search.value.trim().toLowerCase()
  const all = [...visible.value].sort((a, b) => (a.comment || '').localeCompare(b.comment || ''))
  if (!q) {
    return all
  }
  return all.filter(f => (f.comment || '').toLowerCase().includes(q)
    || (f.properties?.location || '').toLowerCase().includes(q)
    || (f.properties?.primaryTag || '').toLowerCase().includes(q))
})

const cover = (entry: Entry) => entry.properties?.photos?.[0] ?? null
const tagOf = (entry: Entry) => entry.properties?.primaryTag || ''

const colorMode = useColorMode()
function tagChipStyle(tag: string) {
  const m = categoryMeta(tag)
  return { backgroundColor: `${m.color}22`, color: colorMode.value === 'dark' ? m.color : m.ink }
}

function itemMeta(entry: Entry) {
  const p = entry.properties ?? {}
  return [p.location ? lf(p, 'location', p.location) : '', p.date ? String(p.date) : ''].filter(Boolean).join(' · ')
}
</script>

<template>
  <AppModal max-width="max-w-5xl" @close="emit('close')">
    <template #header>
      <div class="min-w-0 flex-1">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ $t('list.title') }} <span class="font-normal text-gray-400">({{ items.length }})</span>
        </h2>
        <UInput v-model="search" icon="i-heroicons-magnifying-glass" :placeholder="$t('list.search')" :ui="{ rounded: 'rounded-full' }" class="mt-3" />
      </div>
    </template>

    <p v-if="!items.length" class="py-12 text-center text-sm text-gray-400">
      {{ $t('list.empty', { q: search }) }}
    </p>
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="entry in items"
        :key="entry.id"
        type="button"
        class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg dark:border-zinc-700"
        @click="emit('select', entry)"
      >
        <div class="relative h-36 overflow-hidden bg-teal-50 dark:bg-teal-950/30">
          <span v-if="entry.properties?.pending" class="absolute right-2 top-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            {{ $t('mod.pending') }}
          </span>
          <img v-if="cover(entry)" :src="photoThumb(cover(entry)!)" :alt="entry.comment" loading="lazy" decoding="async" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
          <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-950/30">
            <img v-if="ICONS[tagOf(entry)]" :src="ICONS[tagOf(entry)]" :alt="tagOf(entry)" class="h-10 w-10 object-contain opacity-70">
            <UIcon v-else name="i-heroicons-map-pin" class="h-10 w-10 text-teal-400" />
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-1.5 p-4">
          <span v-if="tagOf(entry)" class="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" :style="tagChipStyle(tagOf(entry))">
            <UIcon :name="categoryMeta(tagOf(entry)).icon" class="h-3 w-3" />
            {{ tagLabel(tagOf(entry)) }}
          </span>
          <p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
            {{ lf(entry.properties, 'title', entry.comment) || $t('list.untitled') }}
          </p>
          <p v-if="itemMeta(entry)" class="mt-auto truncate text-xs text-gray-400">
            {{ itemMeta(entry) }}
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
