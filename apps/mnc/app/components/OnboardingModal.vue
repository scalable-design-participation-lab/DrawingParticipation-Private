<template>
  <UCard
    v-if="isVisible"
    class="onboarding-card max-w-[90vw] w-[500px] max-h-[90dvh] overflow-y-auto z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl dark:bg-black"
  >
    <template #header>
      <div class="flex flex-col gap-3">
        <!-- Language switcher, on its own row so it never overlaps the title -->
        <div class="flex justify-end">
          <div class="inline-flex rounded-full border border-gray-200 p-0.5 dark:border-zinc-700">
            <!-- 44x44 is the WCAG 2.5.5 / iOS HIG minimum touch target; at the
                 previous text-xs size these were 39x20 and a finger tap mostly
                 missed them on a phone. Do not shrink them back. -->
            <button
              v-for="l in langs"
              :key="l.code"
              type="button"
              :aria-pressed="locale === l.code"
              class="rounded-full px-4 min-h-11 min-w-11 text-sm font-bold transition touch-manipulation"
              :class="locale === l.code
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'"
              @click="setLocale(l.code)"
            >
              {{ l.code.toUpperCase() }}
            </button>
          </div>
        </div>
        <h3 class="text-xl md:text-2xl font-semibold text-center">
          {{ $t('onboarding.title') }}
        </h3>
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

// Language switcher chips, driven by the locales configured in nuxt.config.
const { locale, locales, setLocale } = useI18n()
const langs = locales
</script>

<style scoped>
/* Slim, inset scrollbar so it doesn't sit chunkily on the card's rounded edge. */
.onboarding-card {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}
.onboarding-card::-webkit-scrollbar {
  width: 10px;
}
.onboarding-card::-webkit-scrollbar-track {
  background: transparent;
  /* Keep the thumb clear of the rounded top/bottom corners. */
  margin: 20px 0;
}
.onboarding-card::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.45);
  border-radius: 9999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
.onboarding-card::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.6);
  background-clip: content-box;
}
</style>