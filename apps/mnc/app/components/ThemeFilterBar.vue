<script setup lang="ts">
import { computed } from 'vue'
import { PRIMARY_TAGS, useFilterStore } from '../stores/filter'
import { categoryMeta } from '../composables/categoryMeta'
import { useLocalizedEntry } from '../composables/useLocalizedEntry'

// Always-visible theme filters at the top of the map (previously hidden behind
// the bottom bar's "More" button). Each toggle shows/hides that theme's pins.
const filterStore = useFilterStore()
const { tagLabel } = useLocalizedEntry()

// The five curated themes plus any user-created ones present on the map —
// without a chip, a hidden custom theme could never be turned back on.
const tags = computed(() => {
  const extra = Object.keys(filterStore.grouped)
    .filter(t => t !== 'Uncategorized' && !(PRIMARY_TAGS as readonly string[]).includes(t))
  return [...PRIMARY_TAGS, ...extra]
})
</script>

<template>
  <div class="fixed top-20 left-1/2 z-30 -translate-x-1/2 pointer-events-none">
    <div
      class="pointer-events-auto flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/90"
    >
      <UTooltip v-for="tag in tags" :key="tag" :text="tagLabel(tag)">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full transition"
          :style="filterStore.isTagVisible(tag)
            ? { backgroundColor: `${categoryMeta(tag).color}22`, color: categoryMeta(tag).color }
            : { color: '#9CA3AF' }"
          :aria-label="(filterStore.isTagVisible(tag) ? 'Hide ' : 'Show ') + tagLabel(tag)"
          @click="filterStore.toggleTag(tag)"
        >
          <UIcon :name="categoryMeta(tag).icon" class="h-5 w-5" />
        </button>
      </UTooltip>
    </div>
  </div>
</template>
