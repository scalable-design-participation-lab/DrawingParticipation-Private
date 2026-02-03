<template>
  <UModal v-model="isOpen" :ui="{ width: 'md:max-w-xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-semibold">Community Participation Map</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p>
          On this map you can see all the marks left by survey participants.
        </p>
        <p>You can:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Click on any marker to see comments</li>
          <li>Change the map type (satellite/scheme)</li>
          <li>Zoom the map for detailed view</li>
        </ul>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="black" variant="solid" @click="closeModal">
            Got it
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import {computed} from 'vue'
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