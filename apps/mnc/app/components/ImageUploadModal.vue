<template>
  <UCard
    v-if="isVisible"
    class="w-72 bg-black rounded-lg shadow-lg flex flex-col"
  >
    <div class="p-3">
      <div class="mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-camera" class="h-4 w-4 text-gray-300" />
        <span class="text-sm font-medium text-white">{{ $t('detail.addPhoto') }}</span>
      </div>

      <!-- Live previews of the media chosen this session -->
      <div v-if="items.length" class="grid grid-cols-3 gap-2 mb-3">
        <template v-for="(item, i) in items" :key="`thumb-${i}`">
          <img
            v-if="!item.isAudio"
            :src="item.previewUrl"
            :alt="item.fileName"
            class="h-16 w-full object-contain rounded bg-slate-800"
          />
          <div
            v-else
            class="h-16 w-full rounded bg-slate-700 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-musical-note" class="h-6 w-6 text-teal-300" />
          </div>
        </template>
      </div>

      <!-- File picker: photos or audio. -->
      <div
        class="relative w-full h-32 bg-slate-800 rounded overflow-hidden mb-3"
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
        >
          <UIcon name="i-heroicons-arrow-up-tray" class="w-10 h-10 mb-2" />
          <p class="text-sm text-center px-4">
            {{ $t('upload.clickToSelect') }}
          </p>
          <p class="text-xs text-center px-4 text-gray-500 mt-1">
            {{ $t('upload.hint') }}
          </p>
        </div>
        <input
          type="file"
          accept="image/*,audio/*"
          multiple
          class="absolute inset-0 opacity-0 cursor-pointer"
          @change="handleImageSelect"
        />
      </div>

      <!-- Per-file upload status with real progress -->
      <div v-for="(item, index) in items" :key="`progress-${index}`" class="mb-2">
        <div class="flex justify-between items-center text-white text-sm mb-1">
          <span class="truncate max-w-[200px]">{{ item.label }}</span>
          <UIcon
            v-if="item.status === 'success'"
            name="i-heroicons-check"
            class="text-green-500 ml-2 flex-shrink-0"
          />
          <UIcon
            v-else-if="item.status === 'error'"
            name="i-heroicons-x-mark"
            class="text-red-500 ml-2 flex-shrink-0 cursor-pointer"
            @click="removeItem(index)"
          />
          <UIcon
            v-else
            name="i-heroicons-arrow-path"
            class="text-yellow-500 ml-2 flex-shrink-0 animate-spin"
          />
        </div>
        <UProgress
          :value="item.progress"
          :color="getProgressColor(item.status)"
          size="xs"
        />
      </div>

      <UTextarea
        v-model="localComment"
        :placeholder="$t('upload.commentPlaceholder')"
        class="flex-grow text-sm resize-none mt-4"
      />

      <p class="text-[11px] leading-snug text-gray-500 mt-2">
        {{ $t('upload.publicNote') }}
      </p>

      <p v-if="errorMessage" class="text-xs text-red-400 mt-2">
        {{ errorMessage }}
      </p>

      <div class="flex justify-between mt-2">
        <UButton
          color="gray"
          size="sm"
          variant="ghost"
          class="w-[48%] rounded-full flex justify-center"
          @click="closePopup"
        >
          {{ $t('upload.close') }}
        </UButton>
        <UButton
          color="primary"
          size="sm"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          class="w-[48%] rounded-full flex justify-center"
          @click="submitContribution"
        >
          {{ $t('detail.add') }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useContributionsStore } from '../stores/contributions'

const props = defineProps({
  isVisible: Boolean,
  // The MNC project this contribution attaches to (mncData.json `string_id`).
  projectId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'uploaded'])

const { t } = useI18n()
const contributions = useContributionsStore()

// View-models tracking each selected file's real upload progress + result.
const items = ref([])
const localComment = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

// "Add" is enabled once nothing is still uploading and the user has provided
// SOMETHING — a comment on its own is enough; media is optional (and vice versa).
const canSubmit = computed(() => {
  const anyUploading = items.value.some(item => item.status === 'uploading')
  const hasMedia = items.value.some(item => item.status === 'success')
  const hasComment = localComment.value.trim().length > 0
  return !isSubmitting.value && !anyUploading && (hasMedia || hasComment)
})

async function handleImageSelect(event) {
  const fileInput = event.target
  if (!fileInput.files || fileInput.files.length === 0)
    return

  errorMessage.value = ''

  // Accept photos and audio clips.
  const picked = Array.from(fileInput.files).filter(file =>
    file.type.startsWith('image/') || file.type.startsWith('audio/'),
  )

  for (const file of picked) {
    items.value.push({
      fileName: file.name,
      label: `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      previewUrl: URL.createObjectURL(file),
      isAudio: file.type.startsWith('audio/'),
      progress: 0,
      status: 'uploading',
      media: null,
    })
    // Grab the reactive proxy for the item we just pushed. Mutating this proxy
    // (not the raw object literal) is what triggers Vue 3 reactivity, so the
    // progress bar, status icon, and `canSubmit` actually update. The proxy
    // reference stays valid even if the array is spliced (e.g. removeItem).
    const item = items.value[items.value.length - 1]

    // Kick off the real Firebase Storage upload and stream progress.
    try {
      const media = await contributions.uploadFile(
        props.projectId,
        file,
        (percent) => {
          item.progress = percent
        },
      )
      item.media = media
      item.progress = 100
      item.status = 'success'
    }
    catch (err) {
      console.error('Image upload failed:', err)
      item.status = 'error'
      errorMessage.value = t('upload.uploadError')
    }
  }

  // Allow re-selecting the same file again later.
  fileInput.value = ''
}

async function submitContribution() {
  if (!canSubmit.value)
    return

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const media = items.value
      .filter(item => item.status === 'success' && item.media)
      .map(item => item.media)

    await contributions.addContribution(props.projectId, {
      comment: localComment.value.trim(),
      media,
    })

    // Refresh the cached list so the new contribution shows up immediately.
    await contributions.fetchContributions(props.projectId)

    emit('uploaded')
    // closePopup() runs resetState(), which revokes the preview object URLs.
    closePopup()
  }
  catch (err) {
    console.error('Failed to save contribution:', err)
    errorMessage.value = t('upload.saveError')
  }
  finally {
    isSubmitting.value = false
  }
}

function getProgressColor(status) {
  switch (status) {
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    default:
      return 'yellow'
  }
}

function removeItem(index) {
  const [removed] = items.value.splice(index, 1)
  if (removed?.previewUrl)
    URL.revokeObjectURL(removed.previewUrl)
}

function resetState() {
  items.value.forEach(item => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
  items.value = []
  localComment.value = ''
  errorMessage.value = ''
}

function closePopup() {
  // Revoke any outstanding preview object URLs on every close path (Close
  // button, mid-upload close, or post-submit), then notify the parent.
  resetState()
  emit('close')
}
</script>
