<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFeatureStore } from '@base/stores/features'
import { useAuthStore } from '../stores/auth'
import { useSolutionsStore, type ModeratedSolution } from '../stores/solutions'
import { useContributionsStore } from '../stores/contributions'
import type { Contribution } from '../stores/types/contribution'

const { t } = useI18n()
const auth = useAuthStore()
const solutions = useSolutionsStore()
const contributions = useContributionsStore()
const featureStore = useFeatureStore()

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
const email = ref('')
const password = ref('')
const err = ref('')
const busy = ref(false)

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
  <!-- Trigger, bottom-left -->
  <div class="fixed bottom-6 left-6 z-40">
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
      icon="i-heroicons-shield-check"
      @click="showPanel = !showPanel"
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
      <UButton type="submit" color="primary" block :loading="busy">{{ $t('mod.signIn') }}</UButton>
    </form>
  </AppModal>

  <!-- Moderation panel -->
  <div
    v-if="auth.isAdmin && showPanel"
    class="fixed bottom-20 left-6 z-40 flex max-h-[70vh] w-80 max-w-[90vw] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
  >
    <div class="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('mod.review') }}</h3>
      <UButton size="xs" color="gray" variant="ghost" @click="doSignOut">{{ $t('mod.signOut') }}</UButton>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <!-- Entries -->
      <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {{ $t('mod.entries') }} ({{ solutions.moderation.length }})
      </p>
      <p v-if="!solutions.moderation.length" class="mb-3 px-1 text-xs text-gray-400">
        {{ $t('mod.noEntries') }}
      </p>
      <div
        v-for="m in solutions.moderation"
        :key="m.id"
        class="mb-2 rounded-xl border border-gray-200 p-3 dark:border-zinc-700"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ m.title }}</p>
            <p class="truncate text-xs text-gray-400">{{ m.location || m.primaryTag }}</p>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            :class="m.approved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'"
          >
            {{ m.approved ? $t('mod.live') : $t('mod.pending') }}
          </span>
        </div>
        <div class="mt-2 flex gap-2">
          <UButton v-if="!m.approved" size="2xs" color="primary" @click="approve(m)">{{ $t('mod.approve') }}</UButton>
          <UButton size="2xs" color="red" variant="soft" @click="remove(m)">{{ $t('mod.delete') }}</UButton>
        </div>
      </div>

      <!-- Contributions (pending only) -->
      <p class="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {{ $t('mod.contributions') }} ({{ contributions.pending.length }})
      </p>
      <p v-if="!contributions.pending.length" class="px-1 text-xs text-gray-400">
        {{ $t('mod.noContributions') }}
      </p>
      <div
        v-for="c in contributions.pending"
        :key="c.id"
        class="mb-2 rounded-xl border border-gray-200 p-3 dark:border-zinc-700"
      >
        <p class="truncate text-xs font-medium text-gray-500 dark:text-gray-300">{{ projectTitle(c.projectId) }}</p>
        <p v-if="c.comment" class="mt-0.5 line-clamp-2 text-sm text-gray-900 dark:text-white">{{ c.comment }}</p>
        <p v-if="c.media.length" class="mt-0.5 text-xs text-gray-400">{{ c.media.length }} × media</p>
        <div class="mt-2 flex gap-2">
          <UButton size="2xs" color="primary" @click="approveC(c)">{{ $t('mod.approve') }}</UButton>
          <UButton size="2xs" color="red" variant="soft" @click="removeC(c)">{{ $t('mod.delete') }}</UButton>
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
