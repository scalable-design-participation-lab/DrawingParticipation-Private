<script setup lang="ts">
import { computed } from 'vue'

/** Header pill showing the current language; the dropdown lists every configured locale. */
const { locale, locales, setLocale } = useI18n()
const items = computed(() => [
  locales.value.map((l: { code: string, name?: string }) => ({
    label: l.name ?? l.code,
    icon: locale.value === l.code ? 'i-heroicons-check' : undefined,
    click: () => setLocale(l.code),
  })),
])
</script>

<template>
  <UDropdown :items="items">
    <UButton color="gray" variant="ghost" :aria-label="$t('lang.label')" class="rounded-full font-bold">
      {{ String(locale).toUpperCase() }}
    </UButton>
  </UDropdown>
</template>
