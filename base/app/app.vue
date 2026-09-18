<script setup lang="ts">
import { useAppManifest } from './composables/useAppManifest'

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

// Apps with an app.json manifest get title / description / lang from it;
// the rest override app.vue (or a layout) themselves.
const { manifest } = useAppManifest()
const title = manifest?.title ?? manifest?.name ?? 'Drawing Participation'
const description = manifest?.description ?? 'Scalable Design Participation Lab application.'

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
    lang: manifest?.lang ?? 'en',
  },
})

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

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
    <UModals />
  </div>
</template>
