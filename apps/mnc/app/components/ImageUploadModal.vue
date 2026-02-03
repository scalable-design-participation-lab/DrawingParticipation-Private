<template>
  <UCard
    v-if="isVisible"
    class="w-64 bg-black rounded-lg shadow-lg flex flex-col"
  >
    <div class="p-3">
      <div v-if="selectedImage" class="mb-3">
        <img
          :src="selectedImage"
          alt="Selected image"
          class="w-full h-32 object-cover rounded"
        />
      </div>
      <div
        class="relative w-full h-32 bg-slate-800 rounded overflow-hidden mb-3"
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
        >
          <UIcon name="i-heroicons-arrow-up-tray" class="w-12 h-12 mb-2" />
          <p class="text-sm text-center px-4">
            click to select image
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          class="absolute inset-0 opacity-0 cursor-pointer"
          @change="handleImageSelect"
        />
      </div>
      <div v-for="(image, index) in images" :key="index" class="mb-2">
        <div class="flex justify-between items-center text-white text-sm mb-1">
          <span class="truncate max-w-[180px]">{{ image.name }}</span>
          <UIcon
            v-if="image.status === 'success'"
            name="i-heroicons-check"
            class="text-green-500 ml-2 flex-shrink-0"
          />
          <UIcon
            v-else-if="image.status === 'error'"
            name="i-heroicons-x-mark"
            class="text-red-500 ml-2 flex-shrink-0 cursor-pointer"
            @click="removeImage(index)"
          />
          <UIcon
            v-else
            name="i-heroicons-arrow-path"
            class="text-yellow-500 ml-2 flex-shrink-0 animate-spin"
          />
        </div>
        <UProgress
          :value="image.progress"
          :color="getProgressColor(image.status)"
          size="xs"
        />
      </div>

      <UTextarea
        v-model="localComment"
        placeholder="Write a comment"
        class="flex-grow text-sm resize-none mt-4"
      />

      <div class="flex justify-between mt-2">
        <UButton
          color="gray"
          size="sm"
          variant="ghost"
          class="w-[48%] rounded-full flex justify-center"
          @click="closePopup"
        >
          Close
        </UButton>
        <UButton
          color="primary"
          size="sm"
          class="w-[48%] rounded-full flex justify-center"
          @click="addCommentAndUpload"
        >
          {{ existingComment ? 'Update' : 'Add' }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useFeatureStore } from '@base/stores/features'

const props = defineProps({
  isVisible: Boolean,
  featureId: Number,
})

const emit = defineEmits(['close', 'upload'])

const featureStore = useFeatureStore()

const images = ref([])
const selectedImage = ref(null)
const localComment = ref('')
const existingComment = ref('')

// Initialize when component mounts
onMounted(() => {
  if (props.featureId) {
    loadExistingData()
  }
})

// Watch for featureId changes
watch(
  () => props.featureId,
  (newId) => {
    if (newId) {
      loadExistingData()
    }
  },
)

// Watch for visibility changes
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue && props.featureId) {
      loadExistingData()
    }
  },
)

function loadExistingData() {
  const comment = featureStore.getComment(props.featureId)
  existingComment.value = comment
  localComment.value = comment

  // Load existing images if any
  const feature = featureStore.features.find((f) => f.id === props.featureId)
  if (feature?.images) {
    images.value = feature.images.map((img) => ({
      name: img.name,
      progress: 100,
      status: 'success',
    }))
  }
}

function handleImageSelect(event) {
  const fileInput = event.target
  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0]
    selectedImage.value = URL.createObjectURL(file)

    // Clear previous images
    images.value = []

    // Add new images to the list
    for (let i = 0; i < Math.min(fileInput.files.length, 3); i++) {
      const file = fileInput.files[i]
      images.value.push({
        name: `IMG${Math.floor(Math.random() * 10000000)}.jpg (${(
          file.size /
          (1024 * 1024)
        ).toFixed(1)} mb)`,
        progress: 0,
        status: 'uploading',
      })
    }

    simulateUpload()
  }
}

function simulateUpload() {
  images.value.forEach((image, index) => {
    const interval = setInterval(() => {
      if (image.progress < 100) {
        image.progress += 10
      } else {
        clearInterval(interval)
        if (index === 0) image.status = 'success'
        else if (index === 1) image.status = 'error'
      }
    }, 500)
  })
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

function closePopup() {
  emit('close')
}

function addCommentAndUpload() {
  if (props.featureId !== null) {
    featureStore.addComment(props.featureId, localComment.value)
    // Update images in the store
    featureStore.updateFeatureImages(props.featureId, images.value)
    existingComment.value = localComment.value
  }
  console.log('Uploading images:', images.value)
  emit('upload', images.value)
  closePopup()
}

function removeImage(index) {
  images.value.splice(index, 1)
  if (images.value.length === 0) {
    selectedImage.value = null
  }
}
</script>
