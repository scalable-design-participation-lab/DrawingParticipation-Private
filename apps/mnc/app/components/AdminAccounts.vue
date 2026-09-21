<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

interface Auth { uid?: string | null, email?: string | null, isAnonymous?: boolean, isAdmin?: boolean, isSuperAdmin?: boolean, ready?: boolean }
interface Account { uid: string, email: string, role?: 'admin' | 'moderator', createdAt?: string }

/**
 * Account management (/admin): sign in or register, then, for a super admin,
 * promote registrations and manage moderator accounts. Data and the outcome
 * of every action arrive as props; the actions themselves are events.
 */
const props = withDefaults(defineProps<{
  auth?: Auth
  accounts?: Account[]
  registrations?: Account[]
  loading?: boolean
  /** handler name -> last error message ($errors). */
  errors?: Record<string, string | undefined>
}>(), {
  auth: () => ({}),
  accounts: () => [],
  registrations: () => [],
  loading: false,
  errors: () => ({}),
})

const emit = defineEmits<{
  signIn: [credentials: { email: string, password: string }]
  register: [credentials: { email: string, password: string }]
  resetPassword: [email: string]
  claimAdmin: []
  signOut: []
  refresh: []
  promote: [payload: { uid: string, email: string, role: 'admin' | 'moderator' }]
  removeRegistration: [uid: string]
  setRole: [payload: { uid: string, role: 'admin' | 'moderator' }]
  revoke: [uid: string]
  sendReset: [email: string]
  create: [payload: { email: string, password: string, role: 'admin' | 'moderator' }]
}>()

const { t } = useI18n()

// The lists are the super admin's to see; ask for them as soon as that is known.
watch(() => props.auth.isSuperAdmin, ok => ok && emit('refresh'), { immediate: true })

const mode = ref<'signIn' | 'register'>('signIn')
const email = ref('')
const password = ref('')
const authError = computed(() => props.errors.signIn || props.errors.register || props.errors.resetPassword)

function submitAuth() {
  emit(mode.value === 'signIn' ? 'signIn' : 'register', { email: email.value.trim(), password: password.value })
  password.value = ''
}

const form = reactive({ email: '', password: '', role: 'moderator' as 'moderator' | 'admin' })
const roleOptions = computed(() => [
  { value: 'moderator', label: t('admin.roleModerator') },
  { value: 'admin', label: t('admin.roleAdmin') },
])
function create() {
  emit('create', { email: form.email.trim(), password: form.password, role: form.role })
  form.email = ''
  form.password = ''
  form.role = 'moderator'
}

const pendingRegistrations = computed(() => props.registrations.filter(r => !props.accounts.some(a => a.uid === r.uid)))
const rowError = computed(() => props.errors.promote || props.errors.removeRegistration || props.errors.setRole || props.errors.revoke || props.errors.sendReset)

const showBootstrap = ref(false)
const uidCopied = ref(false)
async function copyUid() {
  if (!props.auth.uid) {
    return
  }
  try {
    await navigator.clipboard.writeText(props.auth.uid)
    uidCopied.value = true
    setTimeout(() => (uidCopied.value = false), 2000)
  }
  catch { /* the uid is on screen and selectable */ }
}

const confirmRevoke = ref<Account | null>(null)
function revoke() {
  const a = confirmRevoke.value
  confirmRevoke.value = null
  if (a) {
    emit('revoke', a.uid)
  }
}
const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '')
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ $t('admin.title') }}
        </h1>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('admin.subtitle') }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton to="/" size="xs" color="gray" variant="ghost" icon="i-heroicons-map">
          {{ $t('admin.backToMap') }}
        </UButton>
        <UButton v-if="!auth.isAnonymous && auth.ready" size="xs" color="gray" variant="soft" @click="emit('signOut')">
          {{ $t('mod.signOut') }}
        </UButton>
      </div>
    </div>

    <div v-if="!auth.ready" class="py-16 text-center text-sm text-gray-400">
      {{ $t('admin.loading') }}
    </div>

    <div v-else-if="auth.isAnonymous || !auth.uid" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div class="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
        <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium transition" :class="mode === 'signIn' ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'" @click="mode = 'signIn'">
          {{ $t('mod.signIn') }}
        </button>
        <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium transition" :class="mode === 'register' ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'" @click="mode = 'register'">
          {{ $t('admin.register') }}
        </button>
      </div>
      <p v-if="mode === 'register'" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {{ $t('admin.registerHint') }}
      </p>
      <form class="space-y-3" @submit.prevent="submitAuth">
        <UInput v-model="email" type="email" :placeholder="$t('mod.email')" autocomplete="username" required />
        <UInput v-model="password" type="password" :placeholder="mode === 'register' ? $t('admin.newPassword') : $t('mod.password')" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" required minlength="6" />
        <p v-if="authError" class="text-xs text-red-500">
          {{ authError }}
        </p>
        <UButton type="submit" color="primary" block>
          {{ mode === 'signIn' ? $t('mod.signIn') : $t('admin.register') }}
        </UButton>
        <button v-if="mode === 'signIn'" type="button" class="block w-full text-center text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" @click="emit('resetPassword', email.trim())">
          {{ $t('mod.forgotPassword') }}
        </button>
      </form>
    </div>

    <div v-else-if="!auth.isAdmin" class="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div class="text-center">
        <UIcon name="i-heroicons-clock" class="mx-auto mb-2 h-8 w-8 text-amber-500" />
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t('admin.pendingTitle') }}
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {{ $t('admin.pendingBody', { email: auth.email }) }}
        </p>
      </div>
      <div class="mt-5 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {{ $t('admin.yourUid') }}
        </p>
        <div class="mt-1 flex items-center gap-2">
          <code class="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-700 dark:bg-zinc-900 dark:text-gray-200">{{ auth.uid }}</code>
          <UButton size="xs" color="gray" variant="ghost" :icon="uidCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'" :aria-label="$t('admin.copyUid')" :title="$t('admin.copyUid')" @click="copyUid" />
        </div>
        <button type="button" class="mt-2 flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline dark:text-teal-400" @click="showBootstrap = !showBootstrap">
          <UIcon :name="showBootstrap ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="h-3 w-3" />{{ $t('admin.bootstrapToggle') }}
        </button>
        <template v-if="showBootstrap">
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-300">
            {{ $t('admin.claimHint') }}
          </p>
          <UButton class="mt-2" size="xs" color="primary" icon="i-heroicons-key" @click="emit('claimAdmin')">
            {{ $t('admin.claimAdmin') }}
          </UButton>
          <p v-if="errors.claimAdmin" class="mt-1.5 text-xs text-red-500">
            {{ errors.claimAdmin }}
          </p>
          <p class="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {{ $t('admin.claimOrManual') }}
          </p>
          <ol class="mt-1 list-decimal space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-300">
            <li>{{ $t('admin.bootstrapStep1') }}</li>
            <li>{{ $t('admin.bootstrapStep2') }}</li>
            <li>{{ $t('admin.bootstrapStep3') }}</li>
            <li>{{ $t('admin.bootstrapStep4') }}</li>
          </ol>
          <p class="mt-2 text-[11px] text-gray-400">
            {{ $t('admin.bootstrapNote') }}
          </p>
        </template>
      </div>
    </div>

    <div v-else-if="!auth.isSuperAdmin" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <UIcon name="i-heroicons-shield-check" class="mx-auto mb-2 h-8 w-8 text-teal-500" />
      <p class="text-sm text-gray-700 dark:text-gray-200">
        {{ $t('admin.moderatorOnly') }}
      </p>
      <UButton to="/" class="mt-4" size="sm" color="primary" variant="soft" icon="i-heroicons-map">
        {{ $t('admin.backToMap') }}
      </UButton>
    </div>

    <template v-else>
      <p v-if="rowError" class="mb-3 text-xs text-red-500">
        {{ rowError }}
      </p>

      <div class="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-zinc-800">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ $t('admin.registrations') }}
            <span v-if="pendingRegistrations.length" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{{ pendingRegistrations.length }}</span>
          </h2>
          <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-arrow-path" :loading="loading" @click="emit('refresh')">
            {{ $t('admin.refresh') }}
          </UButton>
        </div>
        <p class="border-b border-gray-100 px-5 py-2 text-xs text-gray-500 dark:border-zinc-800 dark:text-gray-400">
          {{ $t('admin.registrationsHint') }}
        </p>
        <ul class="divide-y divide-gray-100 dark:divide-zinc-800">
          <li v-if="!pendingRegistrations.length && !loading" class="px-5 py-6 text-center text-sm text-gray-400">
            {{ $t('admin.noRegistrations') }}
          </li>
          <li v-for="r in pendingRegistrations" :key="r.uid" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                {{ r.email || r.uid }}
              </p>
              <p class="truncate text-xs text-gray-400">
                {{ r.uid }}<template v-if="r.createdAt">
                  · {{ date(r.createdAt) }}
                </template>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <UButton size="xs" color="primary" @click="emit('promote', { uid: r.uid, email: r.email, role: 'moderator' })">
                {{ $t('admin.makeModerator') }}
              </UButton>
              <UButton size="xs" color="gray" variant="ghost" @click="emit('promote', { uid: r.uid, email: r.email, role: 'admin' })">
                {{ $t('admin.makeAdmin') }}
              </UButton>
              <UButton size="xs" color="red" variant="ghost" icon="i-heroicons-x-mark" :title="$t('admin.removeRegistration')" @click="emit('removeRegistration', r.uid)" />
            </div>
          </li>
        </ul>
      </div>

      <div class="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-zinc-800">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ $t('admin.accounts') }} <span class="font-normal text-gray-400">· {{ accounts.length }}</span>
          </h2>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-zinc-800">
          <li v-if="!accounts.length && !loading" class="px-5 py-8 text-center text-sm text-gray-400">
            {{ $t('admin.noAccounts') }}
          </li>
          <li v-for="a in accounts" :key="a.uid" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                {{ a.email || a.uid }} <span v-if="a.uid === auth.uid" class="text-xs font-normal text-gray-400">({{ $t('admin.you') }})</span>
              </p>
              <p class="truncate text-xs text-gray-400">
                {{ a.uid }}
              </p>
            </div>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="a.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'">
              {{ a.role === 'admin' ? $t('admin.roleAdmin') : $t('admin.roleModerator') }}
            </span>
            <div class="flex shrink-0 items-center gap-1">
              <UButton v-if="a.uid !== auth.uid" size="xs" color="gray" variant="ghost" @click="emit('setRole', { uid: a.uid, role: a.role === 'admin' ? 'moderator' : 'admin' })">
                {{ a.role === 'admin' ? $t('admin.makeModerator') : $t('admin.makeAdmin') }}
              </UButton>
              <UButton v-if="a.email" size="xs" color="gray" variant="ghost" icon="i-heroicons-envelope" :title="$t('admin.sendReset')" @click="emit('sendReset', a.email)" />
              <UButton v-if="a.uid !== auth.uid" size="xs" color="red" variant="ghost" icon="i-heroicons-trash" :title="$t('admin.revoke')" @click="confirmRevoke = a" />
            </div>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t('admin.createTitle') }}
        </h2>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {{ $t('admin.createHint') }}
        </p>
        <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" @submit.prevent="create">
          <UInput v-model="form.email" type="email" :placeholder="$t('mod.email')" autocomplete="off" required />
          <UInput v-model="form.password" type="password" :placeholder="$t('admin.tempPassword')" autocomplete="new-password" required minlength="6" />
          <USelect v-model="form.role" :options="roleOptions" value-attribute="value" option-attribute="label" />
          <UButton type="submit" color="primary">
            {{ $t('admin.create') }}
          </UButton>
        </form>
        <p v-if="errors.createAccount" class="mt-2 text-xs text-red-500">
          {{ errors.createAccount }}
        </p>
      </div>
      <p class="mt-4 px-1 text-xs text-gray-400">
        {{ $t('admin.revokeNote') }}
      </p>
    </template>

    <Modal v-if="confirmRevoke" :title="$t('admin.revoke')" size="sm" closable @close="confirmRevoke = null">
      <p class="text-sm text-gray-700 dark:text-gray-200">
        {{ $t('admin.revokeConfirm', { email: confirmRevoke.email || confirmRevoke.uid }) }}
      </p>
      <template #footer>
        <div class="mt-4 flex justify-end gap-2">
          <UButton size="sm" color="gray" variant="ghost" @click="confirmRevoke = null">
            {{ $t('mod.close') }}
          </UButton>
          <UButton size="sm" color="red" @click="revoke">
            {{ $t('admin.revoke') }}
          </UButton>
        </div>
      </template>
    </Modal>
  </div>
</template>
