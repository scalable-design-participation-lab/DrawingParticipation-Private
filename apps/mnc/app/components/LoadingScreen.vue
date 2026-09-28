<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50"
  >
    <div class="text-center">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin"
      />
      <h2 class="text-2xl font-semibold mb-2">Loading Map</h2>
      <p class="text-gray-600 dark:text-gray-400">Please wait...</p>

      <!-- Progress Bar -->
      <div class="mt-6 max-w-md mx-auto">
        <UProgress :value="progress" color="blue" class="w-64" />
        <p class="mt-2 text-sm text-gray-500">{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const progress = ref(0)
const loadingMessage = ref('Initializing...')

const loadingMessages = [
  'Initializing...',
  'Loading map...',
  'Preparing data...',
  'Almost ready...',
]

onMounted(() => {
  let messageIndex = 0
  const interval = setInterval(() => {
    progress.value += 2
    if (progress.value >= 100) {
      clearInterval(interval)
      return
    }

    // Update loading message
    if (
      progress.value > messageIndex * 25 &&
      messageIndex < loadingMessages.length
    ) {
      loadingMessage.value = loadingMessages[messageIndex]
      messageIndex++
    }
  }, 50)
})
</script>