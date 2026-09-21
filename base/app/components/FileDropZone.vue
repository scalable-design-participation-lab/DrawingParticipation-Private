<!--
 * FileDropZone
 *
 * Drag-and-drop / click-to-browse file picker, in two shapes:
 *
 * - headless: the default slot draws the zone and gets `dragging`, and every
 *   pick arrives as a `files` event;
 * - bound: give it `modelValue` and it keeps the list itself, drawing the
 *   picked files as removable rows and refusing anything over `maxSizeMb` or
 *   outside `accept`.
 *
 * Every label is a prop, so an app passes its own "$t." keys.
 *
 * @usage
 * <FileDropZone accept="image/*" @files="onFiles" v-slot="{ dragging }">
 *   <div :class="{ 'bg-gray-100': dragging }">Drop a photo here</div>
 * </FileDropZone>
 -->

<script setup lang="ts">
// Explicit, not Nuxt's auto-import: base components are mounted in tests and
// inside apps that need not share the same auto-import config.
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
  // 'environment' opens the rear camera on phones.
  capture?: 'user' | 'environment'
  /** Lines drawn inside a dashed box when no default slot is given. */
  lines?: string[]
  /** Bound mode: the files picked so far. */
  modelValue?: File[] | null
  /** Largest file accepted, in MB. Zero is no limit. */
  maxSizeMb?: number
  removeLabel?: string
  /** "{name} is larger than {max} MB." with those two placeholders. */
  tooLargeLabel?: string
  /** "{name} is not a supported file type." */
  unsupportedLabel?: string
}>(), {
  accept: '',
  multiple: false,
  capture: undefined,
  lines: () => [],
  modelValue: null,
  maxSizeMb: 0,
  removeLabel: 'Remove',
  tooLargeLabel: '"{name}" is larger than {max} MB.',
  unsupportedLabel: '"{name}" is not a supported file type.',
})

const emit = defineEmits<{
  'files': [files: File[]]
  'update:modelValue': [files: File[]]
}>()

const dragging = ref(false)
// Name of the last file chosen, so the default box can confirm the pick.
const picked = ref('')
const error = ref('')

const bound = computed(() => Array.isArray(props.modelValue))

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
}

/** The accept list is a hint: reject an obvious mismatch, allow the rest. */
function allowed(file: File) {
  if (props.maxSizeMb && file.size > props.maxSizeMb * 1024 * 1024) {
    error.value = fill(props.tooLargeLabel, { name: file.name, max: props.maxSizeMb })
    return false
  }
  const patterns = props.accept.split(',').map(s => s.trim()).filter(Boolean)
  if (!patterns.length) {
    return true
  }
  const ok = patterns.some(pattern => (pattern.endsWith('/*')
    ? file.type.startsWith(pattern.slice(0, -1))
    : pattern.startsWith('.')
      ? file.name.toLowerCase().endsWith(pattern.toLowerCase())
      : file.type === pattern))
  if (!ok) {
    error.value = fill(props.unsupportedLabel, { name: file.name })
  }
  return ok
}

function take(list: FileList | null | undefined) {
  error.value = ''
  const files = Array.from(list ?? []).filter(allowed)
  if (!files.length) {
    return
  }
  const kept = props.multiple ? files : files.slice(0, 1)
  picked.value = kept.length > 1 ? `${kept.length} files` : kept[0].name
  emit('files', kept)
  if (bound.value) {
    emit('update:modelValue', props.multiple ? [...(props.modelValue ?? []), ...kept] : kept)
  }
}

function remove(index: number) {
  emit('update:modelValue', (props.modelValue ?? []).filter((_, i) => i !== index))
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  take(input.files)
  // Reset so picking the same file twice still fires `change`.
  input.value = ''
}

const prettySize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)
</script>

<template>
  <div>
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
          <UIcon v-if="picked && !bound" name="i-heroicons-check-circle" class="h-6 w-6 text-primary-500" />
          <UIcon v-else name="i-heroicons-arrow-up-tray" class="h-6 w-6 text-gray-400" />
          <span v-for="line in (picked && !bound ? [picked] : lines)" :key="line">{{ line }}</span>
        </span>
      </slot>
    </label>

    <ul v-if="bound && modelValue?.length" class="mt-3 space-y-2">
      <li
        v-for="(file, i) in modelValue"
        :key="`${file.name}-${i}`"
        class="flex items-center justify-between gap-2 rounded-xl bg-gray-100 px-3 py-2 dark:bg-white/5"
      >
        <span class="flex min-w-0 items-center gap-2">
          <UIcon name="i-heroicons-document" class="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span class="truncate text-sm">{{ file.name }}</span>
          <span class="flex-shrink-0 text-xs text-gray-400">{{ prettySize(file.size) }}</span>
        </span>
        <UButton
          icon="i-heroicons-x-mark"
          color="gray"
          variant="ghost"
          size="2xs"
          :ui="{ rounded: 'rounded-full' }"
          :aria-label="removeLabel"
          @click.prevent="remove(i)"
        />
      </li>
    </ul>

    <p v-if="error" class="mt-2 text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
