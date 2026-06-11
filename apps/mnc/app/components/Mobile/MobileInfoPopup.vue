<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Feature } from '@base/stores/types/store'
import type { Properties } from '../../stores/types/store'
import { useContributionsStore } from '../../stores/contributions'

const props = defineProps<{
  feature: Feature
  state: 'expanded' | 'full'
}>()

const emit = defineEmits<{
  close: []
  'update:state': [state: 'expanded' | 'full']
}>()

const p = computed(() => props.feature.properties as Properties | undefined)

// Community contributions (user-uploaded photos + comments) for this project.
const contributions = useContributionsStore()
const showUpload = ref(false)
const projectContributions = computed(
  () => contributions.byProject[p.value?.string_id || ''] || [],
)

function loadContributions() {
  if (p.value?.string_id)
    contributions.fetchContributions(p.value.string_id)
}
onMounted(loadContributions)
watch(() => p.value?.string_id, loadContributions)

function handleUploaded() {
  showUpload.value = false
}

const imagePath = computed(() =>
  p.value?.string_id ? `/Solution_Photos/${p.value.string_id}/1.png` : null,
)

// Photos come from the project's manifest; user-submitted pins have none and
// fall through to the carousel's empty state (no broken /Solution_Photos URL).
const galleryImages = computed(() => (Array.isArray(p.value?.photos) ? p.value.photos : []))

const parsedLinks = computed(() => {
  // Prefer the structured list (real URLs from mncLinks.csv).
  if (Array.isArray(p.value?.linkList) && p.value.linkList.length)
    return p.value.linkList
  if (!p.value?.links) return []
  return p.value.links
    .split(';')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({ label: l, url: '' }))
})

function toggleState() {
  emit('update:state', props.state === 'expanded' ? 'full' : 'expanded')
}
</script>

<template>
  <div
    class="fixed left-0 right-0 z-40 flex justify-center pointer-events-none transition-all duration-300 bottom-24 px-4"
  >
    <!-- Expanded state: compact summary card -->
    <UCard
      v-if="state === 'expanded'"
      class="pointer-events-auto w-full max-w-sm shadow-xl transition-all duration-300"
      style="max-height: 45vh;"
      :ui="{
        base: 'overflow-hidden',
        rounded: 'rounded-t-3xl rounded-b-none',
        body: { padding: 'p-0' },
        header: { padding: 'px-0 pt-3 pb-1' },
        footer: { padding: 'p-0' },
      }"
    >
      <template #header>
        <div class="flex justify-center cursor-pointer" @click="toggleState">
          <div class="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      </template>

      <div class="px-5 py-4">
        <div class="flex items-start gap-4">
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

          <div class="flex-1 min-w-0">
            <p class="font-bold text-gray-900 text-sm leading-tight">{{ feature.comment }}</p>
            <p v-if="p?.primaryTag" class="text-xs text-teal-500 mt-1 font-medium">{{ p.primaryTag }}</p>
            <p class="text-xs text-gray-500 mt-2 line-clamp-3">
              {{ p?.shortDesc || p?.description }}
            </p>
          </div>
        </div>

        <UButton
          variant="ghost"
          color="gray"
          size="xs"
          class="w-full mt-4 justify-center text-gray-400"
          @click="toggleState"
        >
          Tap to expand
        </UButton>
      </div>
    </UCard>

    <!-- Full state: themed teal popup matching design spec -->
    <div
      v-else
      class="pointer-events-auto w-full max-w-sm rounded-3xl border-[3px] border-white shadow-2xl overflow-hidden flex flex-col"
      style="background-color: #5FC5BD; max-height: 85vh;"
    >
      <!-- Drag handle to collapse -->
      <div class="flex justify-center pt-2 pb-1 cursor-pointer flex-shrink-0" @click="toggleState">
        <div class="w-10 h-1 bg-white/50 rounded-full" />
      </div>

      <div class="overflow-y-auto px-6 pb-6 pt-2 space-y-4">
        <!-- Title -->
        <h2 class="text-2xl font-bold text-white leading-tight">
          {{ feature.comment }}
        </h2>

        <!-- Date pill -->
        <div v-if="p?.date" class="flex items-center gap-3 flex-wrap">
          <span class="border-2 border-white rounded-full px-4 py-1 text-sm text-white font-medium whitespace-nowrap">
            Date published:
          </span>
          <span class="text-white text-sm">{{ p?.date }}</span>
        </div>

        <!-- Location pill -->
        <div v-if="p?.location" class="flex items-center gap-3 flex-wrap">
          <span class="border-2 border-white rounded-full px-4 py-1 text-sm text-white font-medium whitespace-nowrap">
            Location:
          </span>
          <span class="text-white text-sm">{{ p?.location }}</span>
        </div>

        <!-- Description pill + text -->
        <div v-if="p?.description">
          <span class="inline-block border-2 border-white rounded-full px-4 py-1 text-sm text-white font-medium">
            Description:
          </span>
          <p class="text-white text-sm leading-relaxed mt-3">{{ p?.description }}</p>
        </div>

        <!-- Photo carousel with white border -->
        <div
          v-if="galleryImages.length"
          class="overflow-hidden rounded-2xl border-2 border-white"
        >
          <PhotoCarousel :images="galleryImages" :alt="feature.comment" height="200px" />
        </div>

        <!-- Links -->
        <div v-if="parsedLinks.length">
          <p class="text-sm font-bold text-white mb-2">Learn More:</p>
          <ul class="space-y-1">
            <li v-for="(link, i) in parsedLinks" :key="i" class="flex items-start gap-2">
              <UIcon name="i-heroicons-link" class="w-3 h-3 text-white flex-shrink-0 mt-0.5" />
              <a
                v-if="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-white text-xs underline decoration-white/40 hover:decoration-white"
              >{{ link.label }}</a>
              <span v-else class="text-white text-xs">{{ link.label }}</span>
            </li>
          </ul>
        </div>

        <!-- Community contributions -->
        <div v-if="p?.string_id" class="border-t border-white/30 pt-4">
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-bold text-white">
              Community
              <span v-if="projectContributions.length" class="font-normal text-white/70">
                ({{ projectContributions.length }})
              </span>
            </p>
            <button
              type="button"
              class="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white"
              @click="showUpload = true"
            >
              <UIcon name="i-heroicons-plus" class="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <p v-if="!projectContributions.length" class="text-xs text-white/70">
            Be the first to add a photo or comment.
          </p>

          <div v-else class="space-y-3">
            <div
              v-for="c in projectContributions"
              :key="c.id"
              class="rounded-xl bg-white/15 p-3"
            >
              <div v-if="c.media.length" class="mb-2 grid grid-cols-3 gap-1.5">
                <a
                  v-for="(m, mi) in c.media"
                  :key="mi"
                  :href="m.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img :src="m.url" :alt="m.name" class="h-16 w-full rounded object-cover" />
                </a>
              </div>
              <p v-if="c.comment" class="text-xs text-white">{{ c.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating upload modal -->
    <div v-if="showUpload" class="pointer-events-auto fixed left-1/2 top-20 z-[60] -translate-x-1/2">
      <ImageUploadModal
        :is-visible="showUpload"
        :project-id="p?.string_id || ''"
        @close="showUpload = false"
        @uploaded="handleUploaded"
      />
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
