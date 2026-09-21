<script setup lang="ts">
import { computed } from 'vue'
import { useAppManifest } from '../composables/useAppManifest'

/**
 * A bottom sheet, the way a phone shows one thing while keeping the map
 * behind it: a compact card that peeks over the bottom bar, and the same sheet
 * pulled up to fill most of the screen. The grip and the whole peek card
 * switch between the two, the x closes it.
 *
 * The `accent` tone paints the full sheet in the app's own accent
 * (`theme.accent` in app.json), because which colour that is belongs to the
 * app and nothing else about the sheet does.
 */
const props = withDefaults(defineProps<{
  /** Whether the sheet is there at all; bind it to whatever is selected. */
  modelValue?: boolean
  state?: 'peek' | 'full'
  tone?: 'surface' | 'accent'
  closeLabel?: string
  /** Accessible name of the grip that switches between the two states. */
  toggleLabel?: string
  /** Label of the button under the peek content; omitted = no button. */
  expandLabel?: string
  /** How far up the screen each state may go. */
  peekHeight?: '35dvh' | '45dvh' | '60dvh'
  fullHeight?: '60dvh' | '75dvh' | '85dvh'
  /** Room for a bottom bar underneath. */
  offset?: 'none' | 'bar'
}>(), {
  modelValue: true,
  state: 'peek',
  tone: 'surface',
  closeLabel: 'Close',
  toggleLabel: 'Expand',
  expandLabel: '',
  peekHeight: '45dvh',
  fullHeight: '85dvh',
  offset: 'bar',
})

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  'update:state': [state: 'peek' | 'full']
  'close': []
}>()

const { manifest } = useAppManifest()
const accent = computed(() => manifest?.theme?.accent || '')

const full = computed(() => props.state === 'full')
const panelStyle = computed(() => ({
  maxHeight: full.value ? props.fullHeight : props.peekHeight,
  ...(full.value && props.tone === 'accent' && accent.value ? { backgroundColor: accent.value } : {}),
}))

function toggle() {
  emit('update:state', full.value ? 'peek' : 'full')
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <div
    v-if="modelValue"
    class="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 safe-bottom"
    :class="offset === 'bar' ? 'bottom-24' : 'bottom-0'"
  >
    <!-- Only the height moves between states; the colour is the colour. -->
    <div
      class="pointer-events-auto flex w-full max-w-sm touch-manipulation flex-col overflow-hidden shadow-xl transition-[max-height] duration-300"
      :class="[
        full ? 'rounded-3xl border-[3px] border-white shadow-2xl' : 'rounded-t-3xl',
        full && tone === 'accent' ? '' : 'bg-white dark:bg-zinc-900',
      ]"
      :style="panelStyle"
    >
      <div class="relative flex flex-shrink-0 justify-center pb-1 pt-3">
        <button
          type="button"
          class="h-1 w-10 cursor-pointer rounded-full"
          :class="full && tone === 'accent' ? 'bg-white/50' : 'bg-gray-300 dark:bg-zinc-600'"
          :aria-label="toggleLabel"
          @click="toggle"
        />
        <button
          type="button"
          class="absolute right-2 top-1 p-1"
          :class="full && tone === 'accent' ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
          :aria-label="closeLabel"
          @click="close"
        >
          <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div v-if="full" class="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6 pt-2">
        <slot />
      </div>
      <div v-else class="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <!-- The whole peek card is the way up, not just the small button. -->
        <div class="cursor-pointer" @click="toggle">
          <slot name="peek" />
        </div>
        <UButton v-if="expandLabel" variant="ghost" color="gray" size="xs" class="mt-4 w-full justify-center text-gray-400" @click="toggle">
          {{ expandLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>
