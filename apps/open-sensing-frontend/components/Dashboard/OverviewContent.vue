<!--
 * OverviewContent Component
 * 
 * This component displays an overview of the dashboard content, including
 * a description and key statistics. It provides a summary view of the sensor
 * data and system status, typically shown at the top of the dashboard.
 * 
 * @displayName OverviewContent
 * @usage
 * <OverviewContent
 *   :description="dashboardDescription"
 *   :stats="overviewStats"
 * />
 -->
<template>
  <div class="overview-content">
    <p class="text-sm text-gray-600 mb-4 dark:text-white">{{ description }}</p>
    <div class="grid grid-cols-3 gap-4">
      <UCard
        v-for="(stat, index) in stats"
        :key="index"
        class="text-center p-4 bg-white hover:shadow-lg transition-shadow duration-300"
      >
        <h3 class="text-2xl font-bold text-blue-500">{{ stat.value }}</h3>
        <p class="text-sm text-gray-600 dark:text-white">{{ stat.label }}</p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Props for the OverviewContent component
 * @typedef {Object} OverviewContentProps
 * @property {string} description - The description text for the overview
 * @property {Array<{value: number, label: string}>} stats - Array of statistic objects
 */

/**
 * Component props
 * @type {OverviewContentProps}
 */
defineProps<{
  description: string
  stats: Array<{ value: number; label: string }>
}>()
</script>
