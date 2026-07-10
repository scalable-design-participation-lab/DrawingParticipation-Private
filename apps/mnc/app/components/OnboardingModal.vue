<template>
  <UCard
    v-if="isVisible"
    class="onboarding-card max-w-[90vw] w-[500px] max-h-[90vh] overflow-y-auto z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl dark:bg-black"
  >
    <template #header>
      <div class="relative">
        <h3 class="text-xl md:text-2xl font-semibold text-center">
          {{ $t('onboarding.title') }}
        </h3>
        <!-- Language switcher, offered up-front on the welcome screen -->
        <div class="absolute right-0 top-0 flex gap-1">
          <button
            v-for="l in langs"
            :key="l.code"
            type="button"
            class="rounded-full px-2 py-0.5 text-xs font-semibold transition"
            :class="locale === l.code ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
            @click="setLocale(l.code)"
          >
            {{ l.code.toUpperCase() }}
          </button>
        </div>
      </div>
    </template>

    <div class="space-y-8 px-6">
      <p class="leading-tight">
        {{ $t('onboarding.intro') }}
      </p>

      <div class="space-y-3 leading-tight">
        <div class="flex items-start space-x-3">
          <UIcon
            name="i-heroicons-map"
            class="flex-shrink-0 w-6 h-6 text-blue-500"
          />
          <p>{{ $t('onboarding.point1') }}</p>
        </div>

        <div class="flex items-start space-x-3">
          <UIcon
            name="i-heroicons-cursor-arrow-rays"
            class="flex-shrink-0 w-6 h-6 text-blue-500"
          />
          <p>{{ $t('onboarding.point2') }}</p>
        </div>

        <div class="flex items-start space-x-3">
          <UIcon
            name="i-heroicons-camera"
            class="flex-shrink-0 w-6 h-6 text-blue-500"
          />
          <p>{{ $t('onboarding.point3') }}</p>
        </div>
      </div>
    </div>

    <div class="flex justify-center my-8 mb-4">
      <UButton
        color="black"
        class="px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        @click="emit('close')"
      >
        {{ $t('onboarding.getStarted') }}
      </UButton>
    </div>

    <template #footer>
      <p class="text-xs text-gray-500 px-6 py-3 leading-tight text-center">
        {{ $t('onboarding.footer') }}
      </p>
    </template>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close'])

// Language switcher state (English / Portuguese).
const { locale, setLocale } = useI18n()
const langs = [{ code: 'en' }, { code: 'pt' }] as const
</script>