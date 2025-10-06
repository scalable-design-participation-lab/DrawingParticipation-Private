<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-xl' }">
    <UCard>
      <!-- Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold">About the Project</h3>
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
          The Northeastern University Environmental Sensor Network is a
          comprehensive monitoring system designed to collect and analyze
          environmental data across campus, providing real-time insights into
          our urban environment.
        </p>

        <div class="space-y-2">
          <h4 class="font-medium">Key Features:</h4>
          <ul class="list-disc list-inside space-y-1 pl-4">
            <li>
              Real-time monitoring of temperature, humidity, and air quality
              metrics
            </li>
            <li>Interactive visualization of environmental data patterns</li>
            <li>Historical data analysis and trend identification</li>
            <li>Community-driven environmental awareness</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p>
            How to Use: Navigate through the dashboard to view sensor data from
            different locations across campus. The interactive map allows you to
            explore specific areas and access detailed environmental metrics.
            This data helps us better understand our campus environment and make
            informed decisions for sustainability initiatives.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" variant="solid" @click="closeModal">
            Close
          </UButton>
        </div>
      </template>
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
