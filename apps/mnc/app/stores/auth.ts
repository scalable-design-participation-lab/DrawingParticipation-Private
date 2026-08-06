import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** Moderation roles stored on `admins/<uid>` documents. */
export type AdminRole = 'admin' | 'moderator'

/**
 * Resolve the role encoded in an `admins/<uid>` document. Documents created
 * before roles existed have no `role` field — those were bootstrapped by the
 * team from the Firebase console, so they keep full rights ('admin').
 */
export function roleFromAdminDoc(data: Record<string, unknown> | undefined): AdminRole {
  return data?.role === 'moderator' ? 'moderator' : 'admin'
}

/**
 * Auth + moderation identity.
 *
 * Regular visitors stay anonymous (see plugins/auth.client.ts) and can still
 * submit entries/contributions — those go into a pending queue. Moderators sign
 * in with email/password; a user counts as a moderator when a document exists
 * at `admins/<uid>` in Firestore. That document's `role` field distinguishes
 * two tiers: 'admin' (can also manage accounts on /admin) and 'moderator'
 * (review-only). Passwords are never stored in Firestore — Firebase Auth keeps
 * only scrypt hashes.
 *
 * Bootstrapping the first admin: sign in once to get your uid (shown in the
 * Firebase console → Authentication), then create an `admins/<uid>` document
 * with `{ role: 'admin' }` in Firestore. From then on, further accounts are
 * created from the /admin page instead of the console.
 */
export const useAuthStore = defineStore('auth', () => {
  const uid = ref<string | null>(null)
  const email = ref<string | null>(null)
  const isAnonymous = ref(true)
  const isAdmin = ref(false)
  const role = ref<AdminRole | null>(null)
  const ready = ref(false)
  let started = false

  /** True only for the account-management tier ('admin' role). */
  const isSuperAdmin = computed(() => isAdmin.value && role.value === 'admin')

  async function refreshAdmin(u: { uid: string, isAnonymous: boolean } | null) {
    if (!u || u.isAnonymous) {
      isAdmin.value = false
      role.value = null
      return
    }
    try {
      const snap = await getDoc(doc(getFirestore(), 'admins', u.uid))
      isAdmin.value = snap.exists()
      role.value = snap.exists() ? roleFromAdminDoc(snap.data()) : null
    }
    catch {
      isAdmin.value = false
      role.value = null
    }
  }

  // Idempotent: sets up a single auth-state listener that keeps uid/isAdmin
  // in sync (across the anonymous plugin sign-in and admin sign-in/out).
  function init() {
    if (started || import.meta.server)
      return
    started = true
    onAuthStateChanged(getAuth(), async (u) => {
      uid.value = u?.uid ?? null
      email.value = u?.email ?? null
      isAnonymous.value = u?.isAnonymous ?? true
      await refreshAdmin(u ? { uid: u.uid, isAnonymous: u.isAnonymous } : null)
      ready.value = true
    })
  }

  /**
   * Mirror a signed-in (non-anonymous, non-admin) login into `accounts/<uid>`
   * so it shows up for review on /admin. Safe to call repeatedly: writes only
   * when the doc is missing. Returns false when the mirror could not be
   * written (e.g. Firestore rules not deployed yet) — the login still exists
   * in Firebase Auth, and the next successful sign-in heals the mirror.
   */
  async function ensureAccountDoc(u: { uid: string, email: string | null, isAnonymous: boolean }): Promise<boolean> {
    if (u.isAnonymous || isAdmin.value)
      return true
    try {
      const ref = doc(getFirestore(), 'accounts', u.uid)
      if (!(await getDoc(ref)).exists()) {
        await setDoc(ref, {
          email: u.email ?? '',
          createdAt: serverTimestamp(),
        })
      }
      return true
    }
    catch (e) {
      // Swallowed by design (best-effort mirror), but keep the cause visible
      // for whoever is debugging a failed registration.
      console.warn('[auth] could not mirror registration to accounts/<uid>', e)
      return false
    }
  }

  async function signIn(e: string, pw: string) {
    const cred = await signInWithEmailAndPassword(getAuth(), e, pw)
    await refreshAdmin(cred.user)
    // Self-heal: a login whose registration mirror failed at register time
    // gets its accounts/<uid> doc created here instead.
    await ensureAccountDoc(cred.user)
  }

  /**
   * Self-registration (a plain account, no rights). The registration is
   * mirrored to `accounts/<uid>` so it shows up on the /admin page, where an
   * administrator can then grant moderator/admin access. The password goes
   * only to Firebase Auth (scrypt hash), never to Firestore.
   */
  async function register(e: string, pw: string) {
    const cred = await createUserWithEmailAndPassword(getAuth(), e, pw)
    await refreshAdmin(cred.user)
    // The login now exists either way; flag a failed mirror distinctly so the
    // UI can say "created, but not visible to admins yet" instead of a
    // generic failure.
    if (!(await ensureAccountDoc(cred.user)))
      throw new Error('registration-incomplete')
  }

  /**
   * Bootstrap the very first administrator without the Firebase console: the
   * project owners named in firestore.rules (isProjectOwner) may create their
   * own `admins/<uid>` doc once. The rules reject this for everyone else, and
   * reject a second attempt, so there is nothing to guard client-side.
   */
  async function claimAdmin() {
    const u = getAuth().currentUser
    if (!u)
      throw new Error('not-signed-in')
    await setDoc(doc(getFirestore(), 'admins', u.uid), {
      email: u.email ?? '',
      role: 'admin',
      createdAt: serverTimestamp(),
    })
    await refreshAdmin(u)
  }

  async function signOut() {
    await fbSignOut(getAuth())
    isAdmin.value = false
    role.value = null
  }

  return { uid, email, isAnonymous, isAdmin, isSuperAdmin, role, ready, init, signIn, register, claimAdmin, signOut }
})
