<script setup lang="ts">
import { computed } from 'vue'
import { PRIMARY_TAGS, useCatalog } from '../composables/catalog'
import type { Entry } from '../composables/catalog'
import { categoryMeta } from '../composables/categoryMeta'
import { useLocalizedEntry } from '../composables/useLocalizedEntry'

/** Theme chips at the top of the map: the five curated themes plus any user-created one on the map. */
const props = withDefaults(defineProps<{ features?: Entry[], visibleTags?: string[] }>(), {
  features: () => [],
  visibleTags: () => [],
})
const emit = defineEmits<{ toggleTag: [tag: string] }>()

const { tagLabel } = useLocalizedEntry()
const { grouped, isVisible } = useCatalog(() => props.features, () => props.visibleTags)

const tags = computed(() => [
  ...PRIMARY_TAGS,
  ...Object.keys(grouped.value).filter(t => t !== 'Uncategorized' && !(PRIMARY_TAGS as readonly string[]).includes(t)),
])
</script>

<template>
  <div class="pointer-events-none fixed left-1/2 top-20 z-30 -translate-x-1/2">
    <div class="pointer-events-auto flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
      <UTooltip v-for="tag in tags" :key="tag" :text="tagLabel(tag)">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full transition"
          :style="isVisible(tag) ? { backgroundColor: `${categoryMeta(tag).color}22`, color: categoryMeta(tag).color } : { color: '#9CA3AF' }"
          :aria-label="(isVisible(tag) ? 'Hide ' : 'Show ') + tagLabel(tag)"
          @click="emit('toggleTag', tag)"
        >
          <UIcon :name="categoryMeta(tag).icon" class="h-5 w-5" />
        </button>
      </UTooltip>
    </div>
  </div>
</template>
