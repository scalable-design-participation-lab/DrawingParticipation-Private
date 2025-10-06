<!--
 * Reference Component
 * 
 * This component displays a list of references using an accordion layout.
 * It's typically used to show additional information or sources in a collapsible format.
 * 
 * @displayName Reference
 * @usage
 * <Reference :items="referenceItems" />
 -->

<template>
  <div>
    <h2>Publication</h2>
    <UAccordion :items="items" />
  </div>
</template>

<script setup lang="ts">
/**
 * Props for the Reference component
 * @typedef {Object} ReferenceProps
 * @property {Array<{label: string, content: string}>} items - The reference items to display
 */

/**
 * Component props
 * @type {ReferenceProps}
 */
defineProps({
  items: Array,
})
</script>
