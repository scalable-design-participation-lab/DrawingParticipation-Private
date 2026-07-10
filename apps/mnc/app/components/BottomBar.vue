<script setup lang="ts">
import { useFilterStore } from '../stores/filter'
import { useSolutionsStore } from '../stores/solutions'

const filterStore = useFilterStore()
const solutionsStore = useSolutionsStore()
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-40 pointer-events-none">
    <!-- Floating toolbar. Theme filters now live in the top bar (ThemeFilterBar). -->
    <div
      class="pointer-events-auto flex items-center gap-5 bg-white dark:bg-zinc-900 rounded-full pl-2 pr-6 py-2 shadow-lg border border-gray-200 dark:border-white/10"
    >
      <!-- Primary action: filled teal circle -->
      <UTooltip text="Add entry — or click anywhere on the map">
        <UButton
          icon="i-heroicons-plus"
          variant="solid"
          size="lg"
          aria-label="Add entry"
          class="rounded-full !p-3 shadow-md transition-transform hover:scale-105"
          :style="{ backgroundColor: solutionsStore.isPlacing ? '#FB6D6D' : '#57C9C0', color: '#ffffff' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="solutionsStore.startPlacing()"
        />
      </UTooltip>
      <UTooltip text="Filtered selection">
        <UButton
          icon="i-heroicons-tag"
          variant="ghost"
          size="lg"
          aria-label="Filtered selection"
          class="rounded-full"
          :style="{ color: filterStore.isPanelOpen ? '#FB6D6D' : '#57C9C0' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="filterStore.togglePanel()"
        />
      </UTooltip>
      <UTooltip text="List of entries">
        <UButton
          icon="i-heroicons-square-3-stack-3d"
          variant="ghost"
          size="lg"
          aria-label="List of entries"
          class="rounded-full"
          :style="{ color: filterStore.isListOpen ? '#FB6D6D' : '#57C9C0' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="filterStore.toggleList()"
        />
      </UTooltip>
    </div>
  </div>
</template>
