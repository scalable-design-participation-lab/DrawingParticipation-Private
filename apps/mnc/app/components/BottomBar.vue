<script setup lang="ts">
/**
 * Desktop toolbar, mirroring the mobile bottom nav (same pill, icons, order).
 * The highlighted mode follows the open flags; each button emits its own event.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ contributeOpen?: boolean, listOpen?: boolean, infoOpen?: boolean }>(), {
  contributeOpen: false,
  listOpen: false,
  infoOpen: false,
})
const emit = defineEmits<{ map: [], list: [], info: [], add: [] }>()

// Exactly one icon is highlighted, tab-style; the map when nothing is open.
const active = computed(() => (props.contributeOpen ? 'add' : props.listOpen ? 'list' : props.infoOpen ? 'info' : 'map'))

const items = [
  { key: 'map', icon: 'i-heroicons-map', labelKey: 'nav.map' },
  { key: 'list', icon: 'i-heroicons-square-3-stack-3d', labelKey: 'nav.list' },
  { key: 'info', icon: 'i-heroicons-information-circle', labelKey: 'nav.info' },
  { key: 'add', icon: 'i-heroicons-plus', labelKey: 'nav.addEntry' },
] as const
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center safe-bottom">
    <div class="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2 shadow-lg dark:bg-zinc-900">
      <UTooltip v-for="item in items" :key="item.key" :text="$t(item.labelKey)">
        <UButton
          :icon="item.icon"
          :aria-label="$t(item.labelKey)"
          variant="ghost"
          size="lg"
          class="rounded-full"
          :class="active === item.key ? 'active-icon' : ''"
          :style="{ color: active === item.key ? '#57C9C0' : '#9CA3AF' }"
          :ui="{ rounded: 'rounded-full' }"
          @click="emit(item.key)"
        />
      </UTooltip>
    </div>
  </div>
</template>

<style scoped>
.active-icon {
  border: 2.5px solid transparent;
  background-image: linear-gradient(white, white), linear-gradient(135deg, #57c9c0, #84e8a0, #f9d876);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
.dark .active-icon {
  background-image: linear-gradient(#18181b, #18181b), linear-gradient(135deg, #57c9c0, #84e8a0, #f9d876);
}
</style>
