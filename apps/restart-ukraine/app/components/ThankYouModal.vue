<template>
  <UModal v-model="isOpen" :ui="{ width: 'md:max-w-xl' }">
    <UCard>
      <template #header>
          <h3 class="flex place-content-center text-xl font-semibold">Дякуємо за участь!</h3>
      </template>

      <div class="space-y-4">
        <p>
          Дякуємо за участь в опитуванні. Завдяки вам ми на крок ближче до оновлення території навколо річки Тяжилівка.
        </p>
        <p>Запрошуйте друзів реєструватись на платформі та дивіться результати інших учасників.</p>
      </div>

      <template #footer>
        <div class="flex place-content-center gap-2">
          <UButton color="black" variant="solid" class="rounded-full px-6 py-3" @click="viewResults">
            Переглянути результати
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function viewResults() {
  isOpen.value = false
  router.push({
    path: '/map',
    query: { showIntro: 'false' },
  })
}
</script>
