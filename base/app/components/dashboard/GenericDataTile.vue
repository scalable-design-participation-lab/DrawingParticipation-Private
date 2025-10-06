<!--
 * GenericDataTile Component
 *
 * A generalized data tile component for displaying information in a card format.
 * It displays a title, status badge, optional icon/indicator, and configurable data fields.
 * The component is highly customizable through props for colors, fields, and formatting.
 *
 * @displayName GenericDataTile
 * @usage
 * <GenericDataTile
 *   :data="itemData"
 *   :display-fields="['temperature', 'humidity']"
 *   :custom-colors="colorScheme"
 *   @click="handleClick"
 *   @action="handleAction"
 * />
 -->

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'

/**
 * Custom color configurations for the data tile.
 * @typedef {object} CustomColors
 * @property {Record<string, string>} [status] - Custom colors for status
 * @property {Record<string, string>} [indicator] - Custom colors for indicator levels
 * @property {Record<string, Record<string, string>>} [values] - Custom colors for data values
 */

/**
 * Props for the GenericDataTile component.
 */
const props = withDefaults(
  defineProps<{
    /** The data object to display */
    data: T
    /** Title field key in data object */
    titleField?: keyof T
    /** Status field key in data object */
    statusField?: keyof T
    /** Indicator field key in data object (e.g., battery, signal strength) */
    indicatorField?: keyof T
    /** Indicator icon name */
    indicatorIcon?: string
    /** Array of field keys to display in the tile body */
    displayFields?: (keyof T)[]
    /** Whether to show the action button */
    showAction?: boolean
    /** Action button label */
    actionLabel?: string
    /** Custom color configurations */
    customColors?: {
      status?: Record<string, string>
      indicator?: Record<string, string>
      values?: Record<string, Record<string, string>>
    }
    /** Custom field formatters */
    formatters?: Record<string, (value: any) => string>
    /** Custom label formatters */
    labelFormatters?: Record<string, (key: string) => string>
  }>(),
  {
    titleField: 'title' as any,
    statusField: 'status' as any,
    displayFields: () => [],
    showAction: true,
    actionLabel: 'Details',
    customColors: () => ({}),
    formatters: () => ({}),
    labelFormatters: () => ({}),
  }
)

const emit = defineEmits<{
  click: [data: T]
  action: [data: T]
}>()

/**
 * Get the title from data
 */
const title = computed(() => props.data[props.titleField])

/**
 * Get the status from data
 */
const status = computed(() => props.data[props.statusField])

/**
 * Get the indicator value from data
 */
const indicator = computed(() =>
  props.indicatorField ? props.data[props.indicatorField] : null
)

/**
 * Determines the color for the indicator based on its value
 */
function getIndicatorColor(value: any): string {
  if (!props.customColors?.indicator)
    return 'text-gray-500'

  const numValue = Number(value)
  for (const [threshold, color] of Object.entries(props.customColors.indicator)) {
    if (threshold.includes('-')) {
      const [min, max] = threshold.split('-').map(Number)
      if (numValue >= min && numValue <= max)
        return color
    }
    else if (threshold.startsWith('<')) {
      if (numValue < Number.parseInt(threshold.slice(1)))
        return color
    }
    else if (threshold.startsWith('>')) {
      if (numValue > Number.parseInt(threshold.slice(1)))
        return color
    }
  }

  return 'text-gray-500'
}

/**
 * Determines the color for the status badge
 */
function getStatusColor(statusValue: any): string {
  if (props.customColors?.status && props.customColors.status[String(statusValue)])
    return props.customColors.status[String(statusValue)]

  // Default status colors
  const statusStr = String(statusValue).toLowerCase()
  if (statusStr.includes('active') || statusStr.includes('online'))
    return 'green'
  if (statusStr.includes('inactive') || statusStr.includes('offline'))
    return 'red'
  if (statusStr.includes('warning') || statusStr.includes('maintenance'))
    return 'yellow'

  return 'gray'
}

/**
 * Formats a field value for display
 */
function formatValue(key: keyof T, value: any): string {
  // Use custom formatter if provided
  if (props.formatters?.[String(key)])
    return props.formatters[String(key)](value)

  // Default formatting
  if (typeof value === 'number')
    return value.toFixed(1)

  return String(value)
}

/**
 * Formats a field label for display
 */
function formatLabel(key: keyof T): string {
  // Use custom label formatter if provided
  if (props.labelFormatters?.[String(key)])
    return props.labelFormatters[String(key)](String(key))

  // Default: Convert camelCase to Title Case
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

/**
 * Determines the color for a data value
 */
function getValueColor(key: keyof T, value: any): string {
  if (props.customColors?.values && props.customColors.values[String(key)]) {
    const colorRanges = props.customColors.values[String(key)]
    const numValue = Number(value)

    for (const [range, color] of Object.entries(colorRanges)) {
      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number)
        if (numValue >= min && numValue <= max)
          return color
      }
    }
  }

  return 'text-blue-500 dark:text-blue-400'
}
</script>

<template>
  <UCard
    class="flex flex-col h-full min-h-[250px] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    hover
    @click="emit('click', data)"
  >
    <div class="flex flex-col h-full">
      <!-- Header: Title, Status, Indicator -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ title }}
          </h3>
          <UBadge v-if="status" :color="getStatusColor(status)" class="mt-1">
            {{ status }}
          </UBadge>
        </div>
        <div v-if="indicator !== null" class="flex items-center">
          <UIcon
            v-if="indicatorIcon"
            :name="indicatorIcon"
            class="w-6 h-6 mr-1"
            :class="getIndicatorColor(indicator)"
          />
          <span class="text-sm font-semibold">{{ indicator }}</span>
        </div>
      </div>

      <!-- Body: Display Fields -->
      <UCard class="bg-gray-50 dark:bg-gray-800 p-3 flex-grow">
        <div class="grid grid-cols-2 gap-4 text-sm h-full">
          <div
            v-for="field in displayFields"
            :key="String(field)"
            class="text-center flex flex-col justify-center"
          >
            <span
              class="text-xl font-bold"
              :class="getValueColor(field, data[field])"
            >
              {{ formatValue(field, data[field]) }}
            </span>
            <p class="text-xs text-gray-600 dark:text-gray-300">
              {{ formatLabel(field) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Footer: Action Button -->
      <UButton
        v-if="showAction"
        color="primary"
        variant="ghost"
        class="mt-4 self-center transition-colors duration-300 hover:bg-blue-100 dark:hover:bg-blue-900"
        @click.stop="emit('action', data)"
      >
        {{ actionLabel }}
        <template #trailing>
          <UIcon name="i-heroicons-arrow-right" />
        </template>
      </UButton>
    </div>
  </UCard>
</template>
