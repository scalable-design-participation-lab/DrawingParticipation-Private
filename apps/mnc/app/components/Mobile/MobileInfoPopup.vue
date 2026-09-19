<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Contribution } from '../../api/firebase'
import type { Entry } from '../../composables/catalog'
import { useLocalizedEntry } from '../../composables/useLocalizedEntry'

/** Mobile bottom sheet for one entry: a compact card, or the full teal panel. */
const props = withDefaults(defineProps<{
  entry: Entry
  state?: 'expanded' | 'full'
  contributions?: Contribution[]
  isAdmin?: boolean
}>(), {
  state: 'expanded',
  contributions: () => [],
  isAdmin: false,
})

const emit = defineEmits<{
  'close': []
  'update:state': [state: 'expanded' | 'full']
  'contribute': [payload: { projectId: string, comment: string, media: unknown[] }]
  'approve': [contribution: Contribution]
  'delete': [contribution: Contribution]
}>()

const { lf, linkLabel, tagLabel } = useLocalizedEntry()
const p = computed(() => props.entry.properties ?? {})
const stringId = computed(() => p.value.string_id || '')
const photos = computed(() => (Array.isArray(p.value.photos) ? p.value.photos : []))
const voiceNotes = computed(() => (Array.isArray(p.value.audio) ? p.value.audio : []))
const links = computed(() => {
  if (Array.isArray(p.value.linkList) && p.value.linkList.length) {
    return p.value.linkList
  }
  return (p.value.links || '').split(';').map(l => l.trim()).filter(Boolean).map(l => ({ label: l, url: '' }))
})
const showUpload = ref(false)
const toggle = () => emit('update:state', props.state === 'expanded' ? 'full' : 'expanded')

function onUploaded(payload: { comment: string, media: unknown[] }) {
  showUpload.value = false
  emit('contribute', { projectId: stringId.value, ...payload })
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 transition-all duration-300 safe-bottom">
    <UCard
      v-if="state === 'expanded'"
      class="pointer-events-auto w-full max-w-sm touch-manipulation shadow-xl transition-all duration-300"
      style="max-height: 45dvh;"
      :ui="{ base: 'overflow-hidden', rounded: 'rounded-t-3xl rounded-b-none', body: { padding: 'p-0' }, header: { padding: 'px-0 pt-3 pb-1' }, footer: { padding: 'p-0' } }"
    >
      <template #header>
        <div class="relative flex justify-center">
          <div class="h-1 w-10 cursor-pointer rounded-full bg-gray-300" @click="toggle" />
          <button type="button" :aria-label="$t('mDetail.close')" class="absolute -top-1 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="emit('close')">
            <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
          </button>
        </div>
      </template>
      <div class="px-5 py-4">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full" style="border: 2.5px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876); background-origin: border-box; background-clip: padding-box, border-box;">
            <UIcon name="i-heroicons-light-bulb" class="h-5 w-5 text-teal-500" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold leading-tight text-gray-900 dark:text-white">
              {{ lf(p, 'title', entry.comment) }}
            </p>
            <p v-if="p.primaryTag" class="mt-1 text-xs font-medium text-teal-500">
              {{ tagLabel(p.primaryTag) }}
            </p>
            <p class="mt-2 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">
              {{ lf(p, 'shortDesc', p.shortDesc) || lf(p, 'description', p.description) }}
            </p>
          </div>
        </div>
        <UButton variant="ghost" color="gray" size="xs" class="mt-4 w-full justify-center text-gray-400" @click="toggle">
          {{ $t('mDetail.tapToExpand') }}
        </UButton>
      </div>
    </UCard>

    <div v-else class="pointer-events-auto flex w-full max-w-sm touch-manipulation flex-col overflow-hidden rounded-3xl border-[3px] border-white shadow-2xl" style="background-color: #5FC5BD; max-height: 85dvh;">
      <div class="relative flex flex-shrink-0 justify-center pb-1 pt-2">
        <div class="h-1 w-10 cursor-pointer rounded-full bg-white/50" @click="toggle" />
        <button type="button" :aria-label="$t('mDetail.close')" class="absolute right-2 top-1 p-1 text-white/80 hover:text-white" @click="emit('close')">
          <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
        </button>
      </div>
      <div class="space-y-4 overflow-y-auto px-6 pb-6 pt-2">
        <h2 class="text-2xl font-bold leading-tight text-white">
          {{ lf(p, 'title', entry.comment) }}
        </h2>
        <div v-if="p.date" class="flex flex-wrap items-center gap-3">
          <span class="whitespace-nowrap rounded-full border-2 border-white px-4 py-1 text-sm font-medium text-white">{{ $t('mDetail.datePublished') }}</span>
          <span class="text-sm text-white">{{ p.date }}</span>
        </div>
        <div v-if="p.location" class="flex flex-wrap items-center gap-3">
          <span class="whitespace-nowrap rounded-full border-2 border-white px-4 py-1 text-sm font-medium text-white">{{ $t('mDetail.location') }}</span>
          <span class="text-sm text-white">{{ lf(p, 'location', p.location) }}</span>
        </div>
        <div v-if="p.description">
          <span class="inline-block rounded-full border-2 border-white px-4 py-1 text-sm font-medium text-white">{{ $t('mDetail.description') }}</span>
          <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-white">
            {{ lf(p, 'description', p.description) }}
          </p>
        </div>
        <div v-if="photos.length" class="overflow-hidden rounded-2xl border-2 border-white">
          <PhotoCarousel :images="photos" :alt="entry.comment" height="320px" />
        </div>
        <div v-if="voiceNotes.length" class="space-y-2">
          <p class="text-sm font-bold text-white">
            {{ $t('detail.voiceNotes') }}
          </p>
          <audio v-for="url in voiceNotes" :key="url" :src="url" controls class="w-full" />
        </div>
        <div v-if="links.length">
          <p class="mb-2 text-sm font-bold text-white">
            {{ $t('mDetail.learnMore') }}
          </p>
          <ul class="space-y-1">
            <li v-for="(link, i) in links" :key="i" class="flex items-start gap-2">
              <UIcon name="i-heroicons-link" class="mt-0.5 h-3 w-3 flex-shrink-0 text-white" />
              <a v-if="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" class="text-xs text-white underline decoration-white/40 hover:decoration-white">{{ linkLabel(link.label) }}</a>
              <span v-else class="text-xs text-white">{{ linkLabel(link.label) }}</span>
            </li>
          </ul>
        </div>
        <div v-if="stringId" class="border-t border-white/30 pt-4">
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-bold text-white">
              {{ $t('mDetail.community') }} <span v-if="contributions.length" class="font-normal text-white/70">({{ contributions.length }})</span>
            </p>
            <button type="button" class="flex min-h-11 touch-manipulation items-center gap-1 rounded-full bg-white/20 px-4 text-sm font-medium text-white" @click="showUpload = true">
              <UIcon name="i-heroicons-plus" class="h-4 w-4" />{{ $t('detail.add') }}
            </button>
          </div>
          <p v-if="!contributions.length" class="text-xs text-white/70">
            {{ $t('mDetail.beFirst') }}
          </p>
          <div v-else class="space-y-3">
            <div v-for="c in contributions" :key="c.id" class="rounded-xl bg-white/15 p-3">
              <div v-if="c.media.length" class="mb-2 grid grid-cols-3 gap-1.5">
                <template v-for="(m, mi) in c.media" :key="mi">
                  <audio v-if="m.kind === 'audio'" :src="m.url" controls class="col-span-3 w-full" />
                  <a v-else :href="m.url" target="_blank" rel="noopener noreferrer"><img :src="m.url" :alt="m.name" loading="lazy" decoding="async" class="h-16 w-full rounded object-cover"></a>
                </template>
              </div>
              <p v-if="c.comment" class="text-xs text-white">
                {{ c.comment }}
              </p>
              <div v-if="isAdmin" class="mt-2 flex items-center gap-2">
                <span v-if="!c.approved" class="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{{ $t('detail.pending') }}</span>
                <button v-if="!c.approved" type="button" class="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700" @click="emit('approve', c)">
                  {{ $t('detail.approve') }}
                </button>
                <button type="button" class="rounded-full bg-red-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white" @click="emit('delete', c)">
                  {{ $t('detail.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showUpload" class="pointer-events-auto fixed left-1/2 top-20 z-[60] -translate-x-1/2">
      <ImageUploadModal :is-visible="showUpload" :project-id="stringId" @close="showUpload = false" @uploaded="onUploaded" />
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
