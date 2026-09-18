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
}>(), {
  accept: '',
  multiple: false,
  capture: undefined,
})

const emit = defineEmits<{ files: [files: File[]] }>()

const dragging = ref(false)

function take(list: FileList | null | undefined) {
  const files = Array.from(list ?? [])
  if (files.length) {
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
    <slot :dragging="dragging" />
  </label>
</template>
