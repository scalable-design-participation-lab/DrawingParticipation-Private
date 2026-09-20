<template>
  <UCard
    v-if="isVisible"
    class="dark:bg-black shadow-lg flex flex-col"
  >
    <UTextarea
      v-model="localComment"
      placeholder="write a comment"
      class="flex-grow text-sm resize-none"
      @input="handleInput"
    />
    <div class="flex justify-between mt-4">
      <UButton
        color="black"
        variant="ghost"
        class="rounded-full flex justify-center"
        @click="closePopup"
      >
        Close
      </UButton>
      <UButton
        color="black"
        class="px-5 py-2 rounded-full flex justify-center hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        @click="addComment"
      >
        {{ existingComment ? 'Update' : 'Add' }}
      </UButton>
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

const emit = defineEmits(['close'])

const featureStore = useFeatureStore()
const localComment = ref('')
const existingComment = ref('')

// Initialize when component mounts
onMounted(() => {
  if (props.featureId) {
    loadExistingComment()
  }
})

// Watch for featureId changes
watch(
  () => props.featureId,
  (newId) => {
    if (newId) {
      loadExistingComment()
    }
  },
)

// Watch for visibility changes
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue && props.featureId) {
      loadExistingComment()
    }
  },
)

function loadExistingComment() {
  const comment = featureStore.getComment(props.featureId)
  existingComment.value = comment
  localComment.value = comment
}

function handleInput(event) {
  localComment.value = event.target.value
}

function addComment() {
  if (props.featureId !== null) {
    featureStore.addComment(props.featureId, localComment.value)
    existingComment.value = localComment.value
    closePopup()
  }
}

function closePopup() {
  emit('close')
}
</script>