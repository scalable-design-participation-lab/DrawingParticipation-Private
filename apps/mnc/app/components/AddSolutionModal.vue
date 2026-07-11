<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { toLonLat } from 'ol/proj'
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
    files: File[]
  }]
  close: []
}>()

const { t, locale } = useI18n()

const themes = ref<string[]>([...PRIMARY_TAGS])

const form = reactive({
  title: '',
  primaryTag: '',
  location: '',
  shortDesc: '',
  description: '',
})
const mediaFiles = ref<File[]>([])
const error = ref('')
const geocoding = ref(false)

// Location, a theme and a title are required; the location is normally
// auto-filled from the clicked point, but must not be blank.
const canSubmit = computed(() =>
  form.title.trim().length > 0
  && form.primaryTag.length > 0
  && form.location.trim().length > 0,
)

// Reverse-geocode the clicked point into a "City, Country" label so entries
// always carry a real place (OpenStreetMap Nominatim, no API key needed). The
// accept-language is pinned to the app locale so place names match the UI
// (otherwise Nominatim returns them in the browser's language).
onMounted(async () => {
  try {
    geocoding.value = true
    const [lon, lat] = toLonLat(props.coordinate)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=${locale.value || 'en'}`,
    )
    if (res.ok) {
      const a = (await res.json())?.address || {}
      const city = a.city || a.town || a.village || a.county || a.state || ''
      const country = a.country || ''
      const label = [city, country].filter(Boolean).join(', ')
      if (label && !form.location.trim())
        form.location = label
    }
  }
  catch {
    // Offline / rate-limited: the user can still type the location manually.
  }
  finally {
    geocoding.value = false
  }
})

function onCreateTheme(newTheme: string) {
  if (newTheme && !themes.value.includes(newTheme))
    themes.value.push(newTheme)
  form.primaryTag = newTheme
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files)
    mediaFiles.value = Array.from(input.files)
}

function submit() {
  if (!canSubmit.value) {
    error.value = t('add.required')
    return
  }
  emit('save', {
    title: form.title.trim(),
    primaryTag: form.primaryTag,
    location: form.location.trim(),
    shortDesc: form.shortDesc.trim(),
    description: form.description.trim(),
    coordinate: props.coordinate,
    files: mediaFiles.value,
  })
}
</script>

<template>
  <AppModal :title="$t('add.title')" @close="emit('close')">
    <div class="space-y-4">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ $t('add.titleLabel') }}</label>
        <UInput v-model="form.title" :placeholder="$t('add.titlePlaceholder')" />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ $t('add.theme') }}</label>
        <USelectMenu
          v-model="form.primaryTag"
          :options="themes"
          searchable
          creatable
          :placeholder="$t('add.themePlaceholder')"
          @create="onCreateTheme"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ $t('add.location') }}
          <span v-if="geocoding" class="font-normal text-gray-400">· {{ $t('add.detecting') }}</span>
        </label>
        <UInput v-model="form.location" :placeholder="$t('add.locationPlaceholder')" />
        <p class="mt-1 text-xs text-gray-400">{{ $t('add.locationHint') }}</p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ $t('add.shortDesc') }}</label>
        <UTextarea v-model="form.shortDesc" :rows="2" :placeholder="$t('add.shortDescPlaceholder')" />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ $t('add.fullDesc') }}</label>
        <UTextarea v-model="form.description" :rows="4" />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ $t('add.media') }}</label>
        <!-- Custom, translatable file control (the native input button renders in
             the browser's language, which wouldn't match the app). -->
        <div class="flex items-center gap-3">
          <label class="inline-flex cursor-pointer items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300">
            <input type="file" accept="image/*,audio/*" multiple class="hidden" @change="onFiles" />
            {{ $t('add.chooseFiles') }}
          </label>
          <span class="text-sm text-gray-400">
            {{ mediaFiles.length ? $t('add.filesSelected', { n: mediaFiles.length }) : $t('add.noFile') }}
          </span>
        </div>
      </div>

      <p class="text-xs text-gray-400">{{ $t('add.pinNote') }}</p>
      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="emit('close')">{{ $t('add.cancel') }}</UButton>
        <UButton color="primary" :disabled="!canSubmit" @click="submit">{{ $t('add.submit') }}</UButton>
      </div>
    </template>
  </AppModal>
</template>
