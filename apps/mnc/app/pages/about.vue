<template>
  <div class="leading-relaxed mb-24">
    <GeneralizedHeader :left-items="headerLinks" />

    <div class="mx-auto mt-40 w-full max-w-[1100px] px-7">
      <!-- Hero -->
      <p class="text-sm font-medium uppercase tracking-widest text-teal-600">
        Mobile Networked Creativity
      </p>
      <h1 class="mt-3 text-4xl font-bold leading-tight md:text-5xl">
        {{ $t('about.heroTitle') }}
      </h1>
      <p class="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
        {{ $t('about.heroIntro') }}
      </p>
      <div class="mt-8">
        <UButton
          to="/"
          color="black"
          class="rounded-full px-6 py-3 hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        >
          {{ $t('about.exploreMap') }}
        </UButton>
      </div>
    </div>

    <UDivider class="mt-20 mb-12" />

    <!-- What is MNC -->
    <div class="mx-auto w-full max-w-[1100px] px-7 md:flex md:gap-12">
      <h2 class="mb-4 shrink-0 text-3xl font-semibold md:w-64">
        {{ $t('about.whatTitle') }}
      </h2>
      <div class="max-w-2xl space-y-4 text-gray-600 dark:text-gray-300">
        <p>{{ $t('about.what1') }}</p>
        <p>{{ $t('about.what2') }}</p>
      </div>
    </div>

    <UDivider class="mt-20 mb-12" />

    <!-- Themes -->
    <div class="mx-auto w-full max-w-[1100px] px-7">
      <h2 class="mb-8 text-3xl font-semibold">{{ $t('about.themesTitle') }}</h2>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="theme in themes"
          :key="theme.key"
          class="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700"
        >
          <UIcon :name="theme.icon" class="mb-3 h-7 w-7 text-teal-600" />
          <h3 class="mb-1 text-lg font-semibold">{{ $t(`about.themes.${theme.key}.title`) }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ $t(`about.themes.${theme.key}.description`) }}
          </p>
        </div>
      </div>
    </div>

    <UDivider class="mt-20 mb-12" />

    <!-- Participate -->
    <div class="mx-auto w-full max-w-[1100px] px-7 md:flex md:gap-12">
      <h2 class="mb-4 shrink-0 text-3xl font-semibold md:w-64">
        {{ $t('about.participateTitle') }}
      </h2>
      <div class="max-w-2xl space-y-4 text-gray-600 dark:text-gray-300">
        <p>{{ $t('about.participate1') }}</p>
        <UButton
          to="/"
          color="black"
          class="rounded-full px-6 py-3 hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        >
          {{ $t('about.startContributing') }}
        </UButton>
      </div>
    </div>

    <UDivider class="mt-20 mb-8" />

    <p class="mx-auto w-full max-w-[1100px] px-7 text-sm text-gray-500">
      {{ $t('onboarding.footer') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { t } = useI18n()

const headerLinks = computed(() => [
  { label: t('about.backToMap'), color: 'black', to: '/' },
])

// The five primary tags used to categorize case studies on the map. Titles and
// descriptions live in the locale files under about.themes.<key>.
const themes = [
  { key: 'transport', icon: 'i-heroicons-truck' },
  { key: 'health', icon: 'i-heroicons-heart' },
  { key: 'digital', icon: 'i-heroicons-wifi' },
  { key: 'mapping', icon: 'i-heroicons-map-pin' },
  { key: 'art', icon: 'i-heroicons-paint-brush' },
]
</script>
