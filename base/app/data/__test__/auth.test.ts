import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHandler } from '../../utils/handlers'
import type { SpecContext } from '../../utils/spec-context'
import { registerAuthHandlers } from '../auth'

/**
 * Firebase Auth stubbed out: what base owes an app here is that every way of
 * signing in leaves the same `state.auth` behind, and that a bad call throws
 * rather than half-signing someone in.
 */
const calls: { fn: string, args: unknown[] }[] = []
let listener: ((user: unknown) => void) | null = null

const person = { uid: 'uid-1', email: 'a@b.c', isAnonymous: false }
const guest = { uid: 'uid-2', email: null, isAnonymous: true }

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ auth: true }),
  onAuthStateChanged: (_a: unknown, cb: (user: unknown) => void) => {
    listener = cb
  },
  signInWithEmailAndPassword: (...args: unknown[]) => {
    calls.push({ fn: 'signInWithEmailAndPassword', args })
    return { user: person }
  },
  createUserWithEmailAndPassword: (...args: unknown[]) => {
    calls.push({ fn: 'createUserWithEmailAndPassword', args })
    return { user: person }
  },
  signInAnonymously: (...args: unknown[]) => {
    calls.push({ fn: 'signInAnonymously', args })
    return { user: guest }
  },
  signOut: (...args: unknown[]) => {
    calls.push({ fn: 'signOut', args })
  },
  sendPasswordResetEmail: (...args: unknown[]) => {
    calls.push({ fn: 'sendPasswordResetEmail', args })
  },
}))

registerAuthHandlers()

function context() {
  return { state: {} as Record<string, unknown> } as SpecContext
}

function run(name: string, payload?: unknown, ctx = context()) {
  return Promise.resolve(getHandler(name)!(payload, ctx)).then(() => ctx)
}

const SIGNED_OUT = { uid: '', email: null, anonymous: false, signedIn: false }

describe('auth handlers', () => {
  beforeEach(() => {
    calls.length = 0
    listener = null
  })

  it('describes whoever signed in the same way, however they did it', async () => {
    const byPassword = await run('signIn', { email: 'a@b.c', password: 'secret' })
    expect(byPassword.state.auth).toEqual({ uid: 'uid-1', email: 'a@b.c', anonymous: false, signedIn: true })

    const byRegistering = await run('register', { email: 'a@b.c', password: 'secret' })
    expect(byRegistering.state.auth).toEqual(byPassword.state.auth)

    // A visitor with no account still gets a stable id to hang uploads on.
    const asGuest = await run('signInAnonymous')
    expect(asGuest.state.auth).toEqual({ uid: 'uid-2', email: null, anonymous: true, signedIn: true })
  })

  it('passes the credentials through and refuses half of a pair', async () => {
    await run('signIn', { email: 'a@b.c', password: 'secret' })
    expect(calls[0].args).toEqual([{ auth: true }, 'a@b.c', 'secret'])

    for (const bad of [undefined, {}, { email: 'a@b.c' }, { password: 'secret' }]) {
      await expect(run('signIn', bad)).rejects.toThrow(/email.*password/)
      await expect(run('register', bad)).rejects.toThrow(/email.*password/)
    }
    expect(calls).toHaveLength(1)
  })

  it('clears state.auth on the way out', async () => {
    const ctx = await run('signIn', { email: 'a@b.c', password: 'secret' })
    await run('signOut', undefined, ctx)
    expect(ctx.state.auth).toEqual(SIGNED_OUT)
  })

  it('keeps the named state key in step with the listener', async () => {
    const ctx = context()
    await run('watchAuth', undefined, ctx)
    await vi.waitFor(() => expect(listener).toBeTypeOf('function'))

    listener!(person)
    expect(ctx.state.auth).toEqual({ uid: 'uid-1', email: 'a@b.c', anonymous: false, signedIn: true })
    // Signing out elsewhere (another tab, an expired token) reaches the page too.
    listener!(null)
    expect(ctx.state.auth).toEqual(SIGNED_OUT)
  })

  it('lets the spec choose where the signed-in person lands', async () => {
    const ctx = context()
    await run('watchAuth', 'viewer', ctx)
    await vi.waitFor(() => expect(listener).toBeTypeOf('function'))
    listener!(person)
    expect(ctx.state.viewer).toMatchObject({ uid: 'uid-1', signedIn: true })
    expect(ctx.state.auth).toBeUndefined()
  })

  it('will not mail a reset to nobody', async () => {
    await expect(run('resetPassword', '')).rejects.toThrow(/email/)
    expect(calls).toHaveLength(0)
    await run('resetPassword', 'a@b.c')
    expect(calls[0].args).toEqual([{ auth: true }, 'a@b.c'])
  })
})
