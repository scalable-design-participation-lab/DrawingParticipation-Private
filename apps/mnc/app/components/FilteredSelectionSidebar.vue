<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Feature } from '@base/stores/types/store'
import healthIcon from '@base/assets/icons/Health.png'
import transportIcon from '@base/assets/icons/Transportation.png'
import connectivityIcon from '@base/assets/icons/Connectivity.png'
import { PRIMARY_TAGS, useFilterStore } from '../stores/filter'

const filterStore = useFilterStore()

const isCollapsed = ref(false)
const openCategories = ref<Set<string>>(new Set(PRIMARY_TAGS))

type CategoryIcon =
  | { kind: 'png', src: string }
  | { kind: 'heroicon', name: string }

const ICONS: Record<string, CategoryIcon> = {
  'Health & Crisis Response': { kind: 'png', src: healthIcon },
  'Transportation & Mobility': { kind: 'png', src: transportIcon },
  'Digital Access & Connectivity': { kind: 'png', src: connectivityIcon },
  'Community Mapping & Visibility': { kind: 'heroicon', name: 'i-heroicons-map-pin' },
  'Art & Cultural Expression': { kind: 'heroicon', name: 'i-heroicons-paint-brush' },
}

function categoryIcon(tag: string): CategoryIcon {
  return ICONS[tag] ?? { kind: 'heroicon', name: 'i-heroicons-tag' }
}

const categories = computed(() =>
  Object.entries(filterStore.grouped).map(([tag, features]) => ({
    tag,
    features,
    count: features.length,
  })),
)

function toggleCategoryOpen(tag: string) {
  const next = new Set(openCategories.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  openCategories.value = next
}

function isOpen(tag: string) {
  return openCategories.value.has(tag)
}

function selectItem(feature: Feature) {
  filterStore.selectFeature(feature)
}

function elementsLabel(n: number) {
  return `${n} element${n === 1 ? '' : 's'}`
}

function itemLocationDate(feature: Feature): string {
  const p = (feature.properties as any) ?? {}
  const parts: string[] = []
  if (p.location) parts.push(p.location)
  if (p.date) parts.push(p.date)
  return parts.join(', ')
}
</script>

<template>
  <UCard
    class="filter-sidebar fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden"
    :ui="{
      body: { padding: 'p-0' },
      header: { padding: 'px-4 py-3' },
    }"
    style="border: 2px solid #FB6D6D; border-radius: 1rem;"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">
          Filtered Selection
        </h2>
        <UButton
          :icon="isCollapsed ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-up'"
          color="gray"
          variant="ghost"
          size="sm"
          aria-label="Collapse"
          :ui="{ rounded: 'rounded-full' }"
          @click="isCollapsed = !isCollapsed"
        />
      </div>
    </template>

    <div
      v-show="!isCollapsed"
      class="flex-1 overflow-y-auto max-h-[calc(100vh-15rem)] px-3 py-2 space-y-3"
    >
      <p
        v-if="categories.length === 0"
        class="text-sm text-gray-400 text-center py-6"
      >
        No features loaded yet.
      </p>

      <div
        v-for="cat in categories"
        :key="cat.tag"
        class="space-y-1"
      >
        <!-- Category header row -->
        <div
          class="flex items-center gap-2 py-1 cursor-pointer select-none"
          :class="{ 'opacity-50': !filterStore.isTagVisible(cat.tag) }"
          @click="toggleCategoryOpen(cat.tag)"
        >
          <!-- Category icon -->
          <img
            v-if="categoryIcon(cat.tag).kind === 'png'"
            :src="(categoryIcon(cat.tag) as { kind: 'png', src: string }).src"
            :alt="cat.tag"
            class="w-6 h-6 flex-shrink-0 object-contain"
          />
          <UIcon
            v-else
            :name="(categoryIcon(cat.tag) as { kind: 'heroicon', name: string }).name"
            class="w-6 h-6 flex-shrink-0"
            :style="{ color: '#57C9C0' }"
          />

          <span class="flex-1 font-semibold text-sm text-gray-900 dark:text-white truncate">
            {{ cat.tag }}
          </span>

          <span class="text-xs text-gray-400 whitespace-nowrap">
            {{ elementsLabel(cat.count) }}
          </span>

          <UButton
            :icon="filterStore.isTagVisible(cat.tag) ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
            color="gray"
            variant="ghost"
            size="2xs"
            :aria-label="filterStore.isTagVisible(cat.tag) ? `Hide ${cat.tag}` : `Show ${cat.tag}`"
            :ui="{ rounded: 'rounded-full' }"
            @click.stop="filterStore.toggleTag(cat.tag)"
          />
        </div>

        <!-- Category items -->
        <div
          v-show="isOpen(cat.tag)"
          class="pl-3 space-y-0.5"
        >
          <button
            v-for="feature in cat.features"
            :key="feature.id"
            type="button"
            class="w-full flex items-center gap-2 py-1.5 px-1 rounded-md text-left hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            :class="{ 'opacity-50': !filterStore.isTagVisible(cat.tag) }"
            @click="selectItem(feature)"
          >
            <img
              v-if="categoryIcon(cat.tag).kind === 'png'"
              :src="(categoryIcon(cat.tag) as { kind: 'png', src: string }).src"
              :alt="cat.tag"
              class="w-4 h-4 flex-shrink-0 object-contain"
            />
            <UIcon
              v-else
              :name="(categoryIcon(cat.tag) as { kind: 'heroicon', name: string }).name"
              class="w-4 h-4 flex-shrink-0"
              :style="{ color: '#57C9C0' }"
            />

            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ feature.comment || 'Untitled' }}
              </span>
              <span class="block text-xs text-gray-400 truncate">
                {{ itemLocationDate(feature) }}
              </span>
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

.filter-sidebar :deep(.overflow-y-auto)::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
