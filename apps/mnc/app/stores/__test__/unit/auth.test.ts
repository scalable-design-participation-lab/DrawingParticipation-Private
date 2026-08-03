import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { getDoc, setDoc } from 'firebase/firestore'
import { useAuthStore } from '../../auth'

const primaryAuth = { currentUser: null }
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => primaryAuth),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(async () => ({ user: { uid: 'reg-uid', isAnonymous: false } })),
  signOut: vi.fn(async () => {}),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((db, coll, id) => ({ coll, id })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
  setDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
}))

describe('auth store register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('creates the login on the primary auth and mirrors it to accounts/<uid>', async () => {
    const auth = useAuthStore()
    await auth.register('new@example.com', 'secret123')

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(primaryAuth, 'new@example.com', 'secret123')
    // Registration doc carries email + timestamp only — never the password.
    expect(setDoc).toHaveBeenCalledWith(
      { coll: 'accounts', id: 'reg-uid' },
      { email: 'new@example.com', createdAt: '__serverTimestamp__' },
    )
    expect(JSON.stringify(vi.mocked(setDoc).mock.calls)).not.toContain('secret123')
    // A fresh registration carries no rights until an admin grants them.
    expect(getDoc).toHaveBeenCalledWith({ coll: 'admins', id: 'reg-uid' })
    expect(auth.isAdmin).toBe(false)
    expect(auth.role).toBe(null)
  })
})
