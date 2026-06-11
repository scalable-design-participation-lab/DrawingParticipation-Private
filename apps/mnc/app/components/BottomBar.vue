<script setup lang="ts">
import { ref } from 'vue'
import healthIcon from '@base/assets/icons/Health.svg'
import transportIcon from '@base/assets/icons/Transportation.svg'
import connectivityIcon from '@base/assets/icons/Connectivity.svg'
import artIcon from '@base/assets/icons/Art.svg'
import communityIcon from '@base/assets/icons/Community.svg'
import { useFilterStore } from '../stores/filter'
import { useSolutionsStore } from '../stores/solutions'

const filterStore = useFilterStore()
const solutionsStore = useSolutionsStore()

const showMore = ref(false)

// The five MNC primary-tag themes, used as quick-filter toggles. Clicking one
// shows/hides that theme's pins via the shared filter store.
const themes = [
  { tag: 'Health & Crisis Response', icon: healthIcon },
  { tag: 'Transportation & Mobility', icon: transportIcon },
  { tag: 'Digital Access & Connectivity', icon: connectivityIcon },
  { tag: 'Community Mapping & Visibility', icon: communityIcon },
  { tag: 'Art & Cultural Expression', icon: artIcon },
]
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-40 pointer-events-none">

    <!-- More popup pill -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showMore"
        class="pointer-events-auto flex items-center gap-4 bg-white dark:bg-black rounded-full px-6 py-3 shadow-lg"
        style="border: 2px solid #FB6D6D;"
      >
        <button
          v-for="theme in themes"
          :key="theme.tag"
          type="button"
          class="flex flex-col items-center gap-1 group"
          :aria-label="(filterStore.isTagVisible(theme.tag) ? 'Hide ' : 'Show ') + theme.tag"
          @click="filterStore.toggleTag(theme.tag)"
        >
          <!-- Circular toggle: gradient border + full opacity when the theme is visible -->
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm transition"
            :class="filterStore.isTagVisible(theme.tag) ? 'active-gradient-border' : 'inactive-border'"
          >
            <img
              :src="theme.icon"
              :alt="theme.tag"
              class="w-7 h-7 object-contain transition-opacity"
              :style="{ opacity: filterStore.isTagVisible(theme.tag) ? 1 : 0.4 }"
            />
          </div>
        </button>
      </div>
    </Transition>

    <!-- Main bottom bar -->
    <div
      class="pointer-events-auto flex items-center gap-6 bg-white dark:bg-black rounded-full px-8 py-3 shadow-lg"
      style="border: 2px solid #FB6D6D;"
    >
      <UButton
        icon="i-heroicons-plus"
        variant="ghost"
        size="lg"
        aria-label="Add a solution"
        class="rounded-full"
        :style="{ color: solutionsStore.isPlacing ? '#FB6D6D' : '#57C9C0' }"
        :ui="{ rounded: 'rounded-full' }"
        @click="solutionsStore.startPlacing()"
      />
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
      <UButton
        icon="i-heroicons-bars-3"
        variant="ghost"
        size="lg"
        aria-label="List"
        class="rounded-full"
        :style="{ color: filterStore.isListOpen ? '#FB6D6D' : '#57C9C0' }"
        :ui="{ rounded: 'rounded-full' }"
        @click="filterStore.toggleList()"
      />
      <UButton
        icon="i-heroicons-ellipsis-horizontal"
        variant="ghost"
        size="lg"
        aria-label="More"
        class="rounded-full"
        :style="{ color: showMore ? '#FB6D6D' : '#57C9C0' }"
        :ui="{ rounded: 'rounded-full' }"
        @click="showMore = !showMore"
      />
    </div>
  </div>
</template>

<style scoped>
.active-gradient-border {
  border: 2.5px solid transparent;
  background-image:
    linear-gradient(white, white),
    linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.dark .active-gradient-border {
  background-image:
    linear-gradient(#18181b, #18181b),
    linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876);
}

.inactive-border {
  border: 2px solid #D1D5DB;
}
</style>
