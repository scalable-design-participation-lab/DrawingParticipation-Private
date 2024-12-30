<!--
 * GenericDateRangePicker Component
 *
 * This component provides a customizable date range picker with predefined
 * range options and a calendar interface for custom date selection. It's
 * designed to be used within filter sidebars or as a standalone date range
 * selection tool.
 *
 * @displayName GenericDateRangePicker
 * @usage
 * <GenericDateRangePicker v-model="selectedDateRange" />
 -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Duration, format, isSameDay, isValid, sub } from 'date-fns'

/**
 * Props for the GenericDateRangePicker component
 * @typedef {object} DateRangePickerProps
 * @property {{ start: Date, end: Date }} [modelValue] - The selected date range
 */

/**
 * Component props
 * @type {DateRangePickerProps}
 */
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: sub(new Date(), { days: 14 }), end: new Date() }),
  },
})

const emit = defineEmits(['update:modelValue'])

/**
 * Predefined date range options
 * @type {Array<{ label: string, duration: Duration }>}
 */
const ranges = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } },
]

/**
 * Currently selected date range
 * @type {import('vue').Ref<{ start: Date, end: Date }>}
 */
const selected = ref(props.modelValue)
const isAllTimeSelected = ref(false)

const minDate = sub(new Date(), { years: 5 })
const maxDate = new Date()

/**
 * Controls the visibility of the date picker modal
 * @type {import('vue').Ref<boolean>}
 */
const isOpen = ref(false)

/**
 * Formats the selected date range for display
 * @type {import('vue').ComputedRef<string>}
 */
const formatDateRange = computed(() => {
  if (isAllTimeSelected.value) {
    return 'All Time'
  }
  if (isValid(selected.value.start) && isValid(selected.value.end)) {
    return `${format(selected.value.start, 'd MMM, yyyy')} - ${format(
      selected.value.end,
      'd MMM, yyyy',
    )}`
  }
  return 'Select date range'
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && isValid(newValue.start) && isValid(newValue.end)) {
      selected.value = newValue
    }
  },
  { deep: true },
)

/**
 * Checks if a given date range is selected
 * @param {Duration} duration - The duration of the date range
 * @returns {boolean} True if the date range is selected, false otherwise
 */
function isRangeSelected(duration: Duration) {
  return (
    isSameDay(selected.value.start, sub(new Date(), duration))
    && isSameDay(selected.value.end, new Date())
  )
}

/**
 * Selects a date range based on the given duration
 * @param {Duration} duration - The duration of the date range
 */
function selectRange(duration: Duration) {
  const end = new Date()
  const start = sub(end, duration)
  selected.value = { start, end }
  emitChange()
}

/**
 * Handles changes in the selected date range
 * @param {object} value - The new selected date range
 */
function handleDateChange(value) {
  if (value && isValid(value.start) && isValid(value.end)) {
    isAllTimeSelected.value = false
    selected.value = value
    emitChange()
  }
}

/**
 * Emits the updated date range to the parent component
 */
function emitChange() {
  emit('update:modelValue', {
    ...selected.value,
    isAllTime: isAllTimeSelected.value,
  })
}

/**
 * Handles clicks on predefined date range options
 * @param {Duration} duration - The duration of the date range
 */
function handleRangeClick(duration: Duration) {
  isAllTimeSelected.value = false
  selectRange(duration)
}

/**
 * Applies the selected date range and closes the date picker modal
 */
function applyDateRange() {
  emitChange()
  isOpen.value = false
}

function selectAllTime() {
  isAllTimeSelected.value = true
  selected.value = { start: minDate, end: maxDate }
  emitChange()
}
</script>

<template>
  <div>
    <UButton icon="i-heroicons-calendar-days-20-solid" @click="isOpen = true">
      {{ formatDateRange }}
    </UButton>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-in-out"
        leave-active-class="transition-opacity duration-300 ease-in-out"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center"
        >
          <div
            class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">
                Select Date Range
              </h3>
              <UButton
                icon="i-heroicons-x-mark"
                color="gray"
                variant="ghost"
                @click="isOpen = false"
              />
            </div>
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex flex-col space-y-2">
                <UButton
                  label="All Time"
                  color="gray"
                  variant="ghost"
                  class="justify-start"
                  :class="[
                    isAllTimeSelected ? 'bg-gray-100 dark:bg-gray-700' : '',
                  ]"
                  @click="selectAllTime"
                />
                <UButton
                  v-for="(range, index) in ranges"
                  :key="index"
                  :label="range.label"
                  color="gray"
                  variant="ghost"
                  class="justify-start"
                  :class="[
                    isRangeSelected(range.duration)
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : '',
                  ]"
                  @click="handleRangeClick(range.duration)"
                />
              </div>
              <DatePicker
                v-model="selected"
                :min="minDate"
                :max="maxDate"
                range
                @update:model-value="handleDateChange"
              />
            </div>
            <div class="mt-4 flex justify-end">
              <UButton color="primary" @click="applyDateRange">
                Apply
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
