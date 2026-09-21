<script setup lang="ts">
import { computed } from 'vue'

/**
 * A one-of choice that costs one button of space: the trigger shows the
 * current item, the list opens on press. `Tabs` is the same choice laid out
 * in full, so use that where the options fit and this where they do not —
 * a language switcher in a phone header, for instance.
 */
export interface DropdownItem {
  value: string
  label: string
  icon?: string
}

const props = withDefaults(defineProps<{
  items?: DropdownItem[]
  modelValue?: string
  /** Trigger text; the selected item's label otherwise. */
  label?: string
  /** Trigger icon, in place of text. */
  icon?: string
  /** Accessible name for the trigger. */
  title?: string
  /**
   * Show the selected `value` on the trigger instead of its label, so the
   *  list can spell out "Português" while the button stays "PT".
   */
  showValue?: boolean
  uppercase?: boolean
}>(), {
  items: () => [],
  modelValue: '',
  label: '',
  icon: '',
  title: '',
  showValue: false,
  uppercase: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const current = computed(() => props.items.find(i => i.value === props.modelValue))

const text = computed(() => {
  const value = props.label || (props.showValue ? props.modelValue : current.value?.label) || props.modelValue
  return props.uppercase ? value.toUpperCase() : value
})

// UDropdown wants a list of lists (its groups); one group is all we need.
const groups = computed(() => [
  props.items.map(item => ({
    label: item.label,
    icon: item.value === props.modelValue ? 'i-heroicons-check' : item.icon,
    click: () => emit('update:modelValue', item.value),
  })),
])
</script>

<template>
  <UDropdown :items="groups">
    <UButton
      color="gray"
      variant="ghost"
      :icon="icon || undefined"
      :aria-label="title || text"
      class="rounded-full font-bold"
    >
      <template v-if="!icon">
        {{ text }}
      </template>
    </UButton>
  </UDropdown>
</template>
