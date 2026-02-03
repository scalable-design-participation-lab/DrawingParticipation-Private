<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-lg' }">
    <UCard class="dark:bg-black">
      <template #header>
        <div class="flex place-content-center">
          <h3 class="text-xl font-semibold">Access to Open Data</h3>
          <!-- <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="closeModal"
          /> -->
        </div>
      </template>

      <p class="text-center leading-tight">
        We are working to make the data created on the platform open and accessible to everyone. Check back soon for updates.
      </p>

      <div class="flex justify-center my-8 mb-4">
        <UButton
          color="black"
          class="px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
          @click="closeModal"
        >
        Back to Map
        </UButton>
      </div>

      <!-- <div class="space-y-6 px-1">
        <div class="space-y-2">
          <label class="font-medium text-gray-700">Select Data Type:</label>
          <USelect
            v-model="selectedDataType"
            :options="dataTypes"
            placeholder="Choose data type"
          />
        </div>

        <div class="space-y-2">
          <label class="font-medium text-gray-700">File Format:</label>
          <div class="flex gap-4 mt-2">
            <URadio
              v-for="format in fileFormats"
              :key="format.value"
              v-model="fileFormat"
              :name="format.value"
              :label="format.label"
              :value="format.value"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <UButton color="gray" variant="soft" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isLoading"
            :disabled="!isFormValid"
            @click="handleDownload"
          >
            <template #leading>
              <UIcon name="i-heroicons-arrow-down-tray-20-solid" />
            </template>
            Download
          </UButton>
        </div> 
      </div> -->
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// import { getFirestore, collection, getDocs } from 'firebase/firestore'
// import { useFirebaseApp } from 'vuefire'

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
