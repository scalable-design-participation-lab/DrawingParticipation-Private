<!--
 * MoreInThisSeries Component
 * 
 * This component displays a grid of related content items, typically used
 * to showcase additional articles or sections related to the current page.
 * 
 * @displayName MoreInThisSeries
 * @usage
 * <MoreInThisSeries :items="relatedContent" :cols="3" />
 -->

<template>
  <section>
    <h2>More in this series</h2>

    <ULandingCard
      v-for="(item, index) in items"
      :key="index"
      :title="item.title"
      :description="item.description"
      color="primary"
      orientation="horizontal"
      class="m-5"
      :to="item.link"
    >
      <img :src="item.image" class="w-full rounded-md" />
    </ULandingCard>
  </section>
</template>

<script setup lang="ts">
/**
 * Props for the MoreInThisSeries component
 * @typedef {Object} MoreInThisSeriesProps
 * @property {Array<{title: string, description: string, icon: string}>} items - The content items to display
 * @property {number} [cols=3] - The number of columns in the grid
 */

/**
 * Component props
 * @type {MoreInThisSeriesProps}
 */
defineProps({
  items: Array,
  cols: {
    type: Number,
    default: 3,
  },
})
</script>
