<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Contribution } from '../api/firebase'
import type { Entry } from '../composables/catalog'
import { categoryMeta } from '../composables/categoryMeta'
import { useLocalizedEntry } from '../composables/useLocalizedEntry'

/**
 * Desktop detail panel for one entry: text, gallery, voice notes, links and
 * the community contributions (which the page loads into `contributions`).
 */
const props = withDefaults(defineProps<{
  entry: Entry
  contributions?: Contribution[]
  loading?: boolean
  isAdmin?: boolean
}>(), {
  contributions: () => [],
  loading: false,
  isAdmin: false,
})

const emit = defineEmits<{
  close: []
  /** The primary-tag chip: show only this theme. */
  showTag: [tag: string]
  /** A finished upload: { projectId, comment, media }. */
  contribute: [payload: { projectId: string, comment: string, media: unknown[] }]
  approve: [contribution: Contribution]
  delete: [contribution: Contribution]
}>()

const { t } = useI18n()
const { lf, linkLabel, tagLabel } = useLocalizedEntry()

const p = computed(() => props.entry.properties ?? {})
const stringId = computed(() => p.value.string_id || '')
const title = computed(() => lf(p.value, 'title', props.entry.comment))
const location = computed(() => lf(p.value, 'location', p.value.location || ''))
const description = computed(() => lf(p.value, 'description', p.value.description || ''))
const connection = computed(() => lf(p.value, 'mncConnection', p.value.mncConnection || ''))
const primaryTag = computed(() => p.value.primaryTag || '')
const photos = computed(() => (Array.isArray(p.value.photos) ? p.value.photos : []))
const audio = computed(() => (Array.isArray(p.value.audio) ? p.value.audio : []))
const caption = computed(() => (Array.isArray(p.value.mediaCaptions) ? p.value.mediaCaptions.join(' ') : p.value.mediaCaptions || ''))
const secondaryTags = computed(() => {
  const s = p.value.secondaryTags
  return Array.isArray(s) ? s.filter(Boolean) : typeof s === 'string' && s && s !== 'N/A' ? s.split(',').map(x => x.trim()).filter(Boolean) : []
})
const links = computed(() => {
  if (Array.isArray(p.value.linkList) && p.value.linkList.length) {
    return p.value.linkList
  }
  return (p.value.links || '').split(';').map(l => l.trim()).filter(Boolean).map(l => ({ label: l, url: '' }))
})

const descriptionExpanded = ref(false)
const connectionExpanded = ref(false)
const showUpload = ref(false)

const primaryMeta = computed(() => categoryMeta(primaryTag.value))
const colorMode = useColorMode()
const tagChipStyle = computed(() => ({ backgroundColor: `${primaryMeta.value.color}22`, color: colorMode.value === 'dark' ? primaryMeta.value.color : primaryMeta.value.ink }))

function linkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (!then) {
    return ''
  }
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) {
    return t('detail.justNow')
  }
  if (mins < 60) {
    return t('detail.minutesAgo', { n: mins })
  }
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) {
    return t('detail.hoursAgo', { n: hrs })
  }
  const days = Math.floor(hrs / 24)
  return days < 30 ? t('detail.daysAgo', { n: days }) : new Date(iso).toLocaleDateString()
}

function onUploaded(payload: { comment: string, media: unknown[] }) {
  showUpload.value = false
  emit('contribute', { projectId: stringId.value, ...payload })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
    <div class="w-full max-w-[1400px] rounded-[30px] p-[2px]" style="background: conic-gradient(from 220deg at 50% 50%, #f4878e 0deg, #53c3be 130deg, #d7d84f 250deg, #f4878e 360deg);">
      <UCard class="mnc-popup-scroll max-h-[92vh] overflow-y-auto rounded-[28px] bg-white dark:bg-zinc-900" :ui="{ body: { padding: 'p-5 sm:p-7' }, header: { padding: 'p-5 sm:p-7 pb-4' } }">
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <h2 class="text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl sm:leading-[1.1]">
              {{ title }}
            </h2>
            <div class="flex shrink-0 items-center gap-2">
              <UButton v-if="stringId" color="primary" variant="soft" size="sm" icon="i-heroicons-camera" class="rounded-full" @click="showUpload = !showUpload">
                <span class="hidden sm:inline">{{ $t('detail.addPhoto') }}</span>
                <span class="sm:hidden">{{ $t('detail.add') }}</span>
              </UButton>
              <UButton :aria-label="$t('detail.close')" color="gray" variant="ghost" icon="i-heroicons-x-mark" class="rounded-full" @click="emit('close')" />
            </div>
          </div>
          <div v-if="p.date || location" class="mt-4 flex flex-wrap gap-2">
            <span v-if="p.date" class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:bg-zinc-800 dark:text-gray-200">
              <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 text-teal-600" />{{ p.date }}
            </span>
            <span v-if="location" class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:bg-zinc-800 dark:text-gray-200">
              <UIcon name="i-heroicons-map-pin" class="h-4 w-4 text-teal-600" />{{ location }}
            </span>
          </div>
        </template>

        <div class="space-y-7">
          <div class="grid gap-6 lg:grid-cols-2">
            <section class="space-y-5">
              <Carousel :images="photos" :caption="caption" :alt="title" height="lg" :empty-title="$t('photo.noPhoto')" :empty-text="$t('photo.beFirst')" :prev-label="$t('photo.prevPhoto')" :next-label="$t('photo.nextPhoto')" />
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
                <p class="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300" :class="[{ 'line-clamp-6': !connectionExpanded }]">
                  {{ connection }}
                </p>
                <button v-if="connection.split(' ').length > 90" class="mt-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400" @click="connectionExpanded = !connectionExpanded">
                  {{ connectionExpanded ? $t('detail.readLess') : $t('detail.readMore') }}
                </button>
              </div>
            </section>
            <section class="space-y-5">
              <div v-if="description" class="rounded-2xl bg-gray-50 p-5 dark:bg-zinc-800/50">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ $t('detail.description') }}
                </p>
                <p class="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300" :class="[{ 'line-clamp-[12]': !descriptionExpanded }]">
                  {{ description }}
                </p>
                <button v-if="description.split(' ').length > 90" class="mt-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400" @click="descriptionExpanded = !descriptionExpanded">
                  {{ descriptionExpanded ? $t('detail.readLess') : $t('detail.readMore') }}
                </button>
              </div>
              <div>
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ $t('detail.tags') }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition hover:brightness-95" :style="tagChipStyle" :title="$t('detail.showAll', { tag: tagLabel(primaryTag) })" @click="primaryTag && emit('showTag', primaryTag)">
                    <UIcon :name="primaryMeta.icon" class="h-3.5 w-3.5" />{{ tagLabel(primaryTag) || 'N/A' }}
                  </button>
                  <span v-for="(tag, i) in secondaryTags" :key="i" class="inline-flex items-center rounded-full bg-gray-100 px-3.5 py-1.5 text-sm text-gray-600 dark:bg-zinc-800 dark:text-gray-300">{{ tag }}</span>
                </div>
              </div>
            </section>
          </div>

          <section v-if="links.length">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {{ $t('detail.learnMore') }}
            </p>
            <div class="grid gap-2 sm:grid-cols-2">
              <template v-for="(link, index) in links" :key="index">
                <a v-if="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 transition hover:border-teal-300 hover:bg-teal-50 dark:border-zinc-700 dark:hover:bg-teal-950/30">
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400 group-hover:text-teal-500" />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-700 group-hover:text-teal-700 dark:text-gray-200">{{ linkLabel(link.label) }}</span>
                    <span class="block truncate text-xs text-gray-400">{{ linkHost(link.url) }}</span>
                  </span>
                </a>
                <span v-else class="flex items-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 dark:border-zinc-700">{{ linkLabel(link.label) }}</span>
              </template>
            </div>
          </section>

          <section v-if="stringId" class="border-t border-gray-100 pt-6 dark:border-zinc-800">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('detail.contributions') }} <span v-if="contributions.length" class="font-normal text-gray-400">({{ contributions.length }})</span>
              </h3>
              <UButton color="primary" variant="soft" size="xs" icon="i-heroicons-plus" class="shrink-0 rounded-full" @click="showUpload = true">
                {{ $t('detail.add') }}
              </UButton>
            </div>
            <div v-if="loading" class="flex items-center gap-2 text-sm text-gray-400">
              <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 animate-spin" />{{ $t('detail.loading') }}
            </div>
            <div v-else-if="!contributions.length" class="rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-zinc-700">
              <UIcon name="i-heroicons-camera" class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p class="text-sm text-gray-500">
                {{ $t('detail.noContributions') }}
              </p>
            </div>
            <div v-else class="space-y-4">
              <article v-for="c in contributions" :key="c.id" class="rounded-2xl border border-gray-200 p-4 dark:border-zinc-700">
                <div class="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <UIcon name="i-heroicons-user-circle" class="h-4 w-4" />
                  <span>{{ c.userId === 'anonymous' ? $t('detail.anonymous') : $t('detail.contributor') }}</span>
                  <span v-if="relativeTime(c.createdAt)">· {{ relativeTime(c.createdAt) }}</span>
                  <span v-if="!c.approved" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{{ $t('detail.pending') }}</span>
                </div>
                <div v-if="c.media.length" class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <template v-for="(media, i) in c.media" :key="i">
                    <audio v-if="media.kind === 'audio'" :src="media.url" controls class="col-span-full w-full" />
                    <a v-else :href="media.url" target="_blank" rel="noopener noreferrer" class="block overflow-hidden rounded-lg bg-teal-50 dark:bg-teal-950/30">
                      <img :src="media.url" :alt="media.name" loading="lazy" decoding="async" class="h-28 w-full object-cover transition-transform duration-200 hover:scale-105">
                    </a>
                  </template>
                </div>
                <p v-if="c.comment" class="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {{ c.comment }}
                </p>
                <div v-if="isAdmin" class="mt-3 flex gap-2 border-t border-gray-100 pt-2 dark:border-zinc-700">
                  <UButton v-if="!c.approved" size="2xs" color="primary" @click="emit('approve', c)">
                    {{ $t('detail.approve') }}
                  </UButton>
                  <UButton size="2xs" color="red" variant="soft" @click="emit('delete', c)">
                    {{ $t('detail.delete') }}
                  </UButton>
                </div>
              </article>
            </div>
          </section>
        </div>
      </UCard>
    </div>

    <div v-if="showUpload" class="fixed right-5 top-5 z-[60]">
      <ImageUploadModal :is-visible="showUpload" :project-id="stringId" @close="showUpload = false" @uploaded="onUploaded" />
    </div>
  </div>
</template>

<style scoped>
.line-clamp-6 {
  display: -webkit-box;
  line-clamp: 6;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mnc-popup-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}
.mnc-popup-scroll::-webkit-scrollbar {
  width: 10px;
}
.mnc-popup-scroll::-webkit-scrollbar-track {
  background: transparent;
  margin: 22px 0;
}
.mnc-popup-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.45);
  border-radius: 9999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
</style>
