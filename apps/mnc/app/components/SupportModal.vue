<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-xl' }">
    <UCard class="dark:bg-black">
      <!-- Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold">Support</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="closeModal"
          />
        </div>
      </template>

      <!-- Content -->
      <div class="space-y-4">
        <p>
          One sentance what is
        </p>

        <div class="space-y-2">
          <h4 class="font-medium">Key features:</h4>
          <ul class="list-disc list-inside space-y-1 pl-4">
            <li>ex. Draw and mark places you visit and use for specific purposes</li>
            <li>ex. Share your experience about feelings of safety and unity</li>
            <li>ex. Contribute to environmental protection</li>
            <li>ex. Learn about the community's opinion</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p>
            ex. How to participate: Use the tools on the left sidebar to mark places and share your experience. Your contribution will help better understand the state of urban space and how to improve it.
          </p>
          <p>Please <a href="/" target="_blank" class="underline hover:no-underline">fill out SOME form</a> if you would like to leave feedback about the platform.</p>
        </div>
      </div>

      <div class="flex justify-center mt-6 mb-2">
          <UButton 
            color="black"
            @click="closeModal"
            class="px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
           >
           Back to Map
          </UButton>
        </div>
    </UCard>
  </UModal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const closeModal = () => {
  isOpen.value = false
}
</script>
