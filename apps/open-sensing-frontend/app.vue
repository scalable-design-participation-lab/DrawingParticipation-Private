<script setup>
useHead({
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/favicon/favicon-96x96.png',
      sizes: '96x96',
    },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
    { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/favicon/apple-touch-icon.png',
    },
    { rel: 'manifest', href: '/favicon/site.webmanifest' },
  ],
})
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
