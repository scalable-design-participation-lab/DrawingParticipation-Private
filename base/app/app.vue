<script setup lang="ts">
import { useAppManifest } from './composables/useAppManifest'
import { SPEC_I18N } from './utils/i18n'

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

// Apps with an app.json manifest get title / description / lang from it;
// the rest override app.vue (or a layout) themselves.
const { manifest } = useAppManifest()
const title = manifest?.title ?? manifest?.name ?? 'Drawing Participation'
const description = manifest?.description ?? 'Scalable Design Participation Lab application.'

// `viewport-fit=cover` is what makes env(safe-area-inset-*) report real values
// on iOS; without it the offsets on floating bottom UI are always 0.
//
// <html lang> follows the language switcher rather than staying pinned to the
// manifest's default: screen readers and the browser's translate prompt both
// read it. `useI18n` when the app has vue-i18n, base's own locale otherwise.
const spec = inject(SPEC_I18N, null)
const vueI18n = (useNuxtApp() as { $i18n?: { locale: { value: string } } }).$i18n
const lang = computed(() => vueI18n?.locale.value ?? spec?.locale.value ?? manifest?.lang ?? 'en')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang,
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

<style>
html {
  height: 100%;
  overflow: hidden;
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
