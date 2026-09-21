<script setup lang="ts">
import { computed } from 'vue'

/**
 * A floating pill of icon buttons: the bottom toolbar of a map app, the row of
 * category chips above it, a view switcher. One item is active at a time, or
 * several when `multiple` is set.
 *
 * `modelValue` says which are active, so the page owns that state. An item may
 * also carry its own `onClick` action when pressing it does more than change
 * which one is lit.
 */
export interface BarItem {
  value: string
  icon: string
  /** Tooltip and accessible name. */
  label?: string
  /** Colour when active; the theme's primary otherwise. */
  color?: string
  onClick?: (value: string) => void
}

const props = withDefaults(defineProps<{
  items?: BarItem[]
  /** Active value, or the list of them when `multiple`. */
  modelValue?: string | string[]
  multiple?: boolean
  position?: 'top' | 'bottom' | 'static'
  size?: 'sm' | 'md' | 'lg'
}>(), {
  items: () => [],
  modelValue: '',
  multiple: false,
  position: 'bottom',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  /** The pressed item's `value`, whether or not it changed the selection. */
  'select': [value: string]
}>()

const BUTTON = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
const GLYPH = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
const PLACE = {
  top: 'fixed left-1/2 top-20 z-30 -translate-x-1/2',
  bottom: 'fixed inset-x-0 bottom-6 z-40 flex justify-center safe-bottom',
  static: '',
}

const active = computed(() => {
  const value = props.modelValue
  return new Set(Array.isArray(value) ? value : value ? [value] : [])
})

function press(item: BarItem) {
  if (props.multiple) {
    const next = new Set(active.value)
    if (next.has(item.value)) {
      next.delete(item.value)
    }
    else {
      next.add(item.value)
    }
    emit('update:modelValue', [...next])
  }
  else {
    emit('update:modelValue', item.value)
  }
  emit('select', item.value)
  item.onClick?.(item.value)
}
</script>

<template>
  <div class="pointer-events-none" :class="PLACE[position]">
    <div class="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
      <UTooltip v-for="item in items" :key="item.value" :text="item.label ?? ''" :prevent="!item.label">
        <button
          type="button"
          class="flex items-center justify-center rounded-full transition"
          :class="[BUTTON[size], active.has(item.value) ? '' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200']"
          :style="active.has(item.value) && item.color
            ? { backgroundColor: `${item.color}22`, color: item.color }
            : undefined"
          :aria-label="item.label ?? item.value"
          :aria-pressed="active.has(item.value)"
          @click="press(item)"
        >
          <UIcon
            :name="item.icon"
            :class="[GLYPH[size], active.has(item.value) && !item.color ? 'text-primary-500' : '']"
          />
        </button>
      </UTooltip>
    </div>
  </div>
</template>
