<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true,
  },
})

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.',
})

useHead({
  htmlAttrs: {
    lang: 'en',
  },
})
console.error(props.error)
</script>

<template>
  <div>
    <UMain>
      <UContainer>
        <UPage>
          <UPageError :error="error" />
        </UPage>
      </UContainer>
    </UMain>

    <UNotifications />
  </div>
</template>
