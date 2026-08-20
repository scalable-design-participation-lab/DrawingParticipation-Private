<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
    <div
      class="w-full max-w-[1400px] rounded-[30px] p-[2px]"
      style="background: conic-gradient(from 220deg at 50% 50%, #f4878e 0deg, #53c3be 130deg, #d7d84f 250deg, #f4878e 360deg);"
    >
      <UCard
        class="mnc-popup-scroll max-h-[92vh] overflow-y-auto rounded-[28px] bg-white dark:bg-zinc-900"
        :ui="{
          body: { padding: 'p-5 sm:p-7' },
          header: { padding: 'p-5 sm:p-7 pb-4' },
        }"
      >
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <h2 class="text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl sm:leading-[1.1]">
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
                <span class="hidden sm:inline">{{ $t('detail.addPhoto') }}</span>
                <span class="sm:hidden">{{ $t('detail.add') }}</span>
              </UButton>
              <UButton
                :aria-label="$t('detail.close')"
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
                height="340px"
              />

              <div v-if="audio.length" class="space-y-2 rounded-2xl bg-teal-50/70 p-4 dark:bg-teal-950/30">
                <p class="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  {{ $t('detail.voiceNotes') }}
                </p>
                <audio v-for="url in audio" :key="url" :src="url" controls class="w-full" />
              </div>

              <div v-if="connection" class="rounded-2xl bg-teal-50/70 p-5 dark:bg-teal-950/30">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  {{ $t('detail.connection') }}
                </p>
                <p :class="['whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300', { 'line-clamp-6': !connectionExpanded }]">
                  {{ connection }}
                </p>
                <button
                  v-if="connection && connection.split(' ').length > 90"
                  class="mt-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                  @click="connectionExpanded = !connectionExpanded"
                >
                  {{ connectionExpanded ? $t('detail.readLess') : $t('detail.readMore') }}
                </button>
              </div>
            </section>

            <!-- Right: description + tags -->
            <section class="space-y-5">
              <div v-if="description" class="rounded-2xl bg-gray-50 p-5 dark:bg-zinc-800/50">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ $t('detail.description') }}
                </p>
                <p :class="['whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300', { 'line-clamp-[12]': !descriptionExpanded }]">
                  {{ description }}
                </p>
                <button
                  v-if="description && description.split(' ').length > 90"
                  class="mt-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                  @click="descriptionExpanded = !descriptionExpanded"
                >
                  {{ descriptionExpanded ? $t('detail.readLess') : $t('detail.readMore') }}
                </button>
              </div>

              <div>
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ $t('detail.tags') }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition hover:brightness-95"
                    :style="tagChipStyle"
                    :title="$t('detail.showAll', { tag: primaryTagText })"
                    @click="onTagClick(primaryTag)"
                  >
                    <UIcon :name="primaryMeta.icon" class="h-3.5 w-3.5" />
                    {{ primaryTagText }}
                  </button>
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
              {{ $t('detail.learnMore') }}
            </p>
            <div class="grid gap-2 sm:grid-cols-2">
              <template v-for="(link, index) in links" :key="index">
                <a
                  v-if="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-start gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 transition hover:border-teal-300 hover:bg-teal-50 dark:border-zinc-700 dark:hover:bg-teal-950/30"
                >
                  <UIcon
                    name="i-heroicons-arrow-top-right-on-square"
                    class="mt-0.5 h-4 w-4 shrink-0 text-gray-400 group-hover:text-teal-500"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-700 group-hover:text-teal-700 dark:text-gray-200">{{ link.label }}</span>
                    <span class="block truncate text-xs text-gray-400">{{ linkHost(link.url) }}</span>
                  </span>
                </a>
                <span
                  v-else
                  class="flex items-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 dark:border-zinc-700"
                >
                  {{ link.label }}
                </span>
              </template>
            </div>
          </section>

          <!-- Community contributions: user-uploaded images + comments -->
          <section v-if="stringId" class="border-t border-gray-100 pt-6 dark:border-zinc-800">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('detail.contributions') }}
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
                {{ $t('detail.add') }}
              </UButton>
            </div>

            <div
              v-if="contributions.isLoading"
              class="flex items-center gap-2 text-sm text-gray-400"
            >
              <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 animate-spin" />
              {{ $t('detail.loading') }}
            </div>

            <div
              v-else-if="!projectContributions.length"
              class="rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-zinc-700"
            >
              <UIcon name="i-heroicons-camera" class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p class="text-sm text-gray-500">
                {{ $t('detail.noContributions') }}
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
                  <span>{{ contribution.userId === 'anonymous' ? $t('detail.anonymous') : $t('detail.contributor') }}</span>
                  <span v-if="formatRelativeTime(contribution.createdAt)">
                    · {{ formatRelativeTime(contribution.createdAt) }}
                  </span>
                  <span
                    v-if="!contribution.approved"
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    {{ $t('detail.pending') }}
                  </span>
                </div>
                <div
                  v-if="contribution.media.length"
                  class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  <template v-for="(media, mediaIndex) in contribution.media" :key="mediaIndex">
                    <audio
                      v-if="media.kind === 'audio'"
                      :src="media.url"
                      controls
                      class="col-span-full w-full"
                    />
                    <a
                      v-else
                      :href="media.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block overflow-hidden rounded-lg bg-teal-50 dark:bg-teal-950/30"
                    >
                      <img
                        :src="media.url"
                        :alt="media.name"
                        class="h-28 w-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                    </a>
                  </template>
                </div>
                <p v-if="contribution.comment" class="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {{ contribution.comment }}
                </p>

                <!-- Moderator actions -->
                <div v-if="auth.isAdmin" class="mt-3 flex gap-2 border-t border-gray-100 pt-2 dark:border-zinc-700">
                  <UButton v-if="!contribution.approved" size="2xs" color="primary" @click="approveContribution(contribution)">{{ $t('detail.approve') }}</UButton>
                  <UButton size="2xs" color="red" variant="soft" @click="deleteContribution(contribution)">{{ $t('detail.delete') }}</UButton>
                </div>
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
import { useFilterStore } from '../stores/filter'
import { useAuthStore } from '../stores/auth'
import type { Contribution } from '../stores/types/contribution'
import { categoryMeta } from '../composables/categoryMeta'

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
  // Voice notes recorded with the entry; rendered as audio players.
  audio?: string[]
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
  audio: () => [],
  stringId: '',
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

// Clicking the primary tag filters the map to that theme and opens the list, so
// the user can see every entry sharing the tag.
const filter = useFilterStore()
function onTagClick(tag: string) {
  if (!tag || tag === 'N/A')
    return
  filter.showOnlyTag(tag)
  filter.openList()
  emit('close')
}

const descriptionExpanded = ref(false)
const connectionExpanded = ref(false)

// Display text for the tag badges. `secondaryTag` may arrive as an array
// (the parent passes `secondaryTags`), so normalize it to a readable string.
const primaryTagText = computed(() => props.primaryTag || 'N/A')

// Category accent (color + glyph) for the primary-tag chip, shared with the map
// markers so a project reads the same on the pin and in the detail panel.
const primaryMeta = computed(() => categoryMeta(props.primaryTag))

// The readable source for a "Learn more" link, shown under its title so a vague
// label like "Home Page" reveals where it actually points (e.g. who.int).
function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

// The chip tints its background with the accent in both themes, but the label
// needs the darkened `ink` on the light card (the vivid color is too faint on
// white) and the vivid color on the dark card.
const colorMode = useColorMode()
const tagChipStyle = computed(() => ({
  backgroundColor: `${primaryMeta.value.color}22`,
  color: colorMode.value === 'dark' ? primaryMeta.value.color : primaryMeta.value.ink,
}))
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
const auth = useAuthStore()
const showUpload = ref(false)
const projectContributions = computed(() => contributions.byProject[props.stringId] || [])

async function approveContribution(c: Contribution) {
  await contributions.approveContribution(c.id!, props.stringId)
}
async function deleteContribution(c: Contribution) {
  await contributions.deleteContribution(c)
}

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
    return t('detail.justNow')
  if (mins < 60)
    return t('detail.minutesAgo', { n: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)
    return t('detail.hoursAgo', { n: hrs })
  const days = Math.floor(hrs / 24)
  if (days < 30)
    return t('detail.daysAgo', { n: days })
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
