<!--
 * Headline Component
 * 
 * This component displays a headline with different content types: diagram, chart, or paragraph.
 * It's designed to be flexible and can be used to showcase various types of information
 * in a consistent format across the application.
 * 
 * @displayName Headline
 * @usage
 * <Headline
 *   title="Section Title"
 *   type="diagram"
 *   :content="diagramData"
 * />
 -->
<template>
  <div>
    <h2>{{ title }}</h2>

    <div class="flex flex-col items-center justify-center">
      <img :src="imageSrc" :alt="imageAlt" class="rounded-md" />
    </div>
    <UCard v-if="type === 'diagram'">
      <UTabs :items="content" />
    </UCard>

    <UCard v-else-if="type === 'chart'" class="p-4 text-center">
      <div class="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
        {{ content }}
      </div>
    </UCard>
    <p v-else-if="type === 'paragraph'">{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Props for the Headline component
 * @typedef {Object} HeadlineProps
 * @property {string} title - The title of the headline
 * @property {'diagram' | 'chart' | 'paragraph'} type - The type of content to display
 * @property {Array | string} content - The content to display (array for diagram, string for chart or paragraph)
 */

/**
 * Component props
 * @type {HeadlineProps}
 */
defineProps({
  title: String,
  type: {
    type: String,
    validator: (value: string) =>
      ['diagram', 'chart', 'paragraph'].includes(value),
  },
  content: [Array, String],
  imageSrc: String,
  imageAlt: String,
})
</script>
