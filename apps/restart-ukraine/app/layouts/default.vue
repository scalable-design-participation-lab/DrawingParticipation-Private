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
    lang: 'uk',
  },
})

// SEO meta
const title = 'Гуртомá - Платформа для покращення міст'
const description = 'Платформа від команди дослідників та містопланувальників Restart, яка спрощує комунікацію між містянами та урбаністами.'

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