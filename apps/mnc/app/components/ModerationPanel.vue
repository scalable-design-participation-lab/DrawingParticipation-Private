<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Contribution } from '../api/firebase'
import type { Entry } from '../composables/catalog'

interface ModeratedEntry { id: string, string_id: string, title: string, primaryTag: string, location: string, approved: boolean, i18n?: Record<string, { title?: string }> }

/**
 * The moderator's review queue: pending entries and contributions. A bottom
 * sheet on mobile (collapsible so the map stays visible), a card on desktop.
 */
const props = withDefaults(defineProps<{
  moderation?: ModeratedEntry[]
  pending?: Contribution[]
  /** To resolve a contribution's project id to its title. */
  features?: Entry[]
  isSuperAdmin?: boolean
}>(), {
  moderation: () => [],
  pending: () => [],
  features: () => [],
  isSuperAdmin: false,
})

const emit = defineEmits<{
  approveEntry: [entry: ModeratedEntry]
  deleteEntry: [entry: ModeratedEntry]
  approveContribution: [contribution: Contribution]
  deleteContribution: [contribution: Contribution]
  /** Show a project on the map: its string_id. */
  flyTo: [stringId: string]
  signOut: []
  close: []
}>()

const collapsed = ref(false)
const pendingCount = computed(() => props.moderation.filter(m => !m.approved).length + props.pending.length)
const projectTitle = (id: string) => props.features.find(f => f.properties?.string_id === id)?.comment || id

function flyTo(id: string) {
  emit('flyTo', id)
  collapsed.value = true
}
</script>

<template>
  <div class="fixed inset-x-3 bottom-28 z-40 flex max-h-[55dvh] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl safe-bottom dark:border-zinc-700 dark:bg-zinc-900 sm:inset-x-auto sm:bottom-20 sm:left-6 sm:max-h-[70vh] sm:w-80 sm:max-w-[90vw]">
    <div class="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
      <div class="flex min-w-0 items-center gap-1.5">
        <button type="button" class="-ml-1 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 sm:hidden" :aria-label="collapsed ? $t('mod.expand') : $t('mod.collapse')" @click="collapsed = !collapsed">
          <UIcon :name="collapsed ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="h-4 w-4" />
        </button>
        <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t('mod.review') }}<span v-if="pendingCount" class="font-normal text-gray-400"> · {{ pendingCount }}</span>
        </h3>
      </div>
      <div class="flex items-center gap-1">
        <UButton v-if="isSuperAdmin" size="xs" color="gray" variant="ghost" icon="i-heroicons-users" to="/admin" :aria-label="$t('admin.accounts')" :title="$t('admin.accounts')" />
        <UButton size="xs" color="gray" variant="ghost" @click="emit('signOut')">
          {{ $t('mod.signOut') }}
        </UButton>
        <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-x-mark" :aria-label="$t('mod.close')" @click="emit('close')" />
      </div>
    </div>

    <div v-show="!collapsed" class="flex-1 overflow-y-auto p-3">
      <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {{ $t('mod.contributions') }} ({{ moderation.length + pending.length }})
      </p>
      <p v-if="!moderation.length && !pending.length" class="mb-3 px-1 text-xs text-gray-400">
        {{ $t('mod.noContributions') }}
      </p>

      <div v-for="m in moderation" :key="m.id" class="mb-2 cursor-pointer rounded-xl border border-gray-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-zinc-700 dark:hover:bg-teal-950/20" :title="$t('mod.showOnMap')" @click="flyTo(m.string_id)">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
              {{ m.title }}
            </p>
            <p class="truncate text-xs text-gray-400">
              {{ m.location || m.primaryTag }}
            </p>
            <div v-if="m.i18n" class="mt-1 space-y-0.5">
              <p v-for="(tr, code) in m.i18n" :key="code" class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                <span class="font-semibold uppercase text-gray-400">{{ code }}</span> {{ tr.title }}
              </p>
            </div>
          </div>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="m.approved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'">
            {{ m.approved ? $t('mod.live') : $t('mod.pending') }}
          </span>
        </div>
        <div class="mt-2 flex gap-2">
          <UButton v-if="!m.approved" size="xs" color="primary" @click.stop="emit('approveEntry', m)">
            {{ $t('mod.approve') }}
          </UButton>
          <UButton size="xs" color="red" variant="soft" @click.stop="emit('deleteEntry', m)">
            {{ $t('mod.delete') }}
          </UButton>
        </div>
      </div>

      <div v-for="c in pending" :key="c.id" class="mb-2 cursor-pointer rounded-xl border border-gray-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-zinc-700 dark:hover:bg-teal-950/20" :title="$t('mod.showOnMap')" @click="flyTo(c.projectId)">
        <p class="truncate text-xs font-medium text-gray-500 dark:text-gray-300">
          {{ projectTitle(c.projectId) }}
        </p>
        <p v-if="c.comment" class="mt-0.5 line-clamp-2 text-sm text-gray-900 dark:text-white">
          {{ c.comment }}
        </p>
        <div v-if="c.media.length" class="mt-2 space-y-1.5">
          <template v-for="(m, mi) in c.media" :key="mi">
            <audio v-if="m.kind === 'audio'" :src="m.url" controls class="h-8 w-full" @click.stop />
            <a v-else :href="m.url" target="_blank" rel="noopener noreferrer" class="block" @click.stop>
              <img :src="m.url" :alt="m.name" loading="lazy" decoding="async" class="h-16 w-full rounded object-cover">
            </a>
          </template>
        </div>
        <div class="mt-2 flex gap-2">
          <UButton size="xs" color="primary" @click.stop="emit('approveContribution', c)">
            {{ $t('mod.approve') }}
          </UButton>
          <UButton size="xs" color="red" variant="soft" @click.stop="emit('deleteContribution', c)">
            {{ $t('mod.delete') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
