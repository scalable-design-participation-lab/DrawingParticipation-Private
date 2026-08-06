<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { type AdminAccount, type RegisteredAccount, useAdminUsersStore } from '../stores/adminUsers'

/**
 * Admin backend. The main flow: team members register a plain account here,
 * and an administrator promotes it to moderator/admin below — nobody signs up
 * "as a moderator", and nothing happens in the Firebase console. Review of
 * user submissions stays on the map page (AdminBar); this page is only about
 * who has access.
 */
const { t } = useI18n()
const auth = useAuthStore()
const users = useAdminUsersStore()

onMounted(() => {
  auth.init()
})

// Load accounts + registrations once the signed-in user is known to be a super
// admin (covers both "already signed in" and "signs in on this page").
watch(() => auth.isSuperAdmin, (ok) => {
  if (ok)
    users.fetchAccounts()
}, { immediate: true })

// --- Sign in / register ---
const mode = ref<'signIn' | 'register'>('signIn')
const email = ref('')
const password = ref('')
const authErr = ref('')
const authBusy = ref(false)

async function submitAuth() {
  authBusy.value = true
  authErr.value = ''
  try {
    if (mode.value === 'signIn')
      await auth.signIn(email.value.trim(), password.value)
    else
      await auth.register(email.value.trim(), password.value)
    password.value = ''
  }
  catch (e: any) {
    // Keep the raw error inspectable — the UI text below intentionally
    // compresses unknown failures.
    console.warn('[admin] sign-in/register failed', e)
    authErr.value
      = e?.message === 'registration-incomplete' ? t('admin.errRegisterIncomplete')
        : e?.code === 'auth/email-already-in-use' ? t('admin.errEmailInUseRegister')
          : e?.code === 'auth/invalid-email' ? t('admin.errInvalidEmail')
            : e?.code === 'auth/weak-password' ? t('admin.errWeakPassword')
              : e?.code === 'auth/operation-not-allowed' ? t('admin.errProviderDisabled')
                : (mode.value === 'register' ? t('admin.errRegister') : t('mod.signInFailed'))
                  // Unrecognized failure: surface the underlying code so a tester's
                  // screenshot is enough to diagnose (config/domain/key issues).
                  + (e?.code ? ` [${e.code}]` : e?.message ? ` [${e.message}]` : '')
  }
  finally {
    authBusy.value = false
  }
}

// --- Direct account creation (fallback for when the person can't register
// themselves; the primary flow is promoting a registration below) ---
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
    console.warn('[admin] account creation failed', e)
    createErr.value
      = e?.code === 'auth/email-already-in-use' ? t('admin.errEmailInUse')
        : e?.code === 'auth/invalid-email' ? t('admin.errInvalidEmail')
          : e?.code === 'auth/weak-password' ? t('admin.errWeakPassword')
            : e?.code === 'auth/operation-not-allowed' ? t('admin.errProviderDisabled')
              : t('admin.errCreate') + (e?.code ? ` [${e.code}]` : '')
  }
  finally {
    createBusy.value = false
  }
}

// --- Bootstrap helper ---
// The very first administrator has nobody to grant them access, so a project
// owner has to create their admins/<uid> doc by hand once. Surfacing the uid
// here saves hunting for it in the Firebase console's Authentication tab —
// where, confusingly, no "admin" flag exists at all.
const showBootstrap = ref(false)
const uidCopied = ref(false)

async function copyUid() {
  if (!auth.uid)
    return
  try {
    await navigator.clipboard.writeText(auth.uid)
    uidCopied.value = true
    setTimeout(() => (uidCopied.value = false), 2000)
  }
  catch {
    // Clipboard blocked (insecure context / permission): the uid is on screen
    // and selectable, so there is nothing to recover from.
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

function promote(r: RegisteredAccount, role: 'moderator' | 'admin') {
  withRow(r.uid, () => users.promote(r, role), t('admin.promoted', { email: r.email || r.uid }))
}

function removeRegistration(r: RegisteredAccount) {
  withRow(r.uid, () => users.removeRegistration(r.uid))
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
          <UButton v-if="!auth.isAnonymous && auth.ready" size="xs" color="gray" variant="soft" @click="auth.signOut()">{{ $t('mod.signOut') }}</UButton>
        </div>
      </div>

      <!-- Waiting for the auth listener's first result -->
      <div v-if="!auth.ready" class="py-16 text-center text-sm text-gray-400">
        {{ $t('admin.loading') }}
      </div>

      <!-- Anonymous visitor: sign in, or register a plain account -->
      <div v-else-if="auth.isAnonymous || !auth.uid" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div class="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
            :class="mode === 'signIn' ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
            @click="mode = 'signIn'; authErr = ''"
          >
            {{ $t('mod.signIn') }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
            :class="mode === 'register' ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
            @click="mode = 'register'; authErr = ''"
          >
            {{ $t('admin.register') }}
          </button>
        </div>
        <p v-if="mode === 'register'" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {{ $t('admin.registerHint') }}
        </p>
        <form class="space-y-3" @submit.prevent="submitAuth">
          <UInput v-model="email" type="email" :placeholder="$t('mod.email')" autocomplete="username" required />
          <UInput
            v-model="password"
            type="password"
            :placeholder="mode === 'register' ? $t('admin.newPassword') : $t('mod.password')"
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
            required
            minlength="6"
          />
          <p v-if="authErr" class="text-xs text-red-500">{{ authErr }}</p>
          <UButton type="submit" color="primary" block :loading="authBusy">
            {{ mode === 'signIn' ? $t('mod.signIn') : $t('admin.register') }}
          </UButton>
        </form>
      </div>

      <!-- Signed in with a plain account: waiting for an admin to grant access -->
      <div v-else-if="!auth.isAdmin" class="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div class="text-center">
          <UIcon name="i-heroicons-clock" class="mx-auto mb-2 h-8 w-8 text-amber-500" />
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('admin.pendingTitle') }}</h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ $t('admin.pendingBody', { email: auth.email }) }}</p>
        </div>

        <!-- Bootstrap escape hatch: with no admin yet, nobody can grant anyone
             access from this page — a project owner has to do it once by hand. -->
        <div class="mt-5 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{{ $t('admin.yourUid') }}</p>
          <div class="mt-1 flex items-center gap-2">
            <code class="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-700 dark:bg-zinc-900 dark:text-gray-200">{{ auth.uid }}</code>
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              :icon="uidCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
              :aria-label="$t('admin.copyUid')"
              :title="$t('admin.copyUid')"
              @click="copyUid"
            />
          </div>

          <button
            type="button"
            class="mt-2 flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline dark:text-teal-400"
            @click="showBootstrap = !showBootstrap"
          >
            <UIcon :name="showBootstrap ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="h-3 w-3" />
            {{ $t('admin.bootstrapToggle') }}
          </button>
          <ol v-if="showBootstrap" class="mt-2 list-decimal space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-300">
            <li>{{ $t('admin.bootstrapStep1') }}</li>
            <li>{{ $t('admin.bootstrapStep2') }}</li>
            <li>{{ $t('admin.bootstrapStep3') }}</li>
            <li>{{ $t('admin.bootstrapStep4') }}</li>
          </ol>
          <p v-if="showBootstrap" class="mt-2 text-[11px] text-gray-400">{{ $t('admin.bootstrapNote') }}</p>
        </div>
      </div>

      <!-- Review-only moderator: no account management -->
      <div v-else-if="!auth.isSuperAdmin" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <UIcon name="i-heroicons-shield-check" class="mx-auto mb-2 h-8 w-8 text-teal-500" />
        <p class="text-sm text-gray-700 dark:text-gray-200">{{ $t('admin.moderatorOnly') }}</p>
        <UButton to="/" class="mt-4" size="sm" color="primary" variant="soft" icon="i-heroicons-map">{{ $t('admin.backToMap') }}</UButton>
      </div>

      <!-- Super admin: promote registrations + manage accounts -->
      <template v-else>
        <p v-if="rowErr" class="mb-3 text-xs text-red-500">{{ rowErr }}</p>
        <p v-if="rowOk" class="mb-3 text-xs text-emerald-600 dark:text-emerald-400">{{ rowOk }}</p>

        <!-- New registrations awaiting a rights decision (the primary flow) -->
        <div class="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-zinc-800">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ $t('admin.registrations') }}
              <span v-if="users.pendingRegistrations.length" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {{ users.pendingRegistrations.length }}
              </span>
            </h2>
            <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-arrow-path" :loading="users.loading" @click="users.fetchAccounts()">
              {{ $t('admin.refresh') }}
            </UButton>
          </div>
          <p class="border-b border-gray-100 px-5 py-2 text-xs text-gray-500 dark:border-zinc-800 dark:text-gray-400">
            {{ $t('admin.registrationsHint') }}
          </p>
          <ul class="divide-y divide-gray-100 dark:divide-zinc-800">
            <li v-if="!users.pendingRegistrations.length && !users.loading" class="px-5 py-6 text-center text-sm text-gray-400">
              {{ $t('admin.noRegistrations') }}
            </li>
            <li v-for="r in users.pendingRegistrations" :key="r.uid" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ r.email || r.uid }}</p>
                <p class="truncate text-xs text-gray-400">
                  {{ r.uid }}<template v-if="r.createdAt"> · {{ r.createdAt.toLocaleDateString() }}</template>
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <UButton size="xs" color="primary" :loading="rowBusy === r.uid" @click="promote(r, 'moderator')">
                  {{ $t('admin.makeModerator') }}
                </UButton>
                <UButton size="xs" color="gray" variant="ghost" :loading="rowBusy === r.uid" @click="promote(r, 'admin')">
                  {{ $t('admin.makeAdmin') }}
                </UButton>
                <UButton
                  size="xs"
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  :title="$t('admin.removeRegistration')"
                  :loading="rowBusy === r.uid"
                  @click="removeRegistration(r)"
                />
              </div>
            </li>
          </ul>
        </div>

        <!-- Current moderators / admins -->
        <div class="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-zinc-800">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ $t('admin.accounts') }} <span class="font-normal text-gray-400">· {{ users.accounts.length }}</span>
            </h2>
          </div>

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

        <!-- Fallback: create a login directly (e.g. the person isn't around to
             register themselves) -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
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
