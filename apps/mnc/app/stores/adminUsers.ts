import { deleteApp, getApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { type AdminRole, roleFromAdminDoc, useAuthStore } from './auth'

/** An `admins/<uid>` document as listed on the account-management page. */
export interface AdminAccount {
  uid: string
  email: string
  role: AdminRole
  createdAt?: Date
}

/** A self-registered login (`accounts/<uid>`) awaiting a rights decision. */
export interface RegisteredAccount {
  uid: string
  email: string
  createdAt?: Date
}

/**
 * Account management for the /admin page (super admins only — Firestore rules
 * reject writes to `admins/*` from anyone whose own doc isn't role 'admin').
 *
 * Two ways in for a new moderator:
 *  - Self-registration: people create a plain account themselves (stores/auth
 *    register()), which mirrors into `accounts/<uid>`; an admin then promotes
 *    it here. This is the primary flow.
 *  - Direct creation: an admin creates the login outright. Firebase's
 *    createUserWithEmailAndPassword signs in as the user it creates, so we run
 *    it against a throwaway secondary Firebase app and discard that app.
 *
 * Either way the password goes only to Firebase Auth (which stores a scrypt
 * hash) — it is never written to Firestore.
 */
export const useAdminUsersStore = defineStore('adminUsers', () => {
  const accounts = ref<AdminAccount[]>([])
  const registrations = ref<RegisteredAccount[]>([])
  const loading = ref(false)

  /** Registrations that don't already have moderation rights. */
  const pendingRegistrations = computed(() =>
    registrations.value.filter(r => !accounts.value.some(a => a.uid === r.uid)),
  )

  function toDate(v: any): Date | undefined {
    return v?.toDate?.()
  }

  async function fetchAccounts() {
    loading.value = true
    try {
      const db = getFirestore()
      const [adminSnap, regSnap] = await Promise.all([
        getDocs(collection(db, 'admins')),
        getDocs(collection(db, 'accounts')),
      ])
      accounts.value = adminSnap.docs
        .map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            email: typeof data.email === 'string' ? data.email : '',
            role: roleFromAdminDoc(data),
            createdAt: toDate(data.createdAt),
          }
        })
        .sort((a, b) => a.email.localeCompare(b.email))
      registrations.value = regSnap.docs
        .map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            email: typeof data.email === 'string' ? data.email : '',
            createdAt: toDate(data.createdAt),
          }
        })
        // Newest registrations first — they're what an admin came to act on.
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    }
    finally {
      loading.value = false
    }
  }

  /** Write the rights doc for a uid (as the signed-in super admin). */
  async function grant(uid: string, email: string, role: AdminRole) {
    const auth = useAuthStore()
    await setDoc(doc(getFirestore(), 'admins', uid), {
      email,
      role,
      createdAt: serverTimestamp(),
      createdBy: auth.uid,
    })
    accounts.value = [...accounts.value, { uid, email, role, createdAt: new Date() }]
      .sort((a, b) => a.email.localeCompare(b.email))
  }

  /** Promote a self-registered account to moderator/admin. */
  async function promote(reg: RegisteredAccount, role: AdminRole) {
    await grant(reg.uid, reg.email, role)
  }

  /** Delete a registration an admin doesn't recognize (the login remains but
   *  has no rights; the person can register again). */
  async function removeRegistration(uid: string) {
    await deleteDoc(doc(getFirestore(), 'accounts', uid))
    registrations.value = registrations.value.filter(r => r.uid !== uid)
  }

  /**
   * Create a moderator/admin login outright, without disturbing the signed-in
   * super admin. Returns the new account's uid.
   */
  async function createAccount(email: string, password: string, role: AdminRole): Promise<string> {
    // Throwaway app: same project config, isolated auth state.
    const secondary = initializeApp(getApp().options, `account-creation-${Date.now()}`)
    try {
      const secondaryAuth = getAuth(secondary)
      // Mirror the primary auth's emulator connection so local testing with
      // VUEFIRE_EMULATORS=true creates users in the emulator, not the cloud.
      const emu = getAuth().emulatorConfig
      if (emu)
        connectAuthEmulator(secondaryAuth, `${emu.protocol}://${emu.host}:${emu.port}`, { disableWarnings: true })

      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const uid = cred.user.uid
      await signOut(secondaryAuth)

      await grant(uid, email, role)
      return uid
    }
    finally {
      await deleteApp(secondary).catch(() => {})
    }
  }

  /** Switch an existing account between 'admin' and 'moderator'. */
  async function setRole(uid: string, role: AdminRole) {
    const auth = useAuthStore()
    if (uid === auth.uid)
      throw new Error('cannot-change-own-role')
    await updateDoc(doc(getFirestore(), 'admins', uid), { role })
    const acc = accounts.value.find(a => a.uid === uid)
    if (acc)
      acc.role = role
  }

  /**
   * Revoke moderation rights by deleting the `admins/<uid>` doc. The Firebase
   * Auth login itself remains (deleting it needs the Admin SDK) but has no
   * rights anywhere — rules treat it like any anonymous visitor.
   */
  async function revoke(uid: string) {
    const auth = useAuthStore()
    if (uid === auth.uid)
      throw new Error('cannot-revoke-self')
    await deleteDoc(doc(getFirestore(), 'admins', uid))
    accounts.value = accounts.value.filter(a => a.uid !== uid)
  }

  /** Email a password-reset link (Firebase handles the token + new hash). */
  async function sendReset(email: string) {
    await sendPasswordResetEmail(getAuth(), email)
  }

  return {
    accounts,
    registrations,
    pendingRegistrations,
    loading,
    fetchAccounts,
    promote,
    removeRegistration,
    createAccount,
    setRole,
    revoke,
    sendReset,
  }
})
