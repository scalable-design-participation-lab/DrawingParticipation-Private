<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { getHandler } from '../utils/handlers'
import { SPEC_CONTEXT } from '../utils/spec-context'
import type { SpecContext } from '../utils/spec-context'
import FileDropZone from './FileDropZone.vue'
import VoiceRecorder from './VoiceRecorder.vue'

/**
 * Attach photos and recordings to something, one upload at a time and with the
 * progress of each one on screen.
 *
 * Where they go is the app's business, so the upload itself is a handler named
 * by `uploader`. It is called with `{ file, onProgress }` and whatever `args`
 * says, and whatever it returns lands in `modelValue` -- so a page reads the
 * results the same way it reads any other bound value, and base never learns
 * what a storage bucket is.
 *
 * Nothing here is submitted: the page decides when the collected media is
 * saved, and the queue only makes sure it is ready.
 */
const props = withDefaults(defineProps<{
  /** Handler that uploads one file and returns what should be stored. */
  uploader: string
  /** Passed to the handler as its `args`, e.g. which entry this belongs to. */
  args?: unknown
  /** Whatever the uploader returned, in the order the files were picked. */
  modelValue?: unknown[]
  accept?: string
  maxSizeMb?: number
  /** Lines inside the dashed pick box. */
  lines?: string[]
  /** Offer to record in place as well as pick a file. */
  recorder?: boolean
  recordLabel?: string
  stopLabel?: string
  removeLabel?: string
  deniedLabel?: string
  failedLabel?: string
  tooLargeLabel?: string
  unsupportedLabel?: string
}>(), {
  args: undefined,
  modelValue: () => [],
  accept: 'image/*,audio/*',
  maxSizeMb: 0,
  lines: () => [],
  recorder: false,
  recordLabel: 'Record',
  stopLabel: 'Stop',
  removeLabel: 'Remove',
  deniedLabel: 'No microphone available.',
  failedLabel: 'Upload failed.',
  tooLargeLabel: '"{name}" is larger than {max} MB.',
  unsupportedLabel: '"{name}" is not a supported file type.',
})

const emit = defineEmits<{
  'update:modelValue': [media: unknown[]]
  /** True while anything is still going up, so a page can hold its save button. */
  'busy': [busy: boolean]
}>()

interface Row {
  /** Same name, size and mtime means the same file: picking it twice is one upload. */
  key: string
  name: string
  previewUrl: string
  audio: boolean
  /** From the recorder, so deleting it there removes it here too. */
  recorded: boolean
  percent: number
  status: 'uploading' | 'done' | 'failed'
  result: unknown
}

const ctx = inject<SpecContext | null>(SPEC_CONTEXT, null)
const rows = ref<Row[]>([])
const recordings = ref<File[]>([])
const error = ref('')

const busy = computed(() => rows.value.some(row => row.status === 'uploading'))
watch(busy, value => emit('busy', value))

const keyOf = (file: File) => `${file.name}|${file.size}|${file.lastModified}`

function publish() {
  emit('update:modelValue', rows.value.filter(row => row.status === 'done').map(row => row.result))
}

async function add(file: File, recorded = false) {
  const key = keyOf(file)
  if (rows.value.some(row => row.key === key)) {
    return
  }
  rows.value = [...rows.value, makeRow(file, key, recorded)]
  // The reactive proxy, not the object literal: mutating the literal would
  // leave the progress bar frozen at zero.
  const row = rows.value[rows.value.length - 1]
  const upload = getHandler(props.uploader)
  if (!upload || !ctx) {
    row.status = 'failed'
    error.value = props.failedLabel
    return
  }
  try {
    row.result = await upload({ file, onProgress: (percent: number) => (row.percent = percent) }, ctx, props.args)
    row.percent = 100
    row.status = 'done'
    publish()
  }
  catch (err) {
    console.error(`[UploadQueue] "${props.uploader}" failed:`, err)
    row.status = 'failed'
    error.value = props.failedLabel
  }
}

function makeRow(file: File, key: string, recorded: boolean): Row {
  return {
    key,
    name: file.name,
    previewUrl: URL.createObjectURL(file),
    audio: file.type.startsWith('audio/'),
    recorded,
    percent: 0,
    status: 'uploading',
    result: null,
  }
}

// What the recorder holds is the truth for its own rows: deleting a recording
// there drops it here as well.
watch(recordings, (files) => {
  const kept = new Set(files.map(keyOf))
  rows.value = rows.value.filter(row => !row.recorded || kept.has(row.key))
  for (const file of files) {
    add(file, true)
  }
  publish()
})

function onFiles(files: File[]) {
  error.value = ''
  for (const file of files) {
    add(file)
  }
}

function remove(index: number) {
  const [gone] = rows.value.splice(index, 1)
  if (gone?.previewUrl) {
    URL.revokeObjectURL(gone.previewUrl)
  }
  publish()
}

onBeforeUnmount(() => {
  rows.value.forEach(row => row.previewUrl && URL.revokeObjectURL(row.previewUrl))
})

const BAR = { uploading: 'bg-amber-400', done: 'bg-emerald-500', failed: 'bg-red-500' }
</script>

<template>
  <div class="space-y-3">
    <FileDropZone
      :accept="accept"
      :max-size-mb="maxSizeMb"
      :lines="lines"
      multiple
      :too-large-label="tooLargeLabel"
      :unsupported-label="unsupportedLabel"
      @files="onFiles"
    />

    <VoiceRecorder
      v-if="recorder"
      v-model="recordings"
      :record-label="recordLabel"
      :stop-label="stopLabel"
      :remove-label="removeLabel"
      :denied-label="deniedLabel"
    />

    <ul v-if="rows.length" class="space-y-2">
      <li v-for="(row, i) in rows" :key="row.key" class="rounded-xl bg-gray-100 p-2 dark:bg-white/5">
        <div class="flex items-center gap-2">
          <img v-if="!row.audio" :src="row.previewUrl" :alt="row.name" class="h-10 w-10 flex-shrink-0 rounded object-cover">
          <UIcon v-else name="i-heroicons-microphone" class="h-5 w-5 flex-shrink-0 text-gray-400" />
          <span class="min-w-0 flex-1 truncate text-xs">{{ row.name }}</span>
          <UIcon v-if="row.status === 'done'" name="i-heroicons-check-circle" class="h-4 w-4 flex-shrink-0 text-emerald-500" />
          <UIcon v-else-if="row.status === 'failed'" name="i-heroicons-exclamation-circle" class="h-4 w-4 flex-shrink-0 text-red-500" />
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="2xs"
            :ui="{ rounded: 'rounded-full' }"
            :aria-label="removeLabel"
            @click="remove(i)"
          />
        </div>
        <!-- The bar stays while it is going up, so a slow phone shows movement. -->
        <div v-if="row.status !== 'done'" class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div class="h-full transition-[width] duration-200" :class="BAR[row.status]" :style="{ width: `${row.percent}%` }" />
        </div>
      </li>
    </ul>

    <p v-if="error" class="text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
