<!--
 * HeroSection Component
 * 
 * This component renders a hero section typically used at the top of a landing page.
 * It includes a title, description, call-to-action links, and a featured image.
 * 
 * @displayName HeroSection
 * @usage
 * <HeroSection
 *   title="Welcome to Our App"
 *   description="Discover amazing features"
 *   :links="ctaLinks"
 *   :headlineButton="headlineButtonConfig"
 *   imageSrc="/hero-image.jpg"
 *   imageAlt="Hero Image"
 * />
 -->

<template>
  <ULandingHero :title="title" :description="description" :links="links">
    <!-- <template #headline>
      <UButton
        color="gray"
        :to="headlineButton.to"
        :label="headlineButton.label"
        :trailing-icon="headlineButton.icon"
        size="xs"
        class="rounded-full"
      />
    </template> -->
    <template #default>
      <img
        :src="imageSrc"
        :alt="imageAlt"
        class="w-full rounded-md shadow-xl ring-1 ring-gray-300 dark:ring-gray-700"
      />
    </template>
  </ULandingHero>
</template>

<script setup lang="ts">
/**
 * Props for the HeroSection component
 * @typedef {Object} HeroSectionProps
 * @property {string} title - The main title of the hero section
 * @property {string} description - A brief description or tagline
 * @property {Array<{label: string, to: string}>} links - Call-to-action links
 * @property {{to: string, label: string, icon: string}} headlineButton - Configuration for the headline button
 * @property {string} imageSrc - Source URL for the hero image
 * @property {string} imageAlt - Alt text for the hero image
 */

/**
 * Component props
 * @type {HeroSectionProps}
 */
defineProps({
  title: String,
  description: String,
  links: Array,
  // headlineButton: Object,
  imageSrc: String,
  imageAlt: String,
})
</script>
