<!--
 * DownloadPopup Component
 * 
 * This component provides a popup interface for configuring and initiating data downloads.
 * It includes filter options, file format selection, and download controls.
 * The component uses a GenericFilterSidebar for filter management and emits events for
 * closing the popup and initiating the download.
 * 
 * @component
 * @example
 * <DownloadPopup
 *   :filter-sections="downloadFilterSections"
 *   @close="closeDownloadPopup"
 *   @download="handleDataDownload"
 * />
 -->

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center"
      data-test="download-popup"
      @click="handleOutsideClick"
    >
      <GenericFilterSidebar
        :is-visible="true"
        title="Download Options"
        :filter-sections="filterSections"
        @close="$emit('close')"
        @filter-change="handleFilterChange"
        @download="handleDownload"
      >
        <template #before-filters>
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">File Format</h3>
            <div class="flex space-x-4">
              <URadio
                v-model="fileFormat"
                name="file-format"
                value="json"
                label="JSON"
                class="flex-1"
                data-test="file-format-option-json"
              />
              <URadio
                v-model="fileFormat"
                name="file-format"
                value="csv"
                label="CSV"
                class="flex-1"
                data-test="file-format-option-csv"
              />
            </div>
          </div>
        </template>
        <template #footer-buttons>
          <UButton
            color="gray"
            variant="soft"
            @click="$emit('close')"
            data-test="cancel-button"
          >
            Cancel
          </UButton>
          <UButton
            color="blue"
            variant="solid"
            class="transition-colors duration-200 hover:bg-blue-600 hover:text-white"
            @click="handleDownload"
            data-test="download-button"
          >
            <template #leading>
              <UIcon name="i-heroicons-arrow-down-tray" />
            </template>
            Download
          </UButton>
        </template>
      </GenericFilterSidebar>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Props for the DownloadPopup component
 * @typedef {Object} DownloadPopupProps
 * @property {Array} filterSections - Configuration for the filter sections
 */

/**
 * @type {import('vue').PropType<DownloadPopupProps>}
 */
const props = defineProps({
  filterSections: {
    type: Array,
    required: true,
  },
})

/**
 * Emits events for closing the popup and initiating the download
 * @type {(e: 'close' | 'download', payload?: any) => void}
 */
const emit = defineEmits(['close', 'download'])

/**
 * Stores the selected filter values
 * @type {import('vue').Ref<Record<string, any>>}
 */
const selectedFilters = ref<Record<string, any>>({})

/**
 * Stores the selected file format
 * @type {import('vue').Ref<'json' | 'csv'>}
 */
const fileFormat = ref<'json' | 'csv'>('json')

/**
 * Watches for changes in filter sections and updates selectedFilters
 */
watch(
  () => props.filterSections,
  (newSections) => {
    newSections.forEach((section: any) => {
      selectedFilters.value[section.name] = section.props.modelValue
    })
  },
  { immediate: true }
)

/**
 * Handles changes in filter values
 * @param {Object} filterData - The updated filter data
 * @param {string} filterData.name - The name of the changed filter
 * @param {any} filterData.value - The new value of the filter
 */
const handleFilterChange = (filterData: { name: string; value: any }) => {
  const { name, value } = filterData
  selectedFilters.value[name] = value
}

/**
 * Initiates the download process
 * Emits a 'download' event with selected filters and file format
 */
const handleDownload = () => {
  emit('download', { filters: selectedFilters.value, format: fileFormat.value })
}

/**
 * Handles clicks outside the GenericFilterSidebar
 * @param {Event} event - The click event object
 */
const handleOutsideClick = (event: Event) => {
  // Check if the click event occurred outside the GenericFilterSidebar
  if ((event.target as HTMLElement).classList.contains('bg-black')) {
    emit('close')
  }
}
</script>
