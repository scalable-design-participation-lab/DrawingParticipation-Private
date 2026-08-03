import { deleteApp, getApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type AdminRole, roleFromAdminDoc, useAuthStore } from './auth'

/** An `admins/<uid>` document as listed on the account-management page. */
export interface AdminAccount {
  uid: string
  email: string
  role: AdminRole
  createdAt?: Date
}

/**
 * Account management for the /admin page (super admins only — Firestore rules
 * reject writes to `admins/*` from anyone whose own doc isn't role 'admin').
 *
 * Creating an account never touches the current session: Firebase's
 * createUserWithEmailAndPassword signs in as the user it creates, so we run it
 * against a throwaway secondary Firebase app and discard that app afterwards.
 * The password goes only to Firebase Auth (which stores a scrypt hash) — it is
 * never written to Firestore.
 */
export const useAdminUsersStore = defineStore('adminUsers', () => {
  const accounts = ref<AdminAccount[]>([])
  const loading = ref(false)

  async function fetchAccounts() {
    loading.value = true
    try {
      const snap = await getDocs(collection(getFirestore(), 'admins'))
      accounts.value = snap.docs
        .map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            email: typeof data.email === 'string' ? data.email : '',
            role: roleFromAdminDoc(data),
            createdAt: data.createdAt?.toDate?.(),
          }
        })
        .sort((a, b) => a.email.localeCompare(b.email))
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create a moderator/admin login and grant it rights, without disturbing the
   * signed-in super admin. Returns the new account's uid.
   */
  async function createAccount(email: string, password: string, role: AdminRole): Promise<string> {
    const auth = useAuthStore()
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

      // Grant rights as the (still signed-in) super admin.
      await setDoc(doc(getFirestore(), 'admins', uid), {
        email,
        role,
        createdAt: serverTimestamp(),
        createdBy: auth.uid,
      })

      accounts.value = [...accounts.value, { uid, email, role, createdAt: new Date() }]
        .sort((a, b) => a.email.localeCompare(b.email))
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

  return { accounts, loading, fetchAccounts, createAccount, setRole, revoke, sendReset }
})
