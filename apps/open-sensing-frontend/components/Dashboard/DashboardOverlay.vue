<!--
 * DashboardOverlay Component
 * 
 * This component provides a semi-transparent overlay for the dashboard.
 * It is typically used to create a backdrop effect when displaying modals
 * or when focusing on specific dashboard elements. The visibility of the
 * overlay can be controlled via props.
 * 
 * @displayName DashboardOverlay
 * @usage
 * <DashboardOverlay :visible="showOverlay" />
 -->
<template>
  <Transition
    enter-active-class="transition-opacity duration-300 ease-in-out"
    leave-active-class="transition-opacity duration-300 ease-in-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-15"
    ></div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Props for the DashboardOverlay component
 * @typedef {Object} DashboardOverlayProps
 * @property {boolean} [visible=false] - Whether the overlay is visible
 */

/**
 * Component props
 * @type {DashboardOverlayProps}
 */
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})
</script>
