<!--
 * MobileHeader Component
 *
 * Mobile top bar: the lab hands icon (linking to the lab site) on the left,
 * the MNC title (linking to the main website) centered, and a vector/
 * satellite map-type toggle on the right.
 -->

<script setup lang="ts">
import { useMapStore } from '@base/stores/map'

defineProps({
  title: {
    type: String,
    default: 'MNC',
  },
  // The wordmark links out to mobilecreativity.net on the map screen. Inside
  // the contribute wizard it must not: the wizard renders its own copy of this
  // header, and on the transparent step-1 map the page-level header sits right
  // underneath, so the add-entry screen had two stacked ways to leave the site
  // exactly where someone is trying to add an entry (issue #41).
  titleLink: {
    type: Boolean,
    default: true,
  },
})

const mapStore = useMapStore()
const { mapType } = storeToRefs(mapStore)

function toggleMapType() {
  mapStore.setMapType(mapType.value === 'vector' ? 'satellite' : 'vector')
}

// Language dropdown: the button shows the CURRENT language; the menu lists
// all configured locales with a check on the active one.
const { locale, locales, setLocale } = useI18n()
const localeItems = computed(() => [
  locales.value.map((l: any) => ({
    label: l.name,
    icon: locale.value === l.code ? 'i-heroicons-check' : undefined,
    click: () => setLocale(l.code),
  })),
])
</script>

<template>
  <!-- viewport-fit=cover (layouts/default.vue) lets the page run under the
       notch in landscape, so the edge buttons need the horizontal insets. -->
  <header
    class="fixed top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pointer-events-none"
    style="padding-left: max(1rem, env(safe-area-inset-left, 0px)); padding-right: max(1rem, env(safe-area-inset-right, 0px));"
  >
    <a
      href="https://scalabledesignparticipation.org/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scalable Design Participation Lab"
      class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-xl shadow-md backdrop-blur"
    >
      🤲
    </a>

    <a
      v-if="titleLink"
      href="https://mobilecreativity.net"
      target="_blank"
      rel="noopener noreferrer"
      class="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mnc-title"
    >
      {{ title }}
    </a>
    <!-- No pointer-events-auto: over the wizard's click-through step-1 map this
         must not swallow the tap that drops the pin. -->
    <span
      v-else
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mnc-title"
    >
      {{ title }}
    </span>

    <div class="pointer-events-auto flex items-center gap-2">
      <UDropdown :items="localeItems">
        <button
          type="button"
          :aria-label="$t('lang.label')"
          class="flex h-10 min-w-10 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 px-3 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-md backdrop-blur"
        >
          {{ String(locale).toUpperCase() }}
        </button>
      </UDropdown>
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
  font-size: 1.4rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #E8998D, #ADB2B8, #5FC3B5, #C7E896);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
</style>
