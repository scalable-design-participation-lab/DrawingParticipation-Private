/**
 * Welcome back modal component
 * 
 * Displays a friendly welcome message when a returning user is detected.
 * Shows user's name or email and provides a continue button.
 */
<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

/**
 * Welcome back modal component events.
 *
 * @category Components
 */
const emit = defineEmits(['close'])

/** Whether the modal is open */
const isOpen = ref(true)

/**
 * Handles continue action and closes the modal
 */
const handleContinue = () => {
  isOpen.value = false
  emit('close')
}
</script>

<template>
  <UModal v-model="isOpen">
    <UCard
      :ui="{
        base: 'dark:bg-background-dark',
        body: { padding: 'p-4' },
      }"
    >
      <template #header>
        <div class="text-center">
          <h3 class="text-xl font-semibold">Welcome Back</h3>
        </div>
      </template>

      <div class="text-center">
        <p class="mb-4">Great to see you again!</p>
        <p class="text-sm text-gray-600" v-if="userStore.userData?.name?.firstname || userStore.userData?.name?.lastname">
          {{ userStore.userData?.name?.firstname }} {{ userStore.userData?.name?.lastname }}
        </p>
        <p class="text-sm text-gray-600" v-else-if="userStore.userData?.email">
          {{ userStore.userData?.email }}
        </p>
      </div>
      <div class="flex justify-center">
        <UButton 
          :ui="{ base: 'my-2 py-3 px-6 rounded-full flex place-self-end hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white' }"
          color="black" 
          variant="solid" 
          @click="handleContinue">
          Continue
        </UButton>
      </div>
    </UCard>
  </UModal>
</template>
