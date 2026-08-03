<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { type AdminAccount, useAdminUsersStore } from '../stores/adminUsers'

/**
 * Admin backend: create and manage moderator/admin accounts here instead of
 * the Firebase console. Review of user submissions stays on the map page
 * (AdminBar); this page is only about who has access.
 */
const { t } = useI18n()
const auth = useAuthStore()
const users = useAdminUsersStore()

onMounted(() => {
  auth.init()
})

// Load the account list once the signed-in user is known to be a super admin
// (covers both "already signed in" and "signs in on this page").
watch(() => auth.isSuperAdmin, (ok) => {
  if (ok)
    users.fetchAccounts()
}, { immediate: true })

// --- Sign in ---
const email = ref('')
const password = ref('')
const signInErr = ref('')
const signInBusy = ref(false)

async function doSignIn() {
  signInBusy.value = true
  signInErr.value = ''
  try {
    await auth.signIn(email.value.trim(), password.value)
    password.value = ''
    if (!auth.isAdmin)
      signInErr.value = t('mod.notModerator')
  }
  catch {
    signInErr.value = t('mod.signInFailed')
  }
  finally {
    signInBusy.value = false
  }
}

// --- Create account ---
const form = reactive({ email: '', password: '', role: 'moderator' as 'moderator' | 'admin' })
const roleOptions = computed(() => [
  { value: 'moderator', label: t('admin.roleModerator') },
  { value: 'admin', label: t('admin.roleAdmin') },
])
const createErr = ref('')
const createOk = ref('')
const createBusy = ref(false)

async function doCreate() {
  createBusy.value = true
  createErr.value = ''
  createOk.value = ''
  try {
    await users.createAccount(form.email.trim(), form.password, form.role)
    createOk.value = t('admin.created', { email: form.email.trim() })
    form.email = ''
    form.password = ''
    form.role = 'moderator'
  }
  catch (e: any) {
    createErr.value
      = e?.code === 'auth/email-already-in-use' ? t('admin.errEmailInUse')
        : e?.code === 'auth/invalid-email' ? t('admin.errInvalidEmail')
          : e?.code === 'auth/weak-password' ? t('admin.errWeakPassword')
            : t('admin.errCreate')
  }
  finally {
    createBusy.value = false
  }
}

// --- Row actions ---
const rowBusy = ref<string | null>(null)
const rowErr = ref('')
const rowOk = ref('')

async function withRow(uid: string, fn: () => Promise<void>, okMsg = '') {
  rowBusy.value = uid
  rowErr.value = ''
  rowOk.value = ''
  try {
    await fn()
    rowOk.value = okMsg
  }
  catch {
    rowErr.value = t('admin.errAction')
  }
  finally {
    rowBusy.value = null
  }
}

function toggleRole(a: AdminAccount) {
  withRow(a.uid, () => users.setRole(a.uid, a.role === 'admin' ? 'moderator' : 'admin'))
}

const confirmRevoke = ref<AdminAccount | null>(null)
function doRevoke() {
  const a = confirmRevoke.value
  confirmRevoke.value = null
  if (a)
    withRow(a.uid, () => users.revoke(a.uid), t('admin.revoked', { email: a.email || a.uid }))
}

function sendReset(a: AdminAccount) {
  if (a.email)
    withRow(a.uid, () => users.sendReset(a.email), t('admin.resetSent', { email: a.email }))
}
</script>

<template>
  <div class="min-h-dvh bg-gray-50 dark:bg-zinc-950">
    <div class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div class="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ $t('admin.title') }}</h1>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ $t('admin.subtitle') }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <UButton to="/" size="xs" color="gray" variant="ghost" icon="i-heroicons-map">{{ $t('admin.backToMap') }}</UButton>
          <UButton v-if="auth.isAdmin" size="xs" color="gray" variant="soft" @click="auth.signOut()">{{ $t('mod.signOut') }}</UButton>
        </div>
      </div>

      <!-- Waiting for the auth listener's first result -->
      <div v-if="!auth.ready" class="py-16 text-center text-sm text-gray-400">
        {{ $t('admin.loading') }}
      </div>

      <!-- Not signed in (or anonymous visitor): moderator sign-in -->
      <div v-else-if="!auth.isAdmin" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{{ $t('mod.signInTitle') }}</h2>
        <form class="space-y-3" @submit.prevent="doSignIn">
          <UInput v-model="email" type="email" :placeholder="$t('mod.email')" autocomplete="username" required />
          <UInput v-model="password" type="password" :placeholder="$t('mod.password')" autocomplete="current-password" required />
          <p v-if="signInErr" class="text-xs text-red-500">{{ signInErr }}</p>
          <UButton type="submit" color="primary" block :loading="signInBusy">{{ $t('mod.signIn') }}</UButton>
        </form>
      </div>

      <!-- Review-only moderator: no account management -->
      <div v-else-if="!auth.isSuperAdmin" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <UIcon name="i-heroicons-shield-check" class="mx-auto mb-2 h-8 w-8 text-teal-500" />
        <p class="text-sm text-gray-700 dark:text-gray-200">{{ $t('admin.moderatorOnly') }}</p>
        <UButton to="/" class="mt-4" size="sm" color="primary" variant="soft" icon="i-heroicons-map">{{ $t('admin.backToMap') }}</UButton>
      </div>

      <!-- Super admin: create + manage accounts -->
      <template v-else>
        <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{{ $t('admin.createTitle') }}</h2>
          <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">{{ $t('admin.createHint') }}</p>
          <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" @submit.prevent="doCreate">
            <UInput v-model="form.email" type="email" :placeholder="$t('mod.email')" autocomplete="off" required />
            <UInput v-model="form.password" type="password" :placeholder="$t('admin.tempPassword')" autocomplete="new-password" required minlength="6" />
            <USelect v-model="form.role" :options="roleOptions" value-attribute="value" option-attribute="label" />
            <UButton type="submit" color="primary" :loading="createBusy">{{ $t('admin.create') }}</UButton>
          </form>
          <p v-if="createErr" class="mt-2 text-xs text-red-500">{{ createErr }}</p>
          <p v-if="createOk" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{{ createOk }}</p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-zinc-800">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ $t('admin.accounts') }} <span class="font-normal text-gray-400">· {{ users.accounts.length }}</span>
            </h2>
            <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-arrow-path" :loading="users.loading" @click="users.fetchAccounts()">
              {{ $t('admin.refresh') }}
            </UButton>
          </div>

          <p v-if="rowErr" class="px-5 pt-3 text-xs text-red-500">{{ rowErr }}</p>
          <p v-if="rowOk" class="px-5 pt-3 text-xs text-emerald-600 dark:text-emerald-400">{{ rowOk }}</p>

          <ul class="divide-y divide-gray-100 dark:divide-zinc-800">
            <li v-if="!users.accounts.length && !users.loading" class="px-5 py-8 text-center text-sm text-gray-400">
              {{ $t('admin.noAccounts') }}
            </li>
            <li v-for="a in users.accounts" :key="a.uid" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {{ a.email || a.uid }}
                  <span v-if="a.uid === auth.uid" class="text-xs font-normal text-gray-400">({{ $t('admin.you') }})</span>
                </p>
                <p class="truncate text-xs text-gray-400">{{ a.uid }}</p>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                :class="a.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'"
              >
                {{ a.role === 'admin' ? $t('admin.roleAdmin') : $t('admin.roleModerator') }}
              </span>
              <div class="flex shrink-0 items-center gap-1">
                <UButton
                  v-if="a.uid !== auth.uid"
                  size="xs"
                  color="gray"
                  variant="ghost"
                  :loading="rowBusy === a.uid"
                  @click="toggleRole(a)"
                >
                  {{ a.role === 'admin' ? $t('admin.makeModerator') : $t('admin.makeAdmin') }}
                </UButton>
                <UButton
                  v-if="a.email"
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-envelope"
                  :title="$t('admin.sendReset')"
                  :loading="rowBusy === a.uid"
                  @click="sendReset(a)"
                />
                <UButton
                  v-if="a.uid !== auth.uid"
                  size="xs"
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  :title="$t('admin.revoke')"
                  :loading="rowBusy === a.uid"
                  @click="confirmRevoke = a"
                />
              </div>
            </li>
          </ul>
        </div>

        <p class="mt-4 px-1 text-xs text-gray-400">{{ $t('admin.revokeNote') }}</p>
      </template>
    </div>

    <!-- Revoke confirmation -->
    <AppModal v-if="confirmRevoke" :title="$t('admin.revoke')" max-width="max-w-sm" @close="confirmRevoke = null">
      <p class="text-sm text-gray-700 dark:text-gray-200">
        {{ $t('admin.revokeConfirm', { email: confirmRevoke.email || confirmRevoke.uid }) }}
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <UButton size="sm" color="gray" variant="ghost" @click="confirmRevoke = null">{{ $t('mod.close') }}</UButton>
        <UButton size="sm" color="red" @click="doRevoke">{{ $t('admin.revoke') }}</UButton>
      </div>
    </AppModal>
  </div>
</template>
