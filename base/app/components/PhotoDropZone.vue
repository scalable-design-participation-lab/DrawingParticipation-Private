<script setup lang="ts">
import { computed, ref } from 'vue'
import FileDropZone from './FileDropZone.vue'

/**
 * Photo picker with a preview: the "TOMAR FOTO / O / ARRASTRA TU FOTO AQUÍ"
 * box. FileDropZone does the picking, this adds the copy and the preview.
 */
withDefaults(defineProps<{
  /** Lines of text shown before a photo is picked. */
  lines?: string[]
  accept?: string
  capture?: 'user' | 'environment'
}>(), {
  lines: () => ['Take a photo', 'or', 'drop it here'],
  accept: 'image/*',
  capture: undefined,
})

const emit = defineEmits<{ files: [files: File[]] }>()

const photo = ref<File | null>(null)
const preview = computed(() => (photo.value ? URL.createObjectURL(photo.value) : ''))

function onFiles(files: File[]) {
  photo.value = files[0] ?? null
  emit('files', files)
}
</script>

<template>
  <FileDropZone v-slot="{ dragging }" class="h-full" :accept="accept" :capture="capture" @files="onFiles">
    <div
      class="flex h-full flex-col items-center justify-center gap-8 text-center text-xs font-bold"
      :class="{ 'bg-gray-100 dark:bg-gray-800': dragging }"
    >
      <template v-if="photo">
        <img :src="preview" class="max-h-[60%] max-w-[80%] object-contain" alt="">
        <span class="font-normal normal-case">{{ photo.name }}</span>
      </template>
      <span v-for="line in lines" v-else :key="line" class="whitespace-pre-line">{{ line }}</span>
    </div>
  </FileDropZone>
</template>
