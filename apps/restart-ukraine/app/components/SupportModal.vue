<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-xl' }">
    <UCard class="dark:bg-black">
      <!-- Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold">Допомога</h3>
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
          «Гуртомá» — проєкт зі спільного створення мапи завдяки містянам, який дозволяє дослідити питання використання й ставлення до навколишнього простору.
        </p>

        <div class="space-y-2">
          <h4 class="font-medium">Ключові особливості:</h4>
          <ul class="list-disc list-inside space-y-1 pl-4">
            <li>Малюйте та позначайте місця, які ви відвідуєте та використовуєте для певної мети</li>
            <li>Діліться своїм досвідом про відчуття безпеки та єдності</li>
            <li>Робіть внесок у захист довкілля</li>
            <li>Знайомтесь з думкою спільноти</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p>
            Як долучитися: Використовуйте інструменти на лівій панелі збоку, щоб позначати місця та ділитися своїм досвідом. Ваш внесок дозволить краще зрозуміти, в якому стані міський простір та як його покращити.
          </p>
          <p>Будь ласка, <a href="https://forms.gle/6d8GuBSPaingSR4L6" target="_blank" class="underline hover:no-underline">заповніть форму</a>, якщо бажаєте залишити відгук про платформу.</p>
        </div>
      </div>

      <div class="flex justify-center mt-6 mb-2">
          <UButton 
            color="black"
            @click="closeModal"
            class="px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
           >
           Повернутися до карти
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
