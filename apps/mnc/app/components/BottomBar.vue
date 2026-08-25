<script setup lang="ts">
import { useFilterStore } from '../stores/filter'

// Mirrors the mobile bottom nav (Mobile/MobileBottomNav.vue) so the two match:
// same pill, same icons, same order. Actions are desktop-appropriate (panels
// instead of full-screen views). Theme filtering lives in the top ThemeFilterBar.
// `active` is the current mode ('map' | 'list' | 'info' | 'add') so exactly one
// icon is highlighted, tab-style, like the mobile nav. Defaults to 'map'.
const props = defineProps<{ active?: string }>()
const emit = defineEmits<{ contribute: [], info: [] }>()
const filterStore = useFilterStore()

const navItems = [
  { key: 'map', icon: 'i-heroicons-map', labelKey: 'nav.map' },
  { key: 'list', icon: 'i-heroicons-square-3-stack-3d', labelKey: 'nav.list' },
  { key: 'info', icon: 'i-heroicons-information-circle', labelKey: 'nav.info' },
  { key: 'add', icon: 'i-heroicons-plus', labelKey: 'nav.addEntry' },
]

function onNav(key: string) {
  if (key === 'add')
    emit('contribute')
  else if (key === 'list')
    filterStore.toggleList()
  else if (key === 'info')
    emit('info')
  else if (key === 'map') {
    // Back to a clean map: close any open panel / list.
    if (filterStore.isPanelOpen)
      filterStore.togglePanel()
    if (filterStore.isListOpen)
      filterStore.toggleList()
  }
}

function isActive(key: string): boolean {
  return (props.active || 'map') === key
}
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
    <div
      class="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg dark:bg-zinc-900"
      style="border: 2px solid #e5e7eb;"
    >
      <UTooltip v-for="item in navItems" :key="item.key" :text="$t(item.labelKey)">
        <UButton
          :icon="item.icon"
          :aria-label="$t(item.labelKey)"
          variant="ghost"
          size="lg"
          class="rounded-full"
          :class="isActive(item.key) ? 'active-icon' : ''"
          :style="{ color: isActive(item.key) ? '#57C9C0' : '#9CA3AF' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="onNav(item.key)"
        />
      </UTooltip>
    </div>
  </div>
</template>

<style scoped>
.active-icon {
  border: 2.5px solid transparent;
  background-image:
    linear-gradient(white, white),
    linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.dark .active-icon {
  background-image:
    linear-gradient(#18181b, #18181b),
    linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876);
}
</style>
