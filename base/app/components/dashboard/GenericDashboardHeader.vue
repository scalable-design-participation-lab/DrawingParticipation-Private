<!--
 * GenericDashboardHeader Component
 *
 * A generalized header component for dashboard panels. It displays a title,
 * an optional badge with customizable text and color, and a close button.
 * This component provides a consistent header layout across different dashboards.
 *
 * @displayName GenericDashboardHeader
 * @usage
 * <GenericDashboardHeader
 *   title="Dashboard Title"
 *   badgeText="Last updated: 5 minutes ago"
 *   badgeColor="blue"
 *   @close="handleClose"
 * />
 -->

<script setup lang="ts">
/**
 * Props for the GenericDashboardHeader component
 * @typedef {object} GenericDashboardHeaderProps
 * @property {string} title - The title to display in the header
 * @property {string} [badgeText] - Optional text to display in the badge
 * @property {string} [badgeColor='gray'] - The color of the badge
 * @property {boolean} [showBadge=true] - Whether to show the badge
 * @property {boolean} [showCloseButton=true] - Whether to show the close button
 */

/**
 * Component props
 * @type {GenericDashboardHeaderProps}
 */
defineProps<{
  title: string
  badgeText?: string
  badgeColor?: string
  showBadge?: boolean
  showCloseButton?: boolean
}>()

/**
 * Component emits
 */
defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex justify-between items-center">
    <h2 class="text-xl font-semibold dark:text-white">
      {{ title }}
    </h2>
    <div class="flex items-center gap-2">
      <UBadge
        v-if="showBadge !== false && badgeText"
        :color="badgeColor || 'gray'"
        size="sm"
      >
        {{ badgeText }}
      </UBadge>
      <UButton
        v-if="showCloseButton !== false"
        icon="i-heroicons-x-mark"
        color="gray"
        variant="ghost"
        size="sm"
        aria-label="Close dashboard"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>
