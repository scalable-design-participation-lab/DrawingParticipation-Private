<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFeatureStore } from '@base/stores/features'
import type { Feature } from '@base/stores/types/store'

const emit = defineEmits<{
  'select-feature': [feature: Feature]
}>()

const featureStore = useFeatureStore()

const mncFeatures = computed(() =>
  featureStore.features.filter(
    (f) => f.properties && (f.properties as any).string_id,
  ),
)

const sortedFeatures = computed(() =>
  [...mncFeatures.value].sort((a, b) => {
    const dateA = String((a.properties as any)?.date ?? '')
    const dateB = String((b.properties as any)?.date ?? '')
    return dateB.localeCompare(dateA)
  }),
)

const currentPage = ref(0)
const pageSize = 5

const visibleFeatures = computed(() =>
  sortedFeatures.value.slice(
    currentPage.value * pageSize,
    (currentPage.value + 1) * pageSize,
  ),
)

const totalPages = computed(() =>
  Math.ceil(sortedFeatures.value.length / pageSize),
)

function prevPage() {
  if (currentPage.value > 0) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++
}
</script>

<template>
  <div class="fixed bottom-24 left-0 right-0 z-40 flex justify-center pointer-events-none">
    <UCard
      class="pointer-events-auto w-full max-w-sm shadow-xl"
      style="max-height: 60vh;"
      :ui="{
        base: 'overflow-hidden',
        rounded: 'rounded-t-3xl rounded-b-none',
        body: { padding: 'p-0' },
        header: { padding: 'px-0 pt-3 pb-1' },
        footer: { padding: 'p-0' },
      }"
    >
      <!-- Handle bar -->
      <template #header>
        <div class="flex justify-center">
          <div class="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      </template>

      <!-- Feature list -->
      <div class="overflow-y-auto" style="max-height: calc(60vh - 80px);">
        <UButton
          v-for="feature in visibleFeatures"
          :key="feature.id"
          variant="ghost"
          color="gray"
          class="w-full flex items-center gap-4 px-5 py-4 rounded-none border-b border-gray-100 text-left"
          :ui="{ base: 'justify-start' }"
          @click="emit('select-feature', feature)"
        >
          <!-- Icon circle -->
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style="
              border: 2.5px solid transparent;
              background-image: linear-gradient(white, white),
                linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876);
              background-origin: border-box;
              background-clip: padding-box, border-box;
            "
          >
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-teal-500" />
          </div>

          <div class="flex-1 min-w-0 text-left">
            <p class="font-semibold text-gray-900 truncate text-sm">{{ feature.comment }}</p>
            <p class="text-gray-400 text-xs mt-0.5">— km away</p>
          </div>
        </UButton>

        <p v-if="sortedFeatures.length === 0" class="text-center text-gray-400 py-8 text-sm">
          No projects loaded yet.
        </p>
      </div>

      <!-- Pagination -->
      <template #footer>
        <div class="flex items-center justify-center gap-6 py-3 border-t border-gray-100">
          <UButton
            icon="i-heroicons-arrow-uturn-left"
            variant="ghost"
            color="gray"
            size="sm"
            :disabled="currentPage === 0"
            aria-label="Previous page"
            :ui="{ rounded: 'rounded-full' }"
            @click="prevPage"
          />
          <span class="text-xs text-gray-400">{{ currentPage + 1 }} / {{ totalPages || 1 }}</span>
          <UButton
            icon="i-heroicons-arrow-uturn-right"
            variant="ghost"
            color="gray"
            size="sm"
            :disabled="currentPage >= totalPages - 1"
            aria-label="Next page"
            :ui="{ rounded: 'rounded-full' }"
            @click="nextPage"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
