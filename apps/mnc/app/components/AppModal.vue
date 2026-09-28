<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Shared dialog shell: a centered, backdrop-dimmed modal that never exceeds the
 * screen — the body scrolls inside a capped-height card while the header (title
 * + close) and optional footer stay fixed. Closes on the X, a backdrop click,
 * or Escape.
 *
 * Usage:
 *   <AppModal :title="..." max-width="max-w-md" @close="...">
 *     ...body...
 *     <template #footer> ...actions... </template>
 *   </AppModal>
 */
const props = defineProps<{
  title?: string
  maxWidth?: string
  closeOnBackdrop?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

function close() {
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape')
    close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
    @click.self="props.closeOnBackdrop === false ? null : close()"
  >
    <div
      class="app-modal-scroll flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
      :class="maxWidth || 'max-w-md'"
    >
      <!-- Header (fixed) -->
      <div
        v-if="title || $slots.header"
        class="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-zinc-800"
      >
        <slot name="header">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
        </slot>
        <UButton
          icon="i-heroicons-x-mark"
          color="gray"
          variant="ghost"
          size="sm"
          :aria-label="$t('detail.close')"
          class="rounded-full"
          @click="close"
        />
      </div>

      <!-- Body (scrolls) -->
      <div class="app-modal-scroll flex-1 overflow-y-auto px-5 py-5">
        <slot />
      </div>

      <!-- Footer (fixed) -->
      <div
        v-if="$slots.footer"
        class="shrink-0 border-t border-gray-100 px-5 py-3 dark:border-zinc-800"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-modal-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}
.app-modal-scroll::-webkit-scrollbar {
  width: 10px;
}
.app-modal-scroll::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
.app-modal-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.45);
  border-radius: 9999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
.app-modal-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.6);
  background-clip: content-box;
}
</style>
