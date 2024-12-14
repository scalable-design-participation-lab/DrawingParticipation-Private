<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="text-center">
          <UIcon
            name="i-heroicons-hand-raised"
            class="text-blue-500 w-16 h-16 mx-auto mb-4"
          />
          <h3 class="text-xl font-semibold">Ласкаво просимо!</h3>
        </div>
      </template>

      <div class="p-4 text-center">
        <p class="mb-4">Раді бачити вас знову в Гуртома́!</p>
        <p class="text-sm text-gray-600">
          {{ userData?.name?.firstname }} {{ userData?.name?.lastname }}
        </p>
      </div>

      <template #footer>
        <div class="flex justify-center">
          <UButton color="black" variant="solid" @click="handleContinue">
            Продовжити
          </UButton>
        </div>
      </template>
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
