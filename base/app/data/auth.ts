import type { SpecContext } from '../utils/spec-context'
import { registerHandler } from '../utils/handlers'

/**
 * Firebase Auth behind spec handlers, so signing in is data like everything
 * else. Registered only when `app.json` says `data.backend: "firestore"`;
 * `firebase` is imported at call time, since base does not depend on it.
 *
 * Everything lands in one place the page can read: `state.auth` holds
 * `{ uid, email, anonymous, signedIn }`, and a failed attempt shows up as
 * `$errors.<handler>` like any other handler error.
 */

async function auth() {
  const { getAuth } = await import('firebase/auth')
  return getAuth()
}

interface AuthUser {
  uid: string
  email: string | null
  isAnonymous: boolean
}

function describe(user: AuthUser | null) {
  return user
    ? { uid: user.uid, email: user.email, anonymous: user.isAnonymous, signedIn: true }
    : { uid: '', email: null, anonymous: false, signedIn: false }
}

function credentials(payload: unknown) {
  const { email, password } = (payload ?? {}) as { email?: string, password?: string }
  if (!email || !password) {
    throw new Error('signIn needs a payload with `email` and `password`')
  }
  return { email, password }
}

export function registerAuthHandlers() {
  registerHandler('watchAuth', (payload, ctx: SpecContext) => {
    const into = String(payload || 'auth')
    import('firebase/auth').then(async ({ onAuthStateChanged }) => {
      onAuthStateChanged(await auth(), (user) => {
        ctx.state[into] = describe(user as AuthUser | null)
      })
    })
  }, 'Keep state.auth in step with who is signed in: { uid, email, anonymous, signedIn }. The payload names the state key (default "auth"). Call it from the spec root `init`.')

  registerHandler('signIn', async (payload, ctx: SpecContext) => {
    const { email, password } = credentials(payload)
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const { user } = await signInWithEmailAndPassword(await auth(), email, password)
    ctx.state.auth = describe(user as AuthUser)
  }, 'Sign in with a payload of { email, password }. Failures appear as $errors.signIn.')

  registerHandler('signInAnonymous', async (_payload, ctx: SpecContext) => {
    const { signInAnonymously } = await import('firebase/auth')
    const { user } = await signInAnonymously(await auth())
    ctx.state.auth = describe(user as AuthUser)
  }, 'Sign in without an account, so a visitor still has a stable id to attach their contributions to.')

  registerHandler('register', async (payload, ctx: SpecContext) => {
    const { email, password } = credentials(payload)
    const { createUserWithEmailAndPassword } = await import('firebase/auth')
    const { user } = await createUserWithEmailAndPassword(await auth(), email, password)
    ctx.state.auth = describe(user as AuthUser)
  }, 'Create an account from a payload of { email, password } and sign in. Failures appear as $errors.register.')

  registerHandler('signOut', async (_payload, ctx: SpecContext) => {
    const { signOut } = await import('firebase/auth')
    await signOut(await auth())
    ctx.state.auth = describe(null)
  }, 'Sign out and clear state.auth.')

  registerHandler('resetPassword', async (payload) => {
    const email = String(payload ?? '')
    if (!email) {
      throw new Error('resetPassword needs the email as its payload')
    }
    const { sendPasswordResetEmail } = await import('firebase/auth')
    await sendPasswordResetEmail(await auth(), email)
  }, 'Email a password-reset link to the address in the payload.')
}
