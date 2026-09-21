<script setup lang="ts">
import { computed } from 'vue'
import type { Contribution } from '../../api/firebase'
import type { Entry } from '../../composables/catalog'
import { useLocalizedEntry } from '../../composables/useLocalizedEntry'

/**
 * One entry on a phone. The sheet itself -- where it sits, its two heights,
 * the grip, the close button, the accent panel -- is base's `Sheet`; what is
 * left here is mnc's own reading of an entry.
 */
const props = withDefaults(defineProps<{
  entry: Entry
  state?: 'peek' | 'full'
  contributions?: Contribution[]
  isAdmin?: boolean
}>(), {
  state: 'peek',
  contributions: () => [],
  isAdmin: false,
})

const emit = defineEmits<{
  'close': []
  'update:state': [state: 'peek' | 'full']
  /** Ask the page to open its upload dialog for this entry. */
  'addMedia': [projectId: string]
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
</script>

<template>
  <Sheet
    tone="accent"
    :state="state"
    :close-label="$t('mDetail.close')"
    :expand-label="$t('mDetail.tapToExpand')"
    @update:state="emit('update:state', $event)"
    @close="emit('close')"
  >
    <template #peek>
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
    </template>

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
      <Carousel :images="photos" :alt="entry.comment" height="lg" :empty-title="$t('photo.noPhoto')" :empty-text="$t('photo.beFirst')" :prev-label="$t('photo.prevPhoto')" :next-label="$t('photo.nextPhoto')" />
    </div>
    <Audio :src="voiceNotes" :label="$t('detail.voiceNotes')" tone="inverse" />
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
        <button type="button" class="flex min-h-11 touch-manipulation items-center gap-1 rounded-full bg-white/20 px-4 text-sm font-medium text-white" @click="emit('addMedia', stringId)">
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
  </Sheet>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
