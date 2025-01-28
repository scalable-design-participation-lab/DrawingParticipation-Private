<template>
  <UModal v-model="isOpen">
    <UCard class="dark:bg-zinc-950">
      <template #header>
        <div class="text-center">
          <h3 class="text-xl font-semibold">Ласкаво просимо</h3>
        </div>
      </template>

      <div class="p-4 text-center">
        <p class="mb-4">Рада бачити вас знову на платформі Гуртомá!</p>
        <p class="text-sm text-gray-600">
          {{ userData?.name?.firstname }} {{ userData?.name?.lastname }}
        </p>
      </div>
      <div class="flex justify-center">
          <UButton 
            class="my-2 py-3 px-6 rounded-full flex place-self-end hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
            color="black" 
            variant="solid" 
            @click="handleContinue">
            Продовжити
          </UButton>
        </div>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])
const isOpen = ref(true)

const handleContinue = () => {
  isOpen.value = false
  emit('close')
}
</script>
