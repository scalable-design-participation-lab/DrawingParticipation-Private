<!--
 * GenericFilterSidebar Component
 * 
 * This component provides a reusable and customizable filter sidebar.
 * It displays a list of filter sections, each containing specific filter
 * components (e.g., checkboxes, date pickers). The sidebar is designed
 * to be flexible and can be used across different parts of the application
 * for various filtering needs.
 * 
 * @displayName GenericFilterSidebar
 * @usage
 * <GenericFilterSidebar
 *   :is-visible="showFilters"
 *   :filter-sections="filterConfig"
 *   @close="closeFilters"
 *   @reset="resetFilters"
 *   @filter-change="handleFilterChange"
 * />
 -->
<template>
  <div v-if="isVisible" class="pointer-events-auto">
    <UCard
      :ui="{
        base: 'overflow-visible bg-white shadow-lg rounded-lg w-[340px] sm:w-[360px] max-h-[85vh]',
        header: { padding: 'px-6 py-4' },
        body: { base: 'overflow-y-auto px-6 py-4' },
        footer: { padding: 'px-6 py-4' },
      }"
      class="filter-sidebar"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
            {{ title }}
          </h2>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            @click="onClose"
          />
        </div>
      </template>

      <slot name="before-filters"></slot>

      <UAccordion
        :items="filterSections"
        :ui="{
          wrapper: 'divide-y divide-gray-200',
          item: {
            base: 'shadow-sm mb-2 rounded-md transition-all duration-200 ease-in-out hover:-translate-y-0.5',
            trigger:
              'bg-gray-50 hover:bg-gray-100 rounded-md p-2 transition-colors duration-200',
            content: 'p-4',
          },
          icon: 'text-blue-500',
        }"
      >
        <template #item="{ item }">
          <UCard
            :ui="{
              base: 'bg-white shadow-sm rounded-lg mb-4',
              body: { padding: 'p-4' },
            }"
          >
            <component
              :is="resolveComponent(item.component)"
              v-bind="item.props"
              @update:model-value="
                (value) => handleFilterChange(item.name, value)
              "
            />
          </UCard>
        </template>
      </UAccordion>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <slot name="footer-buttons">
            <UButton
              color="blue"
              variant="soft"
              class="transition-colors duration-200 hover:bg-blue-600 hover:text-white dark:text-white"
              @click="onReset"
            >
              <template #leading>
                <UIcon name="i-heroicons-arrow-path" />
              </template>
              Reset
            </UButton>
          </slot>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import GenericCheckboxGroup from './GenericCheckboxGroup.vue'
import GenericDateRangePicker from './GenericDateRangePicker.vue'

/**
 * Props for the GenericFilterSidebar component
 * @typedef {Object} FilterSidebarProps
 * @property {boolean} [isVisible=false] - Controls the visibility of the sidebar
 * @property {string} [title='Filters'] - The title displayed at the top of the sidebar
 * @property {Array} filterSections - Configuration for the filter sections
 */

/**
 * Component props
 * @type {FilterSidebarProps}
 */
defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Filters',
  },
  filterSections: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['close', 'reset', 'filter-change', 'download'])

/**
 * Handles the closing of the sidebar
 */
const onClose = () => {
  emit('close')
}

/**
 * Handles the reset of all filters
 */
const onReset = () => {
  console.log('Reset button clicked')
  emit('reset')
}

/**
 * Handles changes in filter values
 * @param {string} name - The name of the changed filter
 * @param {any} value - The new value of the filter
 */
const handleFilterChange = (name, value) => {
  emit('filter-change', { name, value })
}

/**
 * Resolves the component to use for each filter section
 * @param {string} componentName - The name of the component to resolve
 * @returns {Component} The resolved Vue component
 */
const resolveComponent = (componentName) => {
  switch (componentName) {
    case 'GenericCheckboxGroup':
      return GenericCheckboxGroup
    case 'GenericDateRangePicker':
      return GenericDateRangePicker
    default:
      return defineAsyncComponent(() => import(`./${componentName}.vue`))
  }
}
</script>
