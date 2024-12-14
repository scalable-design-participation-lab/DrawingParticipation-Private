<template>
  <UModal v-model="isOpen" :ui="{ width: 'md:max-w-xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-semibold">Карта громадської участі</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p>
          На цій карті ви можете побачити всі позначки, які залишили учасники
          опитування.
        </p>
        <p>Ви можете:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Натиснути на будь-яку позначку, щоб побачити коментарі</li>
          <li>Змінювати тип карти (супутник/схема)</li>
          <li>Масштабувати карту для детального перегляду</li>
        </ul>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="black" variant="solid" @click="closeModal">
            Зрозуміло
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function closeModal() {
  isOpen.value = false
}
</script>
