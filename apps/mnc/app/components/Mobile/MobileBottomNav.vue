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
  { view: 'map' as MapView, icon: 'i-heroicons-map', labelKey: 'nav.map' },
  { view: 'list' as MapView, icon: 'i-heroicons-square-3-stack-3d', labelKey: 'nav.list' },
  { view: 'info' as MapView, icon: 'i-heroicons-information-circle', labelKey: 'nav.info' },
  { view: 'more' as MapView, icon: 'i-heroicons-plus', labelKey: 'nav.addEntry' },
]
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
    <div
      class="pointer-events-auto touch-manipulation flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-full px-4 py-2 shadow-lg"
      style="border: 2px solid #e5e7eb;"
      @pointerdown.stop
      @touchstart.stop
    >
      <!-- Default navigation stays visible even with a project open (the detail
           popup has its own close/expand), so the user is never stranded. -->
      <UTooltip v-for="item in defaultNavItems" :key="item.view" :text="$t(item.labelKey)">
        <UButton
          :icon="item.icon"
          :aria-label="$t(item.labelKey)"
          variant="ghost"
          size="lg"
          class="rounded-full"
          :class="activeView === item.view ? 'active-icon' : ''"
          :style="{ color: activeView === item.view ? '#57C9C0' : '#9CA3AF' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="emit('update:activeView', item.view)"
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
