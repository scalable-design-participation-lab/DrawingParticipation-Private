<script setup lang="ts">
type MapView = 'map' | 'list' | 'info' | 'more'

const props = defineProps<{
  activeView: MapView
  projectSelected: boolean
}>()

const emit = defineEmits<{
  'update:activeView': [view: MapView]
  'show-on-map': []
  'read-more': []
  'next-project': []
  'close-project': []
}>()

const defaultNavItems = [
  { view: 'map' as MapView, icon: 'i-heroicons-map', label: 'Map' },
  { view: 'list' as MapView, icon: 'i-heroicons-bars-3', label: 'List' },
  { view: 'info' as MapView, icon: 'i-heroicons-information-circle', label: 'Info' },
  { view: 'more' as MapView, icon: 'i-heroicons-ellipsis-horizontal', label: 'More' },
]

const projectNavItems = [
  { icon: 'i-heroicons-map-pin', label: 'Map', action: () => emit('show-on-map') },
  { icon: 'i-heroicons-book-open', label: 'Read', action: () => emit('read-more') },
  { icon: 'i-heroicons-arrow-right', label: 'Next', action: () => emit('next-project') },
  { icon: 'i-heroicons-arrow-uturn-left', label: 'Close', action: () => emit('close-project') },
]
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
    <div
      class="pointer-events-auto flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg"
      style="border: 2px solid #e5e7eb;"
    >
      <!-- Default navigation (no project selected) -->
      <template v-if="!projectSelected">
        <UButton
          v-for="item in defaultNavItems"
          :key="item.view"
          :icon="item.icon"
          :aria-label="item.label"
          variant="ghost"
          size="lg"
          class="rounded-full"
          :class="activeView === item.view ? 'active-icon' : ''"
          :style="{ color: activeView === item.view ? '#57C9C0' : '#9CA3AF' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="emit('update:activeView', item.view)"
        />
      </template>

      <!-- Project context navigation (project selected) -->
      <template v-else>
        <UButton
          v-for="item in projectNavItems"
          :key="item.label"
          :icon="item.icon"
          :aria-label="item.label"
          variant="ghost"
          size="lg"
          class="rounded-full"
          :style="{ color: '#9CA3AF' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="item.action"
        />
      </template>
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
</style>
