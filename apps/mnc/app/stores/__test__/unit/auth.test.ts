import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getDoc, setDoc } from 'firebase/firestore'
import { useAuthStore } from '../../auth'

const primaryAuth = { currentUser: null }
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => primaryAuth),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(async () => ({
    user: { uid: 'reg-uid', email: 'new@example.com', isAnonymous: false },
  })),
  createUserWithEmailAndPassword: vi.fn(async () => ({
    user: { uid: 'reg-uid', email: 'new@example.com', isAnonymous: false },
  })),
  signOut: vi.fn(async () => {}),
  sendPasswordResetEmail: vi.fn(async () => {}),
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

  it('flags the registration as incomplete when the mirror write is rejected', async () => {
    // e.g. Firestore rules not deployed yet: the login exists in Firebase
    // Auth, but the accounts/<uid> doc can't be written.
    vi.mocked(setDoc).mockRejectedValueOnce({ code: 'permission-denied' })
    const auth = useAuthStore()
    await expect(auth.register('new@example.com', 'secret123')).rejects.toThrow('registration-incomplete')
  })

  it('self-heals a missing registration mirror on sign-in', async () => {
    const auth = useAuthStore()
    await auth.signIn('new@example.com', 'secret123')
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(primaryAuth, 'new@example.com', 'secret123')
    expect(setDoc).toHaveBeenCalledWith(
      { coll: 'accounts', id: 'reg-uid' },
      { email: 'new@example.com', createdAt: '__serverTimestamp__' },
    )
  })

  it('claimAdmin writes the caller its own admin doc and refreshes the role', async () => {
    // The rules decide who may do this; the store just writes and re-reads.
    vi.mocked(getDoc).mockImplementation(async ref =>
      ({ exists: () => (ref as any).coll === 'admins', data: () => ({ role: 'admin' }) }) as any)
    primaryAuth.currentUser = { uid: 'owner-uid', email: 'owner@example.com', isAnonymous: false } as any
    const auth = useAuthStore()

    await auth.claimAdmin()

    expect(setDoc).toHaveBeenCalledWith(
      { coll: 'admins', id: 'owner-uid' },
      { email: 'owner@example.com', role: 'admin', createdAt: '__serverTimestamp__' },
    )
    expect(auth.isAdmin).toBe(true)
    expect(auth.role).toBe('admin')
    primaryAuth.currentUser = null
  })

  it('claimAdmin propagates a rules rejection instead of faking success', async () => {
    vi.mocked(setDoc).mockRejectedValueOnce({ code: 'permission-denied' })
    primaryAuth.currentUser = { uid: 'nobody', email: 'nobody@example.com', isAnonymous: false } as any
    const auth = useAuthStore()

    await expect(auth.claimAdmin()).rejects.toMatchObject({ code: 'permission-denied' })
    expect(auth.isAdmin).toBe(false)
    primaryAuth.currentUser = null
  })

  it('does not touch the mirror when it already exists', async () => {
    vi.mocked(getDoc).mockImplementation(async ref =>
      ({ exists: () => (ref as any).coll === 'accounts', data: () => ({}) }) as any)
    const auth = useAuthStore()
    await auth.signIn('new@example.com', 'secret123')
    expect(setDoc).not.toHaveBeenCalled()
  })
})
