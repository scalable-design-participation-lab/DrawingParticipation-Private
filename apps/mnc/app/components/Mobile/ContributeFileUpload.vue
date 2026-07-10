<script setup lang="ts">
import { ref } from 'vue'

/**
 * Front-end-only file dropzone used by the mobile "Join Our Research" flow.
 *
 * It collects File objects into a v-model array and shows them as removable
 * chips — nothing is uploaded anywhere yet (persistence is intentionally
 * deferred until the submission content model is finalized).
 */
const props = withDefaults(defineProps<{
  modelValue: File[]
  // Comma-separated MIME/extension hints passed to the native input.
  accept?: string
  // Small grey helper line under the prompt.
  hint?: string
  maxSizeMb?: number
}>(), {
  accept: 'image/png,image/jpeg,application/pdf',
  hint: '',
  maxSizeMb: 10,
})

const { t } = useI18n()

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const error = ref('')

function isAllowed(file: File): boolean {
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    error.value = t('fileUpload.tooLarge', { name: file.name, max: props.maxSizeMb })
    return false
  }
  // Loose type check: the accept list is a hint, so we only reject obvious
  // mismatches (e.g. a .txt) while staying permissive for images/pdf/video.
  const allowed = props.accept.split(',').map(s => s.trim()).filter(Boolean)
  const ok = allowed.some((a) => {
    if (a.endsWith('/*'))
      return file.type.startsWith(a.slice(0, -1))
    if (a.startsWith('.'))
      return file.name.toLowerCase().endsWith(a)
    return file.type === a
  })
  if (!ok) {
    error.value = t('fileUpload.unsupported', { name: file.name })
    return false
  }
  return true
}

function addFiles(fileList: FileList | null) {
  if (!fileList || fileList.length === 0)
    return
  error.value = ''
  const accepted = Array.from(fileList).filter(isAllowed)
  if (accepted.length)
    emit('update:modelValue', [...props.modelValue, ...accepted])
}

function onSelect(event: Event) {
  const target = event.target as HTMLInputElement
  addFiles(target.files)
  // Allow re-selecting the same file later.
  target.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  addFiles(event.dataTransfer?.files ?? null)
}

function removeFile(index: number) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}

function prettySize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div>
    <div
      class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition-colors"
      :class="isDragging ? 'border-[#FB6D6D] bg-[#FCEAEA]' : 'border-[#F5B5B5] bg-white'"
      role="button"
      tabindex="0"
      @click="inputEl?.click()"
      @keydown.enter.prevent="inputEl?.click()"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <UIcon name="i-heroicons-cloud-arrow-up" class="mb-2 h-7 w-7 text-[#FB6D6D]" />
      <p class="text-sm font-medium text-[#F26D6D]">
        {{ $t('fileUpload.prompt') }}
      </p>
      <p class="mt-1 text-xs text-[#F2A3A3]">
        {{ hint || $t('fileUpload.hint') }}
      </p>
      <input
        ref="inputEl"
        type="file"
        :accept="accept"
        multiple
        class="hidden"
        @change="onSelect"
      >
    </div>

    <ul v-if="modelValue.length" class="mt-3 space-y-2">
      <li
        v-for="(file, i) in modelValue"
        :key="`${file.name}-${i}`"
        class="flex items-center justify-between rounded-xl bg-[#FCEAEA] px-3 py-2"
      >
        <span class="flex min-w-0 items-center gap-2">
          <UIcon name="i-heroicons-document" class="h-4 w-4 flex-shrink-0 text-[#FB6D6D]" />
          <span class="truncate text-sm text-gray-700">{{ file.name }}</span>
          <span class="flex-shrink-0 text-xs text-gray-400">{{ prettySize(file.size) }}</span>
        </span>
        <UButton
          icon="i-heroicons-x-mark"
          color="gray"
          variant="ghost"
          size="2xs"
          :ui="{ rounded: 'rounded-full' }"
          :aria-label="$t('fileUpload.removeFile')"
          @click.stop="removeFile(i)"
        />
      </li>
    </ul>

    <p v-if="error" class="mt-2 text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
