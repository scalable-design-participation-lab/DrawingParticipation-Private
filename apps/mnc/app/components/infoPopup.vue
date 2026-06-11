<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
    <div
      class="w-full max-w-[1400px] rounded-[30px] p-[2px]"
      style="background: conic-gradient(from 220deg at 50% 50%, #f4878e 0deg, #53c3be 130deg, #d7d84f 250deg, #f4878e 360deg);"
    >
      <UCard
        class="mnc-popup-scroll max-h-[92vh] overflow-y-auto rounded-[28px] bg-white"
        :ui="{
          body: { padding: 'p-5 sm:p-7' },
          header: { padding: 'p-5 sm:p-7 pb-4' },
        }"
      >
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <h2 class="text-2xl font-bold leading-tight text-gray-900 sm:text-4xl sm:leading-[1.1]">
              {{ title }}
            </h2>
            <div class="flex shrink-0 items-center gap-2">
              <UButton
                v-if="stringId"
                color="primary"
                variant="soft"
                size="sm"
                icon="i-heroicons-camera"
                class="rounded-full"
                @click="showUpload = !showUpload"
              >
                <span class="hidden sm:inline">Add photo or comment</span>
                <span class="sm:hidden">Add</span>
              </UButton>
              <UButton
                aria-label="Close"
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                class="rounded-full"
                @click="$emit('close')"
              />
            </div>
          </div>

          <!-- Meta chips -->
          <div v-if="datePublished || location" class="mt-4 flex flex-wrap gap-2">
            <span
              v-if="datePublished"
              class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:bg-zinc-800 dark:text-gray-200"
            >
              <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 text-teal-600" />
              {{ datePublished }}
            </span>
            <span
              v-if="location"
              class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:bg-zinc-800 dark:text-gray-200"
            >
              <UIcon name="i-heroicons-map-pin" class="h-4 w-4 text-teal-600" />
              {{ location }}
            </span>
          </div>
        </template>

        <div class="space-y-7">
          <div class="grid gap-6 lg:grid-cols-2">
            <!-- Left: photo + connection -->
            <section class="space-y-5">
              <PhotoCarousel
                :images="galleryImages"
                :caption="captionText"
                :alt="title"
                height="280px"
              />

              <div v-if="connection" class="rounded-2xl bg-teal-50/70 p-5 dark:bg-teal-950/30">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  Connection to Mobile Networked Creativity
                </p>
                <p :class="['text-sm leading-6 text-gray-700 dark:text-gray-300', { 'line-clamp-6': !connectionExpanded }]">
                  {{ connection }}
                </p>
                <button
                  v-if="connection && connection.split(' ').length > 90"
                  class="mt-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                  @click="connectionExpanded = !connectionExpanded"
                >
                  {{ connectionExpanded ? 'Read less' : 'Read more' }}
                </button>
              </div>
            </section>

            <!-- Right: description + tags -->
            <section class="space-y-5">
              <div v-if="description" class="rounded-2xl bg-gray-50 p-5 dark:bg-zinc-800/50">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Description
                </p>
                <p :class="['text-sm leading-6 text-gray-700 dark:text-gray-300', { 'line-clamp-[12]': !descriptionExpanded }]">
                  {{ description }}
                </p>
                <button
                  v-if="description && description.split(' ').length > 90"
                  class="mt-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                  @click="descriptionExpanded = !descriptionExpanded"
                >
                  {{ descriptionExpanded ? 'Read less' : 'Read more' }}
                </button>
              </div>

              <div>
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tags
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3.5 py-1.5 text-sm font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    <UIcon name="i-heroicons-tag" class="h-3.5 w-3.5" />
                    {{ primaryTagText }}
                  </span>
                  <span
                    v-for="(tag, i) in secondaryTagList"
                    :key="i"
                    class="inline-flex items-center rounded-full bg-gray-100 px-3.5 py-1.5 text-sm text-gray-600 dark:bg-zinc-800 dark:text-gray-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <section v-if="links && links.length">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Learn More
            </p>
            <div class="flex flex-wrap gap-2">
              <template v-for="(link, index) in links" :key="index">
                <a
                  v-if="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group inline-flex max-w-[320px] items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-teal-950/30"
                >
                  <UIcon
                    name="i-heroicons-arrow-top-right-on-square"
                    class="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-teal-500"
                  />
                  <span class="truncate">{{ link.label }}</span>
                </a>
                <span
                  v-else
                  class="inline-flex max-w-[320px] items-center rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-500 dark:border-zinc-700"
                >
                  <span class="truncate">{{ link.label }}</span>
                </span>
              </template>
            </div>
          </section>

          <!-- Community contributions: user-uploaded images + comments -->
          <section v-if="stringId" class="border-t border-gray-100 pt-6 dark:border-zinc-800">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Community Contributions
                <span v-if="projectContributions.length" class="font-normal text-gray-400">
                  ({{ projectContributions.length }})
                </span>
              </h3>
              <UButton
                color="primary"
                variant="soft"
                size="xs"
                icon="i-heroicons-plus"
                class="shrink-0 rounded-full"
                @click="showUpload = true"
              >
                Add
              </UButton>
            </div>

            <div
              v-if="contributions.isLoading"
              class="flex items-center gap-2 text-sm text-gray-400"
            >
              <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 animate-spin" />
              Loading…
            </div>

            <div
              v-else-if="!projectContributions.length"
              class="rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-zinc-700"
            >
              <UIcon name="i-heroicons-camera" class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p class="text-sm text-gray-500">
                No community contributions yet. Be the first to add a photo or comment.
              </p>
            </div>

            <div v-else class="space-y-4">
              <article
                v-for="contribution in projectContributions"
                :key="contribution.id"
                class="rounded-2xl border border-gray-200 p-4 dark:border-zinc-700"
              >
                <div class="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <UIcon name="i-heroicons-user-circle" class="h-4 w-4" />
                  <span>{{ contribution.userId === 'anonymous' ? 'Anonymous' : 'Contributor' }}</span>
                  <span v-if="formatRelativeTime(contribution.createdAt)">
                    · {{ formatRelativeTime(contribution.createdAt) }}
                  </span>
                </div>
                <div
                  v-if="contribution.media.length"
                  class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  <a
                    v-for="(media, mediaIndex) in contribution.media"
                    :key="mediaIndex"
                    :href="media.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block overflow-hidden rounded-lg bg-teal-50"
                  >
                    <img
                      :src="media.url"
                      :alt="media.name"
                      class="h-28 w-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </a>
                </div>
                <p v-if="contribution.comment" class="text-sm leading-6 text-gray-700">
                  {{ contribution.comment }}
                </p>
              </article>
            </div>
          </section>
        </div>
      </UCard>
    </div>

    <!-- Floating upload modal, opened from the header button -->
    <div v-if="showUpload" class="fixed right-5 top-5 z-[60]">
      <ImageUploadModal
        :is-visible="showUpload"
        :project-id="stringId"
        @close="showUpload = false"
        @uploaded="handleUploaded"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useContributionsStore } from '../stores/contributions'

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
  // All photo paths for this project; rendered as a carousel.
  photos?: string[]
  // Stable MNC project id (mncData.json `string_id`). Used to load and save
  // community contributions for this project.
  stringId?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Title',
  datePublished: '',
  location: '',
  imagePath: '',
  caption: '',
  description: 'Text (50 words)',
  connection: 'Text (50 words)',
  primaryTag: '',
  secondaryTag: '',
  links: () => [],
  photos: () => [],
  stringId: '',
})

defineEmits<{
  close: []
}>()

const descriptionExpanded = ref(false)
const connectionExpanded = ref(false)

// Display text for the tag badges. `secondaryTag` may arrive as an array
// (the parent passes `secondaryTags`), so normalize it to a readable string.
const primaryTagText = computed(() => props.primaryTag || 'N/A')
const secondaryTagText = computed(() =>
  Array.isArray(props.secondaryTag)
    ? props.secondaryTag.join(', ')
    : props.secondaryTag || 'N/A',
)

// Individual secondary tags, for rendering as separate chips.
const secondaryTagList = computed<string[]>(() => {
  const s = props.secondaryTag
  if (Array.isArray(s))
    return s.filter(Boolean)
  if (typeof s === 'string' && s && s !== 'N/A')
    return s.split(',').map(x => x.trim()).filter(Boolean)
  return []
})

// Carousel images come from the project's photo manifest. User-submitted pins
// (and the few catalog entries without photos) have none, so the carousel shows
// its own "No image available" state rather than a broken /Solution_Photos URL.
const galleryImages = computed(() => (Array.isArray(props.photos) ? props.photos : []))

// Media caption can arrive as a string or an array; normalize to a string.
const captionText = computed(() => {
  const c = props.caption as unknown
  return Array.isArray(c) ? c.join(' ') : ((c as string) || '')
})

// Community contributions (user-uploaded images + comments) for this project.
const contributions = useContributionsStore()
const showUpload = ref(false)
const projectContributions = computed(() => contributions.byProject[props.stringId] || [])

// Load contributions whenever a project is shown (and when it changes).
function loadContributions() {
  if (props.stringId)
    contributions.fetchContributions(props.stringId)
}

onMounted(loadContributions)
watch(() => props.stringId, loadContributions)

function handleUploaded() {
  showUpload.value = false
  // The store already refreshed the cache; nothing else to do here.
}

// Compact relative-time label for a contribution's ISO timestamp.
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!then)
    return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1)
    return 'just now'
  if (mins < 60)
    return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)
    return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)
    return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

</script>

<style scoped>
.line-clamp-6 {
  display: -webkit-box;
  line-clamp: 6;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Thin, inset, rounded scrollbar that floats inside the card instead of the
   chunky browser default sitting on the rounded gradient edge. */
.mnc-popup-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}
.mnc-popup-scroll::-webkit-scrollbar {
  width: 10px;
}
.mnc-popup-scroll::-webkit-scrollbar-track {
  background: transparent;
  /* Shorten the track so the bar never reaches the rounded corners. */
  margin: 22px 0;
}
.mnc-popup-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.45);
  border-radius: 9999px;
  /* Transparent border + content-box clip = a slim 4px thumb inset from edge. */
  border: 3px solid transparent;
  background-clip: content-box;
}
.mnc-popup-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.6);
  background-clip: content-box;
}
</style>
