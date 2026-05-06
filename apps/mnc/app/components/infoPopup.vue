<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
    <div
      class="w-full max-w-[1400px] rounded-[30px] p-[2px]"
      style="background: conic-gradient(from 220deg at 50% 50%, #f4878e 0deg, #53c3be 130deg, #d7d84f 250deg, #f4878e 360deg);"
    >
      <UCard
        class="max-h-[92vh] overflow-y-auto rounded-[28px] bg-white"
        :ui="{
          body: { padding: 'p-5 sm:p-7' },
          header: { padding: 'p-5 sm:p-7 pb-4' },
        }"
      >
        <template #header>
          <div class="flex items-start justify-between gap-4 pb-4">
            <h2 class="text-2xl font-bold leading-tight text-gray-900 sm:text-[40px] sm:leading-[1.08]">
              {{ title }}
            </h2>
            <UButton
              aria-label="Close"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="rounded-full ring-2 ring-rose-300"
              @click="$emit('close')"
            />
          </div>
        </template>

        <div class="space-y-6">
          <div class="flex flex-wrap gap-2">
            <UBadge color="primary" variant="solid" class="rounded-full px-4 py-1.5 text-sm font-medium">
              Date published: {{ datePublished }}
            </UBadge>
            <UBadge color="primary" variant="solid" class="rounded-full px-4 py-1.5 text-sm font-medium">
              Location: {{ location }}
            </UBadge>
          </div>

          <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section class="space-y-5">
              <div class="overflow-hidden rounded-2xl bg-teal-50">
                <img v-if="imagePath" :src="imagePath" :alt="title" class="w-full object-cover" />
                <div v-else class="flex items-center justify-center p-4 text-center text-sm text-teal-600">
                  {{ caption || 'No image available' }}
                </div>
              </div>

              <div class="relative rounded-2xl border-2 border-teal-300 p-5 pt-8">
                <UBadge
                  color="primary"
                  variant="solid"
                  class="absolute -top-3 left-4 rounded-full px-4 py-1 text-sm font-medium"
                >
                  Connection to Mobile Networked Creativity
                </UBadge>
                <p :class="['text-sm leading-6 text-gray-700', { 'line-clamp-6': !connectionExpanded }]">
                  {{ connection }}
                </p>
                <button
                  v-if="connection && connection.split(' ').length > 90"
                  @click="connectionExpanded = !connectionExpanded"
                  class="mt-2 text-sm font-medium text-teal-600 hover:underline"
                >
                  {{ connectionExpanded ? 'Read Less...' : 'Read More...' }}
                </button>
              </div>
            </section>

            <section class="space-y-5">
              <div class="relative rounded-2xl border-2 border-teal-300 p-5 pt-8">
                <UBadge
                  color="primary"
                  variant="solid"
                  class="absolute -top-3 left-4 rounded-full px-4 py-1 text-sm font-medium"
                >
                  Main Description
                </UBadge>
                <p :class="['text-sm leading-6 text-gray-700', { 'line-clamp-6': !descriptionExpanded }]">
                  {{ description }}
                </p>
                <button
                  v-if="description && description.split(' ').length > 90"
                  @click="descriptionExpanded = !descriptionExpanded"
                  class="mt-2 text-sm font-medium text-teal-600 hover:underline"
                >
                  {{ descriptionExpanded ? 'Read Less...' : 'Read More...' }}
                </button>
              </div>

              <div class="space-y-3">
                <h3 class="text-3xl font-semibold text-gray-900">Tags</h3>
                <UBadge
                  color="primary"
                  variant="outline"
                  class="w-full justify-start rounded-full px-5 py-2 text-base font-medium"
                >
                  Primary Category: {{ primaryTagText }}
                </UBadge>
                <UBadge
                  color="primary"
                  variant="outline"
                  class="w-full justify-start rounded-full px-5 py-2 text-base font-medium"
                >
                  Secondary Category: {{ secondaryTagText }}
                </UBadge>
              </div>
            </section>
          </div>

          <section>
            <h3 class="mb-3 text-xl font-semibold text-gray-900">Learn More</h3>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <template v-for="(link, index) in links" :key="index">
                <a
                  v-if="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex"
                >
                  <UBadge color="primary" variant="outline" class="rounded-full px-5 py-2 text-sm font-medium">
                    {{ link.label }}
                  </UBadge>
                </a>
                <UBadge v-else color="primary" variant="outline" class="rounded-full px-5 py-2 text-sm font-medium">
                  {{ link.label }}
                </UBadge>
              </template>
            </div>
          </section>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Link {
  label: string
  url?: string
}

interface Props {
  title?: string
  datePublished?: string | number
  location?: string
  imagePath?: string
  caption?: string
  description?: string
  connection?: string
  primaryTag?: string
  secondaryTag?: string | string[]
  links?: Link[]
}

withDefaults(defineProps<Props>(), {
  title: 'Title',
  datePublished: '',
  location: '',
  imagePath: '',
  caption: '',
  description: 'Text (50 words)',
  connection: 'Text (50 words)',
  primaryTag: '',
  secondaryTag: '',
  links: () => [
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
  ],
})

defineEmits<{
  close: []
}>()

const descriptionExpanded = ref(false)
const connectionExpanded = ref(false)

</script>

<style scoped>
.line-clamp-6 {
  display: -webkit-box;
  line-clamp: 6;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
