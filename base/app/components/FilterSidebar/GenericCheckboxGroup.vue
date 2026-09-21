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
<script setup>
import { computed, onMounted } from 'vue'

/**
 * Props for the GenericCheckboxGroup component
 * @typedef {object} CheckboxGroupProps
 * @property {Array<{label: string, value: string}>} items - The checkbox items to display
 * @property {object} modelValue - The current selected values
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
  // Both labels are props so a spec can pass "$t." keys: hard-coding them
  // puts English in front of a reader using any other language.
  selectAllLabel: {
    type: String,
    default: 'Select All',
  },
  deselectAllLabel: {
    type: String,
    default: 'Deselect All',
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

/**
 * Fully controlled: `modelValue` is the only truth. It used to keep a private
 * copy and seed it on mount, so closing and reopening the panel silently
 * re-selected everything while the page's own filter state said otherwise, and
 * the two drifted apart with every click.
 */
const allSelected = computed(() =>
  props.items.length > 0 && props.items.every(item => props.modelValue[item.value] === true),
)

function toggleAll() {
  const next = !allSelected.value
  emit('update:modelValue', Object.fromEntries(props.items.map(item => [item.value, next])))
}

function updateItem(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

// A page that starts with no selection means "all of them": say so once, so
// the value the page holds and the boxes on screen agree from the first frame.
onMounted(() => {
  if (props.items.length > 0 && Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', Object.fromEntries(props.items.map(item => [item.value, true])))
  }
})
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <UButton
      size="sm"
      color="gray"
      variant="soft"
      :label="allSelected ? deselectAllLabel : selectAllLabel"
      @click="toggleAll"
    />
    <UCheckbox
      v-for="item in items"
      :key="item.value"
      :label="item.label"
      :model-value="modelValue[item.value] === true"
      @update:model-value="updateItem(item.value, $event)"
    >
      {{ item.label }}
    </UCheckbox>
  </div>
</template>
