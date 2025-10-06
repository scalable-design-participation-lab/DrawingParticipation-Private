<!--
 * GenericCheckboxGroup Component
 * 
 * This component renders a group of checkboxes based on the provided items.
 * It's designed to be used within filter sidebars or forms where multiple
 * selections are needed. The component supports two-way binding and emits
 * changes to its parent.
 * 
 * @displayName GenericCheckboxGroup
 * @usage
 * <GenericCheckboxGroup
 *   v-model="selectedOptions"
 *   :items="[
 *     { label: 'Option 1', value: 'opt1' },
 *     { label: 'Option 2', value: 'opt2' },
 *   ]"
 * />
 -->
<template>
  <div class="flex flex-col gap-2.5">
    <UButton size="sm" color="gray" variant="soft" @click="toggleAll">
      {{ allSelected ? 'Deselect All' : 'Select All' }}
    </UButton>
    <UCheckbox
      v-for="item in items"
      :key="item.value"
      :label="item.label"
      :model-value="selectedItems[item.value]"
      @update:model-value="updateItem(item.value, $event)"
    >
      {{ item.label }}
    </UCheckbox>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'

/**
 * Props for the GenericCheckboxGroup component
 * @typedef {Object} CheckboxGroupProps
 * @property {Array<{label: string, value: string}>} items - The checkbox items to display
 * @property {Object} modelValue - The current selected values
 */

/**
 * Component props
 * @type {CheckboxGroupProps}
 */
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

/**
 * The internal state of selected items
 * @type {import('vue').Ref<Object>}
 */
const selectedItems = ref({ ...props.modelValue })

/**
 * Checks if all items are selected
 * @type {import('vue').ComputedRef<boolean>}
 */
const allSelected = computed(() => {
  return Object.values(selectedItems.value).every((value) => value === true)
})

/**
 * Toggles the selection of all items
 */
const toggleAll = () => {
  const newValue = !allSelected.value
  props.items.forEach((item) => {
    selectedItems.value[item.value] = newValue
  })
  emit('update:modelValue', { ...selectedItems.value })
}

/**
 * Updates the selected state of an item
 * @param {string} key - The key of the item to update
 * @param {boolean} value - The new selected state
 */
const updateItem = (key, value) => {
  selectedItems.value[key] = value
  emit('update:modelValue', { ...selectedItems.value })
}

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    selectedItems.value = { ...newValue }
  },
  { deep: true }
)

// Initialize all items as selected if no initial selection is provided
onMounted(() => {
  if (Object.keys(selectedItems.value).length === 0 && props.items.length > 0) {
    props.items.forEach((item) => {
      selectedItems.value[item.value] = true
    })
    emit('update:modelValue', { ...selectedItems.value })
  }
})
</script>
