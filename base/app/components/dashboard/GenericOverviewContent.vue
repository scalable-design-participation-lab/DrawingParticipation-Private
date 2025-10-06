<!--
 * GenericOverviewContent Component
 *
 * A generalized overview component for displaying summary information in dashboards.
 * It shows a description text and a grid of statistical cards with values and labels.
 * The component is designed to provide a quick summary view at the top of dashboards.
 *
 * @displayName GenericOverviewContent
 * @usage
 * <GenericOverviewContent
 *   description="Dashboard overview description"
 *   :stats="[
 *     { value: 42, label: 'Total Items', color: 'blue' },
 *     { value: 12, label: 'Active', color: 'green' }
 *   ]"
 *   :columns="3"
 * />
 -->

<script setup lang="ts">
/**
 * Stat item configuration
 * @typedef {object} StatItem
 * @property {string | number} value - The statistical value to display
 * @property {string} label - The label describing the stat
 * @property {string} [color='blue'] - The color theme for the stat card
 * @property {string} [icon] - Optional icon name to display with the stat
 */
interface StatItem {
  value: string | number
  label: string
  color?: string
  icon?: string
}

/**
 * Props for the GenericOverviewContent component
 */
withDefaults(
  defineProps<{
    /** Description text to display above stats */
    description?: string
    /** Array of statistical items to display */
    stats: StatItem[]
    /** Number of columns in the grid */
    columns?: number
    /** Whether to show the description */
    showDescription?: boolean
  }>(),
  {
    description: '',
    columns: 3,
    showDescription: true,
  }
)

/**
 * Get grid column class based on number of columns
 */
function getGridClass(cols: number): string {
  const colMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }
  return colMap[cols] || 'grid-cols-3'
}

/**
 * Get text color class based on color name
 */
function getColorClass(color?: string): string {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    red: 'text-red-500 dark:text-red-400',
    yellow: 'text-yellow-500 dark:text-yellow-400',
    purple: 'text-purple-500 dark:text-purple-400',
    pink: 'text-pink-500 dark:text-pink-400',
    indigo: 'text-indigo-500 dark:text-indigo-400',
    gray: 'text-gray-500 dark:text-gray-400',
  }
  return colorMap[color || 'blue'] || colorMap.blue
}
</script>

<template>
  <div class="overview-content">
    <p
      v-if="showDescription && description"
      class="text-sm text-gray-600 dark:text-gray-300 mb-4"
    >
      {{ description }}
    </p>
    <div class="grid gap-4" :class="getGridClass(columns)">
      <UCard
        v-for="(stat, index) in stats"
        :key="index"
        class="text-center p-4 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300"
      >
        <div class="flex flex-col items-center gap-2">
          <UIcon
            v-if="stat.icon"
            :name="stat.icon"
            class="w-8 h-8"
            :class="getColorClass(stat.color)"
          />
          <h3 class="text-2xl font-bold" :class="getColorClass(stat.color)">
            {{ stat.value }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ stat.label }}
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>
