<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSolutionsStore, type ModeratedSolution } from '../stores/solutions'

const auth = useAuthStore()
const solutions = useSolutionsStore()

// A returning admin resolves isAdmin after the initial (public) load, so
// re-fetch to pull in pending entries once moderator status is known.
watch(() => auth.isAdmin, (isAdmin) => {
  if (isAdmin)
    solutions.fetchSolutions()
})

const showLogin = ref(false)
const showPanel = ref(false)
const email = ref('')
const password = ref('')
const err = ref('')
const busy = ref(false)

const pendingCount = computed(() => solutions.moderation.filter(m => !m.approved).length)

async function doSignIn() {
  busy.value = true
  err.value = ''
  try {
    await auth.signIn(email.value.trim(), password.value)
    password.value = ''
    if (auth.isAdmin) {
      showLogin.value = false
      await solutions.fetchSolutions()
      showPanel.value = true
    }
    else {
      err.value = 'Signed in, but this account is not a moderator.'
    }
  }
  catch {
    err.value = 'Sign-in failed. Check your email and password.'
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
      aria-label="Moderator sign in"
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
      Moderate<span v-if="pendingCount"> · {{ pendingCount }}</span>
    </UButton>
  </div>

  <!-- Login modal -->
  <div
    v-if="showLogin"
    class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
    @click.self="showLogin = false"
  >
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Moderator sign in</h3>
          <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" aria-label="Close" @click="showLogin = false" />
        </div>
      </template>
      <form class="space-y-3" @submit.prevent="doSignIn">
        <UInput v-model="email" type="email" placeholder="Email" autocomplete="username" />
        <UInput v-model="password" type="password" placeholder="Password" autocomplete="current-password" />
        <p v-if="err" class="text-xs text-red-500">{{ err }}</p>
        <UButton type="submit" color="primary" block :loading="busy">Sign in</UButton>
      </form>
    </UCard>
  </div>

  <!-- Moderation panel -->
  <div
    v-if="auth.isAdmin && showPanel"
    class="fixed bottom-20 left-6 z-40 w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
  >
    <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Review entries</h3>
      <UButton size="xs" color="gray" variant="ghost" @click="doSignOut">Sign out</UButton>
    </div>
    <div class="max-h-[50vh] overflow-y-auto p-3">
      <p v-if="!solutions.moderation.length" class="py-6 text-center text-xs text-gray-400">
        No user-submitted entries.
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
            {{ m.approved ? 'Live' : 'Pending' }}
          </span>
        </div>
        <div class="mt-2 flex gap-2">
          <UButton v-if="!m.approved" size="2xs" color="primary" @click="approve(m)">Approve</UButton>
          <UButton size="2xs" color="red" variant="soft" @click="remove(m)">Delete</UButton>
        </div>
      </div>
    </div>
  </div>
</template>
