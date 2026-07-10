import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Auth + moderation identity.
 *
 * Regular visitors stay anonymous (see plugins/auth.client.ts) and can still
 * submit entries/contributions — those go into a pending queue. Moderators sign
 * in with email/password; a user counts as an admin when a document exists at
 * `admins/<uid>` in Firestore.
 *
 * Bootstrapping the first admin: sign up / sign in once to get your uid (shown
 * in the Firebase console → Authentication), then create an `admins/<uid>`
 * document (any contents) in Firestore. That account can then approve/delete.
 */
export const useAuthStore = defineStore('auth', () => {
  const uid = ref<string | null>(null)
  const email = ref<string | null>(null)
  const isAnonymous = ref(true)
  const isAdmin = ref(false)
  const ready = ref(false)
  let started = false

  async function refreshAdmin(u: { uid: string, isAnonymous: boolean } | null) {
    if (!u || u.isAnonymous) {
      isAdmin.value = false
      return
    }
    try {
      const snap = await getDoc(doc(getFirestore(), 'admins', u.uid))
      isAdmin.value = snap.exists()
    }
    catch {
      isAdmin.value = false
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

  async function signIn(e: string, pw: string) {
    const cred = await signInWithEmailAndPassword(getAuth(), e, pw)
    await refreshAdmin(cred.user)
  }

  async function signOut() {
    await fbSignOut(getAuth())
    isAdmin.value = false
  }

  return { uid, email, isAnonymous, isAdmin, ready, init, signIn, signOut }
})
