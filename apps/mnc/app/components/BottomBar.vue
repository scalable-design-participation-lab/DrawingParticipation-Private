<script setup lang="ts">
import { useFilterStore } from '../stores/filter'

// ➕ opens the "Join Our Research" contribute wizard (handled by the page).
const emit = defineEmits<{ contribute: [] }>()
const filterStore = useFilterStore()
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-40 pointer-events-none">
    <!-- Floating toolbar. Theme filters now live in the top bar (ThemeFilterBar). -->
    <div
      class="pointer-events-auto flex items-center gap-5 bg-white dark:bg-zinc-900 rounded-full pl-2 pr-6 py-2 shadow-lg border border-gray-200 dark:border-white/10"
    >
      <!-- Primary action: filled teal circle -->
      <UTooltip :text="$t('nav.addEntry')">
        <UButton
          icon="i-heroicons-plus"
          variant="solid"
          size="lg"
          :aria-label="$t('nav.addEntry')"
          class="rounded-full !p-3 shadow-md transition-transform hover:scale-105"
          :style="{ backgroundColor: '#57C9C0', color: '#ffffff' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="emit('contribute')"
        />
      </UTooltip>
      <UTooltip :text="$t('nav.filter')">
        <UButton
          icon="i-heroicons-tag"
          variant="ghost"
          size="lg"
          :aria-label="$t('nav.filter')"
          class="rounded-full"
          :style="{ color: filterStore.isPanelOpen ? '#FB6D6D' : '#57C9C0' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="filterStore.togglePanel()"
        />
      </UTooltip>
      <UTooltip :text="$t('nav.list')">
        <UButton
          icon="i-heroicons-square-3-stack-3d"
          variant="ghost"
          size="lg"
          :aria-label="$t('nav.list')"
          class="rounded-full"
          :style="{ color: filterStore.isListOpen ? '#FB6D6D' : '#57C9C0' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="filterStore.toggleList()"
        />
      </UTooltip>
    </div>
  </div>
</template>
