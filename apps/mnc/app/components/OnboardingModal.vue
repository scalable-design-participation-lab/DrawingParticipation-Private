<template>
  <UCard
    v-if="isVisible"
    class="onboarding-card max-w-[90vw] w-[500px] max-h-[90vh] overflow-y-auto z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl dark:bg-black"
  >
    <template #header>
      <h3 class="text-xl md:text-2xl font-semibold text-center">
        Welcome to __!
      </h3>
    </template>

    <div class="space-y-8 px-6">
      <p class="leading-tight">
        __ is a platform that __.
      </p>

      <div class="space-y-3 leading-tight">
        <div class="flex items-start space-x-3">
          <UIcon
            name="i-heroicons-map"
            class="flex-shrink-0 w-6 h-6 text-blue-500"
          />
          <p>
            Explore the map and __
          </p>
        </div>

        <div class="flex items-start space-x-3">
          <UIcon
            name="i-heroicons-chat-bubble-left-right"
            class="flex-shrink-0 w-6 h-6 text-blue-500"
          />
          <p>
            Participate in discussions with other users
          </p>
        </div>

        <div class="flex items-start space-x-3">
          <UIcon
            name="i-heroicons-camera"
            class="flex-shrink-0 w-6 h-6 text-blue-500"
          />
          <p>
            Add comments to share memories and ideas for improving the river
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-center my-8 mb-4">
      <UButton
        color="black"
        class="px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        @click="emit('close')"
      >
        Get Started
      </UButton>
    </div>

    <template #footer>
      <p class="text-xs text-gray-500 px-6 py-3 leading-tight text-center">
        Hurtoma is a joint project of <a href="https://www.restartfuture.org/" target="_blank" class="underline hover:no-underline">Restart</a> and <a href="https://northeastern.edu" target="_blank" class="underline hover:no-underline">Northeastern University</a>
      </p>
    </template>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close'])
</script>