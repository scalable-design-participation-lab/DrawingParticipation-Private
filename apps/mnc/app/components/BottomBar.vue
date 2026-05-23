<script setup lang="ts">
import { ref } from 'vue'
import { useFilterStore } from '../stores/filter'

const filterStore = useFilterStore()

const showMore = ref(false)

const categories = [
  {
    label: 'Belonging',
    icon: 'i-heroicons-heart',
    active: true,
  },
  {
    label: 'Environment',
    icon: 'i-heroicons-map-pin',
    active: true,
  },
  {
    label: 'Safety',
    icon: 'i-heroicons-shield-check',
    active: false,
  },
  {
    label: 'Ecology',
    icon: 'i-heroicons-leaf',
    active: false,
  },
  {
    label: 'Obstacles',
    icon: 'i-heroicons-no-symbol',
    active: false,
  },
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
          v-for="cat in categories"
          :key="cat.label"
          class="flex flex-col items-center gap-1 group"
          :aria-label="cat.label"
        >
          <!-- Circular icon button -->
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm"
            :class="cat.active ? 'active-gradient-border' : 'inactive-border'"
          >
            <UIcon
              :name="cat.icon"
              class="w-7 h-7"
              :style="{ color: cat.active ? '#57C9C0' : '#9CA3AF' }"
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
        aria-label="Add"
        class="rounded-full"
        :style="{ color: '#57C9C0' }"
        :ui="{ rounded: 'rounded-full' }"
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
        :style="{ color: '#57C9C0' }"
        :ui="{ rounded: 'rounded-full' }"
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
