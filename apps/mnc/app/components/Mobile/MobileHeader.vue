<script setup lang="ts">
import { computed } from 'vue'

/**
 * Mobile top bar: lab icon left, the MNC wordmark centered, language + map
 * type on the right. `mapType` is owned by the page (`update:mapType`).
 */
const props = withDefaults(defineProps<{
  title?: string
  /** Link the wordmark to mobilecreativity.net (off inside the contribute wizard). */
  titleLink?: boolean
  mapType?: 'vector' | 'satellite'
}>(), {
  title: 'MNC',
  titleLink: true,
  mapType: 'vector',
})
const emit = defineEmits<{ 'update:mapType': [type: 'vector' | 'satellite'] }>()

const { locale, locales, setLocale } = useI18n()
const localeItems = computed(() => [
  locales.value.map((l: { code: string, name?: string }) => ({
    label: l.name ?? l.code,
    icon: locale.value === l.code ? 'i-heroicons-check' : undefined,
    click: () => setLocale(l.code),
  })),
])
</script>

<template>
  <header
    class="pointer-events-none fixed inset-x-0 top-4 z-20 flex items-center justify-between px-4"
    style="padding-left: max(1rem, env(safe-area-inset-left, 0px)); padding-right: max(1rem, env(safe-area-inset-right, 0px));"
  >
    <a
      href="https://scalabledesignparticipation.org/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scalable Design Participation Lab"
      class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl shadow-md backdrop-blur dark:bg-black/80"
    >
      🤲
    </a>
    <a v-if="titleLink" href="https://mobilecreativity.net" target="_blank" rel="noopener noreferrer" class="mnc-title pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {{ title }}
    </a>
    <span v-else class="mnc-title absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">{{ title }}</span>

    <div class="pointer-events-auto flex items-center gap-2">
      <UDropdown :items="localeItems">
        <button type="button" :aria-label="$t('lang.label')" class="flex h-10 min-w-10 items-center justify-center rounded-full bg-white/90 px-3 text-xs font-bold text-gray-700 shadow-md backdrop-blur dark:bg-black/80 dark:text-gray-200">
          {{ String(locale).toUpperCase() }}
        </button>
      </UDropdown>
      <button
        type="button"
        :aria-label="props.mapType === 'vector' ? $t('nav.satelliteOn') : $t('nav.satelliteOff')"
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur dark:bg-black/80 dark:text-gray-200"
        @click="emit('update:mapType', props.mapType === 'vector' ? 'satellite' : 'vector')"
      >
        <UIcon :name="props.mapType === 'vector' ? 'i-heroicons-globe-americas' : 'i-heroicons-map'" class="h-5 w-5" />
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
  background: linear-gradient(90deg, #e8998d, #adb2b8, #5fc3b5, #c7e896);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
</style>
