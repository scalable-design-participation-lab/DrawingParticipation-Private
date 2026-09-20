<script setup lang="ts">
import { computed, ref } from 'vue'
import healthIcon from '@base/assets/icons/Health.svg'
import transportIcon from '@base/assets/icons/Transportation.svg'
import connectivityIcon from '@base/assets/icons/Connectivity.svg'
import artIcon from '@base/assets/icons/Art.svg'
import communityIcon from '@base/assets/icons/Community.svg'
import { PRIMARY_TAGS, useCatalog } from '../composables/catalog'
import type { Entry } from '../composables/catalog'
import { useLocalizedEntry } from '../composables/useLocalizedEntry'

/** Collapsible category accordion with per-category counts and visibility toggles. */
const props = withDefaults(defineProps<{ features?: Entry[], visibleTags?: string[], title?: string, empty?: string }>(), {
  features: () => [],
  visibleTags: () => [],
  title: 'Filtered Selection',
  empty: 'No features loaded yet.',
})
const emit = defineEmits<{ select: [entry: Entry], toggleTag: [tag: string] }>()

const { tagLabel } = useLocalizedEntry()
const { grouped, isVisible } = useCatalog(() => props.features, () => props.visibleTags)

const isCollapsed = ref(false)
const openCategories = ref<Set<string>>(new Set(PRIMARY_TAGS))

const ICONS: Record<string, string> = {
  'Health & Crisis Response': healthIcon,
  'Transportation & Mobility': transportIcon,
  'Digital Access & Connectivity': connectivityIcon,
  'Community Mapping & Visibility': communityIcon,
  'Art & Cultural Expression': artIcon,
}

const categories = computed(() => Object.entries(grouped.value).map(([tag, entries]) => ({ tag, entries, count: entries.length })))

function toggleOpen(tag: string) {
  const next = new Set(openCategories.value)
  if (next.has(tag)) {
    next.delete(tag)
  }
  else {
    next.add(tag)
  }
  openCategories.value = next
}

function itemLocationDate(entry: Entry) {
  return [entry.properties?.location, entry.properties?.date].filter(Boolean).join(', ')
}
</script>

<template>
  <UCard
    class="filter-sidebar fixed right-6 top-24 z-40 flex max-h-[calc(100vh-11rem)] w-96 flex-col overflow-hidden shadow-xl dark:bg-black md:w-80"
    :ui="{ body: { padding: 'p-0' }, header: { padding: 'px-4 py-3' } }"
    style="border: 2px solid #FB6D6D; border-radius: 1rem;"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h2>
        <UButton :icon="isCollapsed ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-up'" color="gray" variant="ghost" size="sm" aria-label="Collapse" :ui="{ rounded: 'rounded-full' }" @click="isCollapsed = !isCollapsed" />
      </div>
    </template>

    <div v-show="!isCollapsed" class="max-h-[calc(100vh-15rem)] flex-1 space-y-3 overflow-y-auto px-3 py-2">
      <p v-if="categories.length === 0" class="py-6 text-center text-sm text-gray-400">
        {{ empty }}
      </p>
      <div v-for="cat in categories" :key="cat.tag" class="space-y-1">
        <div class="flex cursor-pointer select-none items-center gap-2 py-1" :class="{ 'opacity-50': !isVisible(cat.tag) }" @click="toggleOpen(cat.tag)">
          <img v-if="ICONS[cat.tag]" :src="ICONS[cat.tag]" :alt="cat.tag" class="h-6 w-6 flex-shrink-0 object-contain">
          <UIcon v-else name="i-heroicons-tag" class="h-6 w-6 flex-shrink-0" :style="{ color: '#57C9C0' }" />
          <span class="flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">{{ tagLabel(cat.tag) }}</span>
          <span class="whitespace-nowrap text-xs text-gray-400">{{ cat.count }} element{{ cat.count === 1 ? '' : 's' }}</span>
          <UButton
            :icon="isVisible(cat.tag) ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
            color="gray"
            variant="ghost"
            size="2xs"
            :aria-label="isVisible(cat.tag) ? `Hide ${tagLabel(cat.tag)}` : `Show ${tagLabel(cat.tag)}`"
            :ui="{ rounded: 'rounded-full' }"
            @click.stop="emit('toggleTag', cat.tag)"
          />
        </div>
        <div v-show="openCategories.has(cat.tag)" class="space-y-0.5 pl-3">
          <button
            v-for="entry in cat.entries"
            :key="entry.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900"
            :class="{ 'opacity-50': !isVisible(cat.tag) }"
            @click="emit('select', entry)"
          >
            <img v-if="ICONS[cat.tag]" :src="ICONS[cat.tag]" :alt="cat.tag" class="h-4 w-4 flex-shrink-0 object-contain">
            <UIcon v-else name="i-heroicons-tag" class="h-4 w-4 flex-shrink-0" :style="{ color: '#57C9C0' }" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-gray-900 dark:text-white">{{ entry.comment || 'Untitled' }}</span>
              <span class="block truncate text-xs text-gray-400">{{ itemLocationDate(entry) }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.filter-sidebar :deep(.overflow-y-auto)::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 6px;
}
.filter-sidebar :deep(.overflow-y-auto)::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgba(156, 163, 175, 0.5);
  border: 2px solid transparent;
  background-clip: padding-box;
}
</style>
