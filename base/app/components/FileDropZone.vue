<!--
 * FileDropZone
 *
 * Headless drag-and-drop / click-to-browse file picker. The default slot draws
 * the zone and receives `dragging` so each app can style it its own way.
 *
 * @usage
 * <FileDropZone accept="image/*" @files="onFiles" v-slot="{ dragging }">
 *   <div :class="{ 'bg-gray-100': dragging }">Drop a photo here</div>
 * </FileDropZone>
 -->

<script setup lang="ts">
const props = withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
  // 'environment' opens the rear camera on phones.
  capture?: 'user' | 'environment'
  /** Lines drawn inside a dashed box when no default slot is given. */
  lines?: string[]
}>(), {
  accept: '',
  multiple: false,
  capture: undefined,
  lines: () => [],
})

const emit = defineEmits<{ files: [files: File[]] }>()

const dragging = ref(false)
// Name of the last file chosen, so the default box can confirm the pick.
const picked = ref('')

function take(list: FileList | null | undefined) {
  const files = Array.from(list ?? [])
  if (files.length) {
    picked.value = files.length > 1 ? `${files.length} files` : files[0].name
    emit('files', props.multiple ? files : files.slice(0, 1))
  }
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  take(input.files)
  // Reset so picking the same file twice still fires `change`.
  input.value = ''
}
</script>

<template>
  <label
    class="block cursor-pointer"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="dragging = false; take($event.dataTransfer?.files)"
  >
    <input
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      :capture="capture"
      @change="onChange"
    >
    <slot :dragging="dragging">
      <span
        class="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed p-6 text-center text-sm transition"
        :class="dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-300 dark:border-gray-600'"
      >
        <UIcon v-if="picked" name="i-heroicons-check-circle" class="h-6 w-6 text-primary-500" />
        <UIcon v-else name="i-heroicons-arrow-up-tray" class="h-6 w-6 text-gray-400" />
        <span v-for="line in (picked ? [picked] : lines)" :key="line">{{ line }}</span>
      </span>
    </slot>
  </label>
</template>
