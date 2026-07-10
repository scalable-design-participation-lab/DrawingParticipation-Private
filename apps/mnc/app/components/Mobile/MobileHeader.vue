<!--
 * MobileHeader Component
 *
 * Mobile top bar: the MNC logo + title (linking to the main website) on the
 * left, and a vector/satellite map-type toggle on the right.
 -->

<script setup lang="ts">
import { useMapStore } from '@base/stores/map'

defineProps({
  title: {
    type: String,
    default: 'MNC',
  },
  color: {
    type: String,
    default: '#57C9C0',
  },
})

const mapStore = useMapStore()
const { mapType } = storeToRefs(mapStore)

function toggleMapType() {
  mapStore.setMapType(mapType.value === 'vector' ? 'satellite' : 'vector')
}

const { locale, setLocale } = useI18n()
function toggleLocale() {
  setLocale(locale.value === 'en' ? 'pt' : 'en')
}
</script>

<template>
  <header class="fixed top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pointer-events-none">
    <a
      href="https://mobilecreativity.net"
      target="_blank"
      rel="noopener noreferrer"
      class="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 dark:bg-black/80 px-3 py-1.5 shadow-md backdrop-blur"
    >
      <img src="/mnc-logo.svg" alt="Mobile Networked Creativity" class="h-6 w-6" />
      <span class="mnc-title" :style="{ color }">{{ title }}</span>
    </a>

    <div class="pointer-events-auto flex items-center gap-2">
      <button
        type="button"
        :aria-label="$t('lang.label')"
        class="flex h-10 min-w-10 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 px-3 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-md backdrop-blur"
        @click="toggleLocale"
      >
        {{ locale === 'en' ? 'PT' : 'EN' }}
      </button>
      <button
        type="button"
        :aria-label="mapType === 'vector' ? $t('nav.satelliteOn') : $t('nav.satelliteOff')"
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-gray-700 dark:text-gray-200 shadow-md backdrop-blur"
        @click="toggleMapType"
      >
        <UIcon :name="mapType === 'vector' ? 'i-heroicons-globe-americas' : 'i-heroicons-map'" class="h-5 w-5" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.mnc-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 900;
  font-size: 1.15rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.03em;
}
</style>
