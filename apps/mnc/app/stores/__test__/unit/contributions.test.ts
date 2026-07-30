import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, uploadBytesResumable } from 'firebase/storage'
import { useContributionsStore } from '../../contributions'

// Mock the Firebase SDK surface the store touches. None of these hit a real
// backend, so the test runs without any FIREBASE_* env / live project.
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((db, name) => ({ db, name })),
  addDoc: vi.fn(async () => ({ id: 'new-doc' })),
  getDocs: vi.fn(),
  query: vi.fn((...args) => ({ args })),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn((storage, path) => ({ storage, path })),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(async () => 'https://example.com/img.png'),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
}))

describe('contributions store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('uploadFile streams real progress and resolves media metadata', async () => {
    // Simulate the resumable upload task: two progress ticks, then complete.
    const task = {
      snapshot: { ref: { fullPath: 'contributions/p1/file.png' } },
      on: vi.fn((_event, onProgress, _onError, onComplete) => {
        onProgress({ bytesTransferred: 512, totalBytes: 1024 })
        onProgress({ bytesTransferred: 1024, totalBytes: 1024 })
        onComplete()
      }),
    }
    ;(uploadBytesResumable as any).mockReturnValue(task)

    const store = useContributionsStore()
    const file = new File([new Uint8Array(1024)], 'My Photo.png', { type: 'image/png' })

    const progresses: number[] = []
    const media = await store.uploadFile('p1', file, p => progresses.push(p))

    expect(progresses).toEqual([50, 100])
    expect(getDownloadURL).toHaveBeenCalledTimes(1)
    expect(media).toMatchObject({
      url: 'https://example.com/img.png',
      name: 'My Photo.png',
      size: 1024,
      contentType: 'image/png',
      kind: 'image',
    })
    // Path is scoped to the project and sanitizes spaces in the file name.
    expect(media.path).toContain('contributions/p1/')
    expect(media.path).toContain('My_Photo.png')
  })

  it('gives same-named files uploaded in one batch distinct storage paths', async () => {
    // Both uploads complete instantly, so they share a Date.now() millisecond —
    // exactly the batch case that used to overwrite the first object and make
    // every media item resolve to the same picture.
    ;(uploadBytesResumable as any).mockImplementation(() => ({
      snapshot: { ref: {} },
      on: vi.fn((_event, _onProgress, _onError, onComplete) => onComplete()),
    }))

    const store = useContributionsStore()
    // A phone photo roll hands us the same file name for every shot.
    const a = new File([new Uint8Array(8)], 'image.jpg', { type: 'image/jpeg' })
    const b = new File([new Uint8Array(16)], 'image.jpg', { type: 'image/jpeg' })

    const [first, second] = await Promise.all([
      store.uploadFile('p1', a),
      store.uploadFile('p1', b),
    ])

    expect(first!.path).not.toBe(second!.path)
    // The paths passed to Storage are the ones that must differ.
    const paths = (uploadBytesResumable as any).mock.calls.map((c: any[]) => c[0].path)
    expect(new Set(paths).size).toBe(2)
  })

  it('addContribution writes a well-formed doc with an anonymous userId', async () => {
    const store = useContributionsStore()
    await store.addContribution('p1', {
      comment: 'nice project',
      media: [{ url: 'u', path: 'p', name: 'n', size: 1, contentType: 'image/png', kind: 'image' }],
    })

    expect(addDoc).toHaveBeenCalledTimes(1)
    const payload = (addDoc as any).mock.calls[0][1]
    expect(payload).toMatchObject({
      projectId: 'p1',
      comment: 'nice project',
      userId: 'anonymous',
      createdAt: '__serverTimestamp__',
    })
    expect(serverTimestamp).toHaveBeenCalled()
    expect(payload.media).toHaveLength(1)
  })

  it('addContribution rejects an empty projectId', async () => {
    const store = useContributionsStore()
    await expect(
      store.addContribution('', { comment: '', media: [] }),
    ).rejects.toThrow()
    expect(addDoc).not.toHaveBeenCalled()
  })

  it('fetchContributions returns [] for an empty projectId without querying', async () => {
    const store = useContributionsStore()
    expect(await store.fetchContributions('')).toEqual([])
    expect(getDocs).not.toHaveBeenCalled()
  })

  it('fetchContributions sorts newest-first and caches by project', async () => {
    ;(getDocs as any).mockResolvedValue({
      docs: [
        {
          id: 'older',
          data: () => ({
            projectId: 'p1',
            comment: 'older',
            media: [],
            userId: 'anonymous',
            createdAt: { toDate: () => new Date('2020-01-01T00:00:00Z') },
          }),
        },
        {
          id: 'newer',
          data: () => ({
            projectId: 'p1',
            comment: 'newer',
            media: [],
            userId: 'anonymous',
            createdAt: { toDate: () => new Date('2022-01-01T00:00:00Z') },
          }),
        },
      ],
    })

    const store = useContributionsStore()
    const items = await store.fetchContributions('p1')

    expect(items.map(i => i.id)).toEqual(['newer', 'older'])
    expect(store.byProject.p1.map(i => i.comment)).toEqual(['newer', 'older'])
  })
})
