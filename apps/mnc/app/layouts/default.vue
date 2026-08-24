<script setup lang="ts">
const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')
// <html lang> has to follow the switcher, not stay pinned to English —
// screen readers and the browser's own translate prompt both read it.
const { locale } = useI18n()

useHead({
  meta: [
    { charset: 'utf-8' },
    // viewport-fit=cover is what makes env(safe-area-inset-*) report real
    // values on iOS; without it the safe-area offsets on the floating bottom
    // UI are always 0.
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: locale,
  },
})

// SEO meta
const title = 'Mobile Networked Creativity'
const description = 'An interactive map of real-world examples of how communities around the world creatively adapt mobile and networked technology to meet local needs.'

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
    <NuxtLoadingIndicator />
    <NuxtPage />
    <UNotifications />
    <UModals />
  </div>
</template> 