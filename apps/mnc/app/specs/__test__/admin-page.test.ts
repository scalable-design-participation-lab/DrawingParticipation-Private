import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import SpecRenderer from '@base/components/SpecRenderer.vue'
import List from '@base/components/List.vue'
import Stack from '@base/components/Stack.vue'
import Panel from '@base/components/Panel.vue'
import Text from '@base/components/Text.vue'
import SpecIcon from '@base/components/SpecIcon.vue'
import { registerComponent } from '@base/utils/registry'
import { registerHandler } from '@base/utils/handlers'
import { registerStyle } from '@base/utils/styles'
import '@base/contracts/components'
import manifest from '../../app.json'
import spec from '../admin.json'

/**
 * /admin is behind a sign-in, so the browser cannot reach past the first
 * screen without Firebase. This drives the page the way a person would: not
 * signed in, registered but waiting, moderator, super admin.
 */
const Button = {
  props: ['label', 'icon', 'to', 'size', 'color', 'variant', 'block', 'loading'],
  template: '<button :data-icon="icon" :data-to="to">{{ label }}</button>',
}
const Tabs = {
  props: ['options', 'modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="tabs"><button v-for="o in options" :key="o.value" :data-tab="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>',
}
const FormFields = {
  props: ['fields', 'modelValue'],
  emits: ['update:modelValue'],
  template: '<form><input v-for="f in fields" :key="f.name" :name="f.name" :placeholder="f.placeholder"></form>',
}
const Modal = {
  props: ['modelValue', 'title'],
  template: '<div v-if="modelValue" class="modal"><slot /><slot name="footer" /></div>',
}

const calls: { name: string, payload: unknown }[] = []
const HANDLERS = ['watchAuth', 'signIn', 'register', 'resetPassword', 'claimAdmin', 'signOut', 'loadAccounts', 'promote', 'removeRegistration', 'setRole', 'revoke', 'createAccount', 'copy']

beforeAll(() => {
  for (const [name, classes] of Object.entries(manifest.styles)) {
    registerStyle(name, classes)
  }
  registerComponent('List', List)
  registerComponent('Stack', Stack)
  registerComponent('Panel', Panel)
  registerComponent('Text', Text)
  registerComponent('Icon', SpecIcon)
  registerComponent('Button', Button)
  registerComponent('Tabs', Tabs)
  registerComponent('FormFields', FormFields)
  registerComponent('Modal', Modal)
  for (const name of HANDLERS) {
    registerHandler(name, (payload: unknown) => {
      calls.push({ name, payload })
    })
  }
})

const AUTH = {
  loading: { ready: false, isAnonymous: true, uid: null, email: null, isAdmin: false, isSuperAdmin: false },
  visitor: { ready: true, isAnonymous: true, uid: 'anon', email: null, isAdmin: false, isSuperAdmin: false },
  waiting: { ready: true, isAnonymous: false, uid: 'uid-1', email: 'new@example.org', isAdmin: false, isSuperAdmin: false },
  moderator: { ready: true, isAnonymous: false, uid: 'uid-2', email: 'mod@example.org', isAdmin: true, isSuperAdmin: false },
  superAdmin: { ready: true, isAnonymous: false, uid: 'uid-3', email: 'boss@example.org', isAdmin: true, isSuperAdmin: true },
}

function page(state: Record<string, unknown> = {}) {
  calls.length = 0
  return mount(SpecRenderer, {
    props: {
      navigate: () => {},
      query: {},
      translate: (key: string) => key,
      spec: {
        ...spec,
        init: [],
        state: {
          ...spec.state,
          accounts: [
            { uid: 'uid-3', email: 'boss@example.org', role: 'admin' },
            { uid: 'uid-4', email: 'helper@example.org', role: 'moderator' },
          ],
          registrations: [
            { uid: 'uid-4', email: 'helper@example.org' },
            { uid: 'uid-5', email: 'newcomer@example.org', createdAt: '2026-09-01T10:00:00Z' },
          ],
          ...state,
        },
      },
    },
  })
}

/**
 * A tab and the button under it can read the same ("Sign in"), and an icon
 * button carries its label as an accessible name, so the search skips tabs and
 * takes a scope when two buttons genuinely say the same thing.
 */
function buttonSaying(w: ReturnType<typeof page>, label: string, within = '') {
  const root = within ? w.find(within) : w
  return root.findAll('button').find(b => b.text() === label && b.attributes('data-tab') === undefined)
}

describe('/admin, before anyone is signed in', () => {
  it('waits rather than guessing which screen to show', async () => {
    const w = page({ auth: AUTH.loading })
    await flushPromises()
    expect(w.text()).toContain('admin.loading')
    expect(w.text()).not.toContain('mod.forgotPassword')
  })

  it('offers sign in or register to a visitor', async () => {
    const w = page({ auth: AUTH.visitor })
    await flushPromises()
    expect(w.findAll('[data-tab]').map(b => b.attributes('data-tab'))).toEqual(['signIn', 'register'])
    expect(w.text()).toContain('mod.forgotPassword')
    // The register hint belongs to the other tab.
    expect(w.text()).not.toContain('admin.registerHint')
  })

  it('switches to registering, and the reset link goes with it', async () => {
    const w = page({ auth: AUTH.visitor })
    await flushPromises()
    await w.find('[data-tab="register"]').trigger('click')
    expect(w.text()).toContain('admin.registerHint')
    expect(w.text()).not.toContain('mod.forgotPassword')
  })

  it('signs in with what was typed, and registers with the same form', async () => {
    const login = { email: 'me@example.org', password: 'hunter2' }
    const w = page({ auth: AUTH.visitor, login })
    await flushPromises()
    await buttonSaying(w, 'mod.signIn')!.trigger('click')
    expect(calls).toEqual([{ name: 'signIn', payload: login }])

    const r = page({ auth: AUTH.visitor, login, mode: 'register' })
    await flushPromises()
    await buttonSaying(r, 'admin.register')!.trigger('click')
    expect(calls).toEqual([{ name: 'register', payload: login }])
  })

  it('sends a reset to the address in the form', async () => {
    const w = page({ auth: AUTH.visitor, login: { email: 'me@example.org', password: '' } })
    await flushPromises()
    await buttonSaying(w, 'mod.forgotPassword')!.trigger('click')
    expect(calls).toEqual([{ name: 'resetPassword', payload: 'me@example.org' }])
  })

  it('shows why a sign-in failed', async () => {
    const w = page({ auth: AUTH.visitor })
    await flushPromises()
    w.vm.errors.signIn = 'Wrong password'
    await flushPromises()
    expect(w.text()).toContain('Wrong password')
  })
})

describe('/admin, registered but not yet granted', () => {
  it('says who is signed in and what happens next', async () => {
    const w = page({ auth: AUTH.waiting })
    await flushPromises()
    expect(w.text()).toContain('admin.pendingTitle')
    expect(w.text()).toContain('admin.signedInAs')
    expect(w.text()).toContain('new@example.org')
    expect(w.text()).toContain('uid-1')
  })

  it('copies the account id, and only then says it did', async () => {
    const w = page({ auth: AUTH.waiting })
    await flushPromises()
    expect(w.find('[data-icon="i-heroicons-check"]').exists()).toBe(false)
    await buttonSaying(w, 'admin.copyUid')!.trigger('click')
    expect(calls).toEqual([{ name: 'copy', payload: 'uid-1' }])

    const copied = page({ auth: AUTH.waiting, uidCopied: true })
    await flushPromises()
    expect(copied.find('[data-icon="i-heroicons-check"]').exists()).toBe(true)
  })

  it('keeps the first-administrator steps folded away', async () => {
    const w = page({ auth: AUTH.waiting })
    await flushPromises()
    expect(w.text()).not.toContain('admin.bootstrapStep1')

    const open = page({ auth: AUTH.waiting, showBootstrap: true })
    await flushPromises()
    expect(open.text()).toContain('admin.bootstrapStep1')
    await buttonSaying(open, 'admin.claimAdmin')!.trigger('click')
    expect(calls.map(c => c.name)).toEqual(['claimAdmin'])
  })
})

describe('/admin, as a moderator', () => {
  it('explains that reviewing happens on the map', async () => {
    const w = page({ auth: AUTH.moderator })
    await flushPromises()
    expect(w.text()).toContain('admin.moderatorOnly')
    expect(w.text()).not.toContain('admin.registrations')
  })
})

describe('/admin, as a super admin', () => {
  it('lists only the registrations that are not accounts yet', async () => {
    const w = page({ auth: AUTH.superAdmin })
    await flushPromises()
    // helper@ is already an account; newcomer@ is not.
    expect(w.text()).toContain('newcomer@example.org')
    expect(w.text()).toContain('admin.registrations')
    const promote = w.findAll('button').filter(b => b.text() === 'admin.makeModerator')
    // One for the single pending registration, one for the admin account.
    expect(promote.length).toBeGreaterThan(0)
  })

  it('promotes a registration with its uid, email and the role pressed', async () => {
    const w = page({ auth: AUTH.superAdmin })
    await flushPromises()
    await buttonSaying(w, 'admin.makeAdmin')!.trigger('click')
    expect(calls).toEqual([{ name: 'promote', payload: { uid: 'uid-5', email: 'newcomer@example.org', role: 'admin' } }])
  })

  it('marks each account with its role and never offers to demote yourself', async () => {
    const w = page({ auth: AUTH.superAdmin })
    await flushPromises()
    expect(w.text()).toContain('admin.roleAdmin')
    expect(w.text()).toContain('admin.roleModerator')
    expect(w.text()).toContain('admin.you')
    // boss@ is the signed-in admin: no role toggle and no revoke on that row.
    const trash = w.findAll('[data-icon="i-heroicons-trash"]')
    expect(trash).toHaveLength(1)
  })

  it('asks before revoking, and names the account', async () => {
    const w = page({ auth: AUTH.superAdmin })
    await flushPromises()
    expect(w.find('.modal').exists()).toBe(false)
    await w.find('[data-icon="i-heroicons-trash"]').trigger('click')
    expect(w.vm.state.confirmRevoke).toMatchObject({ uid: 'uid-4' })
    await flushPromises()
    expect(w.find('.modal').text()).toContain('helper@example.org')

    await buttonSaying(w, 'admin.revoke', '.modal')!.trigger('click')
    expect(calls.map(c => c.name)).toContain('revoke')
    expect(w.vm.state.confirmRevoke).toBe(null)
  })

  it('creates an account from the form and empties it again', async () => {
    const newAccount = { email: 'fresh@example.org', password: 'temp123', role: 'moderator' }
    const w = page({ auth: AUTH.superAdmin, newAccount })
    await flushPromises()
    await buttonSaying(w, 'admin.create')!.trigger('click')
    expect(calls).toEqual([{ name: 'createAccount', payload: newAccount }])
    expect(w.vm.state.newAccount).toEqual({ email: '', password: '', role: 'moderator' })
  })
})
