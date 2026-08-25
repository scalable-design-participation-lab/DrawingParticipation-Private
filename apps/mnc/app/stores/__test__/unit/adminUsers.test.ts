import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { deleteDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { useAdminUsersStore } from '../../adminUsers'
import { roleFromAdminDoc, useAuthStore } from '../../auth'

// Mock the Firebase SDK surface the stores touch. None of these hit a real
// backend, so the test runs without any FIREBASE_* env / live project.
vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({ options: { projectId: 'test' } })),
  initializeApp: vi.fn(() => ({ name: 'secondary' })),
  deleteApp: vi.fn(async () => {}),
}))

// The primary auth (no args) carries the signed-in super admin; the secondary
// app's auth is a separate instance so account creation can't clobber it.
const primaryAuth = { currentUser: { uid: 'me' }, emulatorConfig: null }
const secondaryAuth = { name: 'secondary-auth' }
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn((app?: unknown) => (app ? secondaryAuth : primaryAuth)),
  connectAuthEmulator: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(async () => ({ user: { uid: 'new-uid' } })),
  signOut: vi.fn(async () => {}),
  sendPasswordResetEmail: vi.fn(async () => {}),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((db, name) => ({ db, name })),
  doc: vi.fn((db, coll, id) => ({ coll, id })),
  getDoc: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [] })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
}))

/** Make getDocs answer per collection name (fetchAccounts pulls two lists). */
function mockCollections(data: Record<string, Array<{ id: string, data: () => any }>>) {
  vi.mocked(getDocs).mockImplementation(async (ref: any) => ({ docs: data[ref.name] ?? [] }) as any)
}

describe('roleFromAdminDoc', () => {
  it('reads the stored role and defaults legacy docs to admin', () => {
    expect(roleFromAdminDoc({ role: 'moderator' })).toBe('moderator')
    expect(roleFromAdminDoc({ role: 'admin' })).toBe('admin')
    // Docs bootstrapped from the console (no role field) keep full rights.
    expect(roleFromAdminDoc({})).toBe('admin')
    expect(roleFromAdminDoc(undefined)).toBe('admin')
  })
})

describe('adminUsers store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDocs).mockImplementation(async () => ({ docs: [] }) as any)
    setActivePinia(createPinia())
    useAuthStore().uid = 'me'
  })

  it('creates the account on a throwaway app and grants rights as the admin', async () => {
    const store = useAdminUsersStore()
    const uid = await store.createAccount('mod@example.com', 'secret123', 'moderator')

    expect(uid).toBe('new-uid')
    // User created on the secondary auth, never on the primary session.
    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'test' }, expect.stringContaining('account-creation'))
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(secondaryAuth, 'mod@example.com', 'secret123')
    expect(signOut).toHaveBeenCalledWith(secondaryAuth)
    expect(deleteApp).toHaveBeenCalled()
    // Rights doc written for the new uid — email + role only, never the password.
    expect(setDoc).toHaveBeenCalledWith(
      { coll: 'admins', id: 'new-uid' },
      { email: 'mod@example.com', role: 'moderator', createdAt: '__serverTimestamp__', createdBy: 'me' },
    )
    expect(JSON.stringify(vi.mocked(setDoc).mock.calls)).not.toContain('secret123')
    expect(store.accounts).toEqual([
      expect.objectContaining({ uid: 'new-uid', email: 'mod@example.com', role: 'moderator' }),
    ])
  })

  it('discards the throwaway app even when creation fails', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValueOnce({ code: 'auth/email-already-in-use' })
    const store = useAdminUsersStore()
    await expect(store.createAccount('dup@example.com', 'secret123', 'moderator')).rejects.toMatchObject({
      code: 'auth/email-already-in-use',
    })
    expect(deleteApp).toHaveBeenCalled()
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('lists accounts and registrations, with legacy admin docs defaulting to admin', async () => {
    mockCollections({
      admins: [
        { id: 'u2', data: () => ({ email: 'zoe@example.com', role: 'moderator' }) },
        { id: 'u1', data: () => ({}) }, // legacy console-created doc
      ],
      accounts: [
        { id: 'r1', data: () => ({ email: 'newbie@example.com' }) },
        { id: 'u2', data: () => ({ email: 'zoe@example.com' }) }, // already promoted
      ],
    })
    const store = useAdminUsersStore()
    await store.fetchAccounts()
    expect(store.accounts).toEqual([
      expect.objectContaining({ uid: 'u1', email: '', role: 'admin' }),
      expect.objectContaining({ uid: 'u2', email: 'zoe@example.com', role: 'moderator' }),
    ])
    // Registrations that already hold rights don't show up as pending.
    expect(store.pendingRegistrations).toEqual([
      expect.objectContaining({ uid: 'r1', email: 'newbie@example.com' }),
    ])
  })

  it('promotes a registration by writing its rights doc', async () => {
    const store = useAdminUsersStore()
    store.registrations = [{ uid: 'r1', email: 'newbie@example.com' }]

    await store.promote({ uid: 'r1', email: 'newbie@example.com' }, 'moderator')
    expect(setDoc).toHaveBeenCalledWith(
      { coll: 'admins', id: 'r1' },
      { email: 'newbie@example.com', role: 'moderator', createdAt: '__serverTimestamp__', createdBy: 'me' },
    )
    // Now an account — and therefore no longer pending.
    expect(store.accounts).toEqual([expect.objectContaining({ uid: 'r1', role: 'moderator' })])
    expect(store.pendingRegistrations).toEqual([])
  })

  it('removes an unrecognized registration', async () => {
    const store = useAdminUsersStore()
    store.registrations = [{ uid: 'r1', email: 'spam@example.com' }]
    await store.removeRegistration('r1')
    expect(deleteDoc).toHaveBeenCalledWith({ coll: 'accounts', id: 'r1' })
    expect(store.registrations).toEqual([])
  })

  it('changes roles and revokes access, but never for the signed-in admin', async () => {
    const store = useAdminUsersStore()
    store.accounts = [
      { uid: 'me', email: 'me@example.com', role: 'admin' },
      { uid: 'other', email: 'other@example.com', role: 'moderator' },
    ]

    await store.setRole('other', 'admin')
    expect(updateDoc).toHaveBeenCalledWith({ coll: 'admins', id: 'other' }, { role: 'admin' })
    expect(store.accounts.find(a => a.uid === 'other')?.role).toBe('admin')

    await store.revoke('other')
    expect(deleteDoc).toHaveBeenCalledWith({ coll: 'admins', id: 'other' })
    expect(store.accounts.map(a => a.uid)).toEqual(['me'])

    // Guard rails: the rules forbid self-writes, and so does the store.
    await expect(store.setRole('me', 'moderator')).rejects.toThrow('cannot-change-own-role')
    await expect(store.revoke('me')).rejects.toThrow('cannot-revoke-self')
    expect(store.accounts.map(a => a.uid)).toEqual(['me'])
  })
})
