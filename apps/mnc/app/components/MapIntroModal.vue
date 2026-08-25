<template>
  <UModal v-model="isOpen" :ui="{ width: 'md:max-w-xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-semibold">Mobile Networked Creativity Map</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p>
          This map gathers real-world case studies of mobile and networked
          creativity from communities around the world.
        </p>
        <p>You can:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Click any pin to read the full case study</li>
          <li>Switch the basemap between map and satellite views</li>
          <li>Add your own photos and comments to a case study</li>
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