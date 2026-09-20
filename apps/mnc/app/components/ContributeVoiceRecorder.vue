<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

/**
 * In-browser voice recorder, for people who can't (or don't want to) type.
 * Used by the contribute wizard (new entries) and by ImageUploadModal (voice
 * comments on an entry that already exists). Recordings are collected as File
 * objects into a v-model array and uploaded exactly like any other file —
 * uploadFile() tags them kind:'audio' by MIME type.
 */
const props = defineProps<{ modelValue: File[] }>()
const emit = defineEmits<{ 'update:modelValue': [files: File[]] }>()
const { t } = useI18n()

const recording = ref(false)
const error = ref('')
// Object URLs for playback previews, index-aligned with modelValue.
const urls = ref<string[]>([])
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []

async function toggle() {
  if (recording.value) {
    recorder?.stop()
    return
  }
  error.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    recorder = new MediaRecorder(stream)
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop())
      recording.value = false
      // Safari records audio/mp4, Chrome/Firefox audio/webm — both pass the
      // storage.rules audio/* check.
      const type = recorder?.mimeType || 'audio/webm'
      const blob = new Blob(chunks, { type })
      if (!blob.size)
        return
      // uploadFile() reads file.name/file.type, so wrap the blob as a File.
      const ext = type.includes('mp4') ? 'm4a' : 'webm'
      const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type })
      urls.value = [...urls.value, URL.createObjectURL(blob)]
      emit('update:modelValue', [...props.modelValue, file])
    }
    recorder.start()
    recording.value = true
  }
  catch {
    error.value = t('voice.micDenied')
  }
}

function remove(i: number) {
  const url = urls.value[i]
  if (url)
    URL.revokeObjectURL(url)
  urls.value = urls.value.filter((_, x) => x !== i)
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}

onBeforeUnmount(() => {
  if (recording.value)
    recorder?.stop()
  urls.value.forEach(u => URL.revokeObjectURL(u))
})
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm font-medium transition-colors"
      :class="recording
        ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30'
        : 'border-[#F5B5B5] bg-white text-[#F26D6D]'"
      @click="toggle"
    >
      <UIcon :name="recording ? 'i-heroicons-stop-circle' : 'i-heroicons-microphone'" class="h-5 w-5" :class="{ 'animate-pulse': recording }" />
      {{ recording ? $t('voice.stop') : $t('voice.record') }}
    </button>

    <ul v-if="urls.length" class="mt-3 space-y-2">
      <li
        v-for="(url, i) in urls"
        :key="url"
        class="flex items-center gap-2 rounded-xl bg-[#FCEAEA] px-3 py-2"
      >
        <audio :src="url" controls class="h-9 min-w-0 flex-1" />
        <UButton
          icon="i-heroicons-x-mark"
          color="gray"
          variant="ghost"
          size="2xs"
          :ui="{ rounded: 'rounded-full' }"
          :aria-label="$t('fileUpload.removeFile')"
          @click="remove(i)"
        />
      </li>
    </ul>

    <p v-if="error" class="mt-2 text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
