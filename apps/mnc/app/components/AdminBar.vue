<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFeatureStore } from '@base/stores/features'
import { useAuthStore } from '../stores/auth'
import { useSolutionsStore, type ModeratedSolution } from '../stores/solutions'
import { useContributionsStore } from '../stores/contributions'
import { useFilterStore } from '../stores/filter'
import { useIsMobile } from '../composables/useIsMobile'
import type { Contribution } from '../stores/types/contribution'

const { t } = useI18n()
const auth = useAuthStore()
const solutions = useSolutionsStore()
const contributions = useContributionsStore()
const filterStore = useFilterStore()
const featureStore = useFeatureStore()
const { isMobile } = useIsMobile()

// Fly the map to (and preview) the pin for a given project string_id, reusing
// the sidebar-selection flow that BackgroundMap already watches.
function flyTo(stringId: string) {
  const f = featureStore.features.find(x => (x.properties as any)?.string_id === stringId)
  if (!f)
    return
  filterStore.selectFeature(f)
  // On mobile the sheet covers the map, so collapse it to a peek bar — otherwise
  // you can't see the pin the map just flew to.
  if (isMobile.value)
    collapsed.value = true
}

// Pull the moderation queues once moderator status is known (a returning admin
// resolves isAdmin after the initial public load).
watch(() => auth.isAdmin, (isAdmin) => {
  if (isAdmin)
    loadQueues()
})

function loadQueues() {
  solutions.fetchSolutions()
  contributions.fetchPendingContributions()
}

const showLogin = ref(false)
const showPanel = ref(false)
// Mobile: collapse the review sheet to a peek bar (header only) so the map is
// visible. Reset whenever the panel is (re)opened.
const collapsed = ref(false)
function togglePanel() {
  showPanel.value = !showPanel.value
  if (showPanel.value)
    collapsed.value = false
}
const email = ref('')
const password = ref('')
const err = ref('')
const busy = ref(false)
const resetOk = ref('')

async function doReset() {
  err.value = ''
  resetOk.value = ''
  if (!email.value.trim()) {
    err.value = t('mod.enterEmailForReset')
    return
  }
  try {
    await auth.resetPassword(email.value.trim())
    resetOk.value = t('mod.resetSent')
  }
  catch {
    err.value = t('mod.errReset')
  }
}

const pendingEntries = computed(() => solutions.moderation.filter(m => !m.approved).length)
const pendingCount = computed(() => pendingEntries.value + contributions.pending.length)

// Resolve a contribution's project id to its human-readable title (falls back
// to the raw id if that project isn't loaded).
function projectTitle(projectId: string): string {
  const f = featureStore.features.find(x => (x.properties as any)?.string_id === projectId)
  return f?.comment || projectId
}

async function doSignIn() {
  busy.value = true
  err.value = ''
  try {
    await auth.signIn(email.value.trim(), password.value)
    password.value = ''
    if (auth.isAdmin) {
      showLogin.value = false
      loadQueues()
      collapsed.value = false
      showPanel.value = true
    }
    else {
      err.value = t('mod.notModerator')
    }
  }
  catch {
    err.value = t('mod.signInFailed')
  }
  finally {
    busy.value = false
  }
}

async function doSignOut() {
  await auth.signOut()
  showPanel.value = false
}

async function approve(m: ModeratedSolution) {
  await solutions.approveSolution(m.id)
}
async function remove(m: ModeratedSolution) {
  await solutions.deleteSolution(m.id, m.string_id)
}
async function approveC(c: Contribution) {
  await contributions.approveContribution(c.id!, c.projectId)
}
async function removeC(c: Contribution) {
  await contributions.deleteContribution(c)
}
</script>

<template>
  <!-- Trigger: sits above the mobile bottom nav (its own z-50 pill), bottom-left
       on desktop. Hidden on mobile while the panel is open so it doesn't overlap
       the sheet — the sheet has its own close button. -->
  <div class="fixed bottom-28 left-4 z-40 sm:bottom-6 sm:left-6">
    <UButton
      v-if="!auth.isAdmin"
      icon="i-heroicons-lock-closed"
      color="gray"
      variant="solid"
      size="sm"
      :aria-label="$t('mod.signInTitle')"
      class="rounded-full shadow-lg"
      @click="showLogin = true"
    />
    <UButton
      v-else
      color="gray"
      variant="solid"
      size="sm"
      class="rounded-full shadow-lg"
      :class="{ 'hidden sm:inline-flex': showPanel }"
      icon="i-heroicons-shield-check"
      @click="togglePanel"
    >
      {{ $t('mod.moderate') }}<span v-if="pendingCount"> · {{ pendingCount }}</span>
    </UButton>
  </div>

  <!-- Login modal -->
  <AppModal v-if="showLogin" :title="$t('mod.signInTitle')" max-width="max-w-sm" @close="showLogin = false">
    <form class="space-y-3" @submit.prevent="doSignIn">
      <UInput v-model="email" type="email" :placeholder="$t('mod.email')" autocomplete="username" />
      <UInput v-model="password" type="password" :placeholder="$t('mod.password')" autocomplete="current-password" />
      <p v-if="err" class="text-xs text-red-500">{{ err }}</p>
      <p v-if="resetOk" class="text-xs text-emerald-600 dark:text-emerald-400">{{ resetOk }}</p>
      <UButton type="submit" color="primary" block :loading="busy">{{ $t('mod.signIn') }}</UButton>
      <button type="button" class="block w-full text-center text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" @click="doReset">
        {{ $t('mod.forgotPassword') }}
      </button>
    </form>
  </AppModal>

  <!-- Moderation panel: a bottom sheet on mobile (leaves the top of the map
       visible so fly-to-pin still works), a floating card bottom-left on desktop.
       Dismissed with the header close button (no backdrop, so the map stays
       interactive behind it). -->
  <div
    v-if="auth.isAdmin && showPanel"
    class="fixed z-40 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 inset-x-3 bottom-28 max-h-[55dvh] sm:inset-x-auto sm:bottom-20 sm:left-6 sm:w-80 sm:max-w-[90vw] sm:max-h-[70vh]"
  >
    <div class="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
      <div class="flex min-w-0 items-center gap-1.5">
        <!-- Mobile only: collapse the sheet to this header bar so the map (and the
             pin you just flew to) is visible. Tapping a review item collapses too. -->
        <button
          type="button"
          class="-ml-1 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 sm:hidden"
          :aria-label="collapsed ? $t('mod.expand') : $t('mod.collapse')"
          @click="collapsed = !collapsed"
        >
          <UIcon :name="collapsed ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="h-4 w-4" />
        </button>
        <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t('mod.review') }}<span v-if="pendingCount" class="font-normal text-gray-400"> · {{ pendingCount }}</span>
        </h3>
      </div>
      <div class="flex items-center gap-1">
        <!-- Account management lives on its own page; only the 'admin' role sees it. -->
        <UButton
          v-if="auth.isSuperAdmin"
          size="xs"
          color="gray"
          variant="ghost"
          icon="i-heroicons-users"
          to="/admin"
          :aria-label="$t('admin.accounts')"
          :title="$t('admin.accounts')"
        />
        <UButton size="xs" color="gray" variant="ghost" @click="doSignOut">{{ $t('mod.signOut') }}</UButton>
        <UButton
          size="xs"
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark"
          :aria-label="$t('mod.close')"
          @click="showPanel = false"
        />
      </div>
    </div>

    <div v-show="!collapsed" class="flex-1 overflow-y-auto p-3">
      <!-- One queue for everything a user contributes: new places (userSolutions)
           and photos/comments added to existing places (contributions). -->
      <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {{ $t('mod.contributions') }} ({{ solutions.moderation.length + contributions.pending.length }})
      </p>
      <p v-if="!solutions.moderation.length && !contributions.pending.length" class="mb-3 px-1 text-xs text-gray-400">
        {{ $t('mod.noContributions') }}
      </p>
      <div
        v-for="m in solutions.moderation"
        :key="m.id"
        class="mb-2 cursor-pointer rounded-xl border border-gray-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-zinc-700 dark:hover:bg-teal-950/20"
        :title="$t('mod.showOnMap')"
        @click="flyTo(m.string_id)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ m.title }}</p>
            <p class="truncate text-xs text-gray-400">{{ m.location || m.primaryTag }}</p>
            <!-- Stored translations, so the reviewer can check them before
                 approving. Written by the Cloud Function a few seconds after
                 submission — absent until then. -->
            <div v-if="m.i18n" class="mt-1 space-y-0.5">
              <p v-for="(tr, code) in m.i18n" :key="code" class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                <span class="font-semibold uppercase text-gray-400">{{ code }}</span> {{ tr.title }}
              </p>
            </div>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            :class="m.approved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'"
          >
            {{ m.approved ? $t('mod.live') : $t('mod.pending') }}
          </span>
        </div>
        <div class="mt-2 flex gap-2">
          <UButton v-if="!m.approved" size="xs" color="primary" @click.stop="approve(m)">{{ $t('mod.approve') }}</UButton>
          <UButton size="xs" color="red" variant="soft" @click.stop="remove(m)">{{ $t('mod.delete') }}</UButton>
        </div>
      </div>

      <!-- Photos / comments added to existing places (also contributions). -->
      <div
        v-for="c in contributions.pending"
        :key="c.id"
        class="mb-2 cursor-pointer rounded-xl border border-gray-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-zinc-700 dark:hover:bg-teal-950/20"
        :title="$t('mod.showOnMap')"
        @click="flyTo(c.projectId)"
      >
        <p class="truncate text-xs font-medium text-gray-500 dark:text-gray-300">{{ projectTitle(c.projectId) }}</p>
        <p v-if="c.comment" class="mt-0.5 line-clamp-2 text-sm text-gray-900 dark:text-white">{{ c.comment }}</p>
        <p v-if="c.media.length" class="mt-0.5 text-xs text-gray-400">{{ c.media.length }} × media</p>
        <div class="mt-2 flex gap-2">
          <UButton size="xs" color="primary" @click.stop="approveC(c)">{{ $t('mod.approve') }}</UButton>
          <UButton size="xs" color="red" variant="soft" @click.stop="removeC(c)">{{ $t('mod.delete') }}</UButton>
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
