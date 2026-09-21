<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

/**
 * Record a voice note in the browser, for people who cannot or would rather
 * not type. Recordings come out as `File` objects in `modelValue`, exactly
 * like `PhotoDropZone` and `FileDropZone` hand over what was picked, so the
 * same `saveTo` uploads them.
 *
 * Every label is a prop; pass "$t." keys to translate them.
 */
const props = withDefaults(defineProps<{
  modelValue?: File[]
  recordLabel?: string
  stopLabel?: string
  removeLabel?: string
  /** Shown when the reader refuses the microphone, or there is none. */
  deniedLabel?: string
}>(), {
  modelValue: () => [],
  recordLabel: 'Record',
  stopLabel: 'Stop',
  removeLabel: 'Remove',
  deniedLabel: 'No microphone available.',
})

const emit = defineEmits<{ 'update:modelValue': [files: File[]] }>()

const recording = ref(false)
const error = ref('')
/** Object URLs for playback, index-aligned with modelValue. */
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
    recorder.ondataavailable = event => chunks.push(event.data)
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop())
      recording.value = false
      // Safari records audio/mp4, Chrome and Firefox audio/webm.
      const type = recorder?.mimeType || 'audio/webm'
      const blob = new Blob(chunks, { type })
      if (!blob.size) {
        return
      }
      const extension = type.includes('mp4') ? 'm4a' : 'webm'
      const file = new File([blob], `voice-note-${Date.now()}.${extension}`, { type })
      urls.value = [...urls.value, URL.createObjectURL(blob)]
      emit('update:modelValue', [...props.modelValue, file])
    }
    recorder.start()
    recording.value = true
  }
  catch {
    error.value = props.deniedLabel
  }
}

function remove(index: number) {
  const url = urls.value[index]
  if (url) {
    URL.revokeObjectURL(url)
  }
  urls.value = urls.value.filter((_, i) => i !== index)
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

onBeforeUnmount(() => {
  if (recording.value) {
    recorder?.stop()
  }
  urls.value.forEach(url => URL.revokeObjectURL(url))
})
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm font-medium transition-colors"
      :class="recording
        ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30'
        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200'"
      @click="toggle"
    >
      <UIcon
        :name="recording ? 'i-heroicons-stop-circle' : 'i-heroicons-microphone'"
        class="h-5 w-5"
        :class="{ 'animate-pulse': recording }"
      />
      {{ recording ? stopLabel : recordLabel }}
    </button>

    <ul v-if="urls.length" class="mt-3 space-y-2">
      <li v-for="(url, i) in urls" :key="url" class="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 dark:bg-white/5">
        <audio :src="url" controls class="h-9 min-w-0 flex-1" />
        <UButton
          icon="i-heroicons-x-mark"
          color="gray"
          variant="ghost"
          size="2xs"
          :ui="{ rounded: 'rounded-full' }"
          :aria-label="removeLabel"
          @click="remove(i)"
        />
      </li>
    </ul>

    <p v-if="error" class="mt-2 text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
