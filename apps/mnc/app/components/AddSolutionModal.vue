<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { PRIMARY_TAGS } from '../stores/filter'

const props = defineProps<{
  coordinate: [number, number]
}>()

const emit = defineEmits<{
  save: [payload: {
    title: string
    primaryTag: string
    location: string
    shortDesc: string
    description: string
    coordinate: [number, number]
  }]
  close: []
}>()

const themes = [...PRIMARY_TAGS]

const form = reactive({
  title: '',
  primaryTag: '',
  location: '',
  shortDesc: '',
  description: '',
})
const error = ref('')

const canSubmit = computed(() => form.title.trim().length > 0 && form.primaryTag.length > 0)

function submit() {
  if (!canSubmit.value) {
    error.value = 'A title and a theme are required.'
    return
  }
  emit('save', {
    title: form.title.trim(),
    primaryTag: form.primaryTag,
    location: form.location.trim(),
    shortDesc: form.shortDesc.trim(),
    description: form.description.trim(),
    coordinate: props.coordinate,
  })
}
</script>

<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add a Solution</h3>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            aria-label="Close"
            @click="emit('close')"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Title</label>
          <UInput v-model="form.title" placeholder="e.g. Solar-powered community water pump" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Theme</label>
          <USelectMenu
            v-model="form.primaryTag"
            :options="themes"
            placeholder="Select a theme"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
          <UInput v-model="form.location" placeholder="e.g. Nairobi, Kenya" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Short description</label>
          <UTextarea v-model="form.shortDesc" :rows="2" placeholder="One-line summary" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Full description (optional)</label>
          <UTextarea v-model="form.description" :rows="4" />
        </div>

        <p class="text-xs text-gray-400">
          Pin location set from where you clicked the map. You can add photos after creating it.
        </p>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="emit('close')">Cancel</UButton>
          <UButton color="primary" :disabled="!canSubmit" @click="submit">Add to map</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
