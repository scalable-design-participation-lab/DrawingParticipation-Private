<script setup lang="ts">
const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
})

// SEO meta
const title = 'Drawing Participation - Interactive Drawing Tool'
const description = 'A collaborative drawing tool for participatory design and community engagement.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/social-card.png',
  twitterImage: '/social-card.png',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <!-- Loading Indicator -->
    <NuxtLoadingIndicator />

    <!-- Main Content -->
    <slot />

    <!-- Global UI Components -->
    <UNotifications />
    <UModals />

    <!-- ClientOnly Components -->
    <ClientOnly>
      <LazyUDashboardSearch />
    </ClientOnly>
  </div>
</template>

<style>
html {
  overflow: hidden;
  height: 100%;
}

body {
  height: 100%;
  overflow: auto;
  overscroll-behavior-y: none;
}

::selection {
  background: rgba(var(--color-primary-500), 0.1);
}
</style>
