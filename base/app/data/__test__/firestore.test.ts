import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DataSourceSpec } from '../../contracts/spec'
import { firestoreAdapter, firestoreCreate, firestoreDelete, firestoreUpdate } from '../firestore'

/**
 * There are no Firebase credentials here and there never will be in CI, so
 * these stand in for the SDK and check the only thing base is responsible for:
 * that a data source turns into the query an app would expect, and that a
 * write lands on the document it names.
 *
 * What this cannot tell you is whether the rules let you read it.
 */
const calls: { fn: string, args: unknown[] }[] = []
const docs = [
  { id: 'a', data: () => ({ title: 'first', votes: 2 }) },
  { id: 'b', data: () => ({ title: 'second', votes: 9 }) },
]

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({ db: true }),
  collection: (...a: unknown[]) => ({ collection: a }),
  doc: (...a: unknown[]) => ({ doc: a }),
  query: (...a: unknown[]) => ({ query: a }),
  where: (...a: unknown[]) => ({ where: a }),
  orderBy: (...a: unknown[]) => ({ orderBy: a }),
  limit: (...a: unknown[]) => ({ limit: a }),
  serverTimestamp: () => 'SERVER_TIME',
  getDocs: (q: unknown) => {
    calls.push({ fn: 'getDocs', args: [q] })
    return { docs }
  },
  addDoc: (...a: unknown[]) => {
    calls.push({ fn: 'addDoc', args: a })
    return { id: 'new-id' }
  },
  updateDoc: (...a: unknown[]) => {
    calls.push({ fn: 'updateDoc', args: a })
  },
  deleteDoc: (...a: unknown[]) => {
    calls.push({ fn: 'deleteDoc', args: a })
  },
}))

const only = (fn: string) => calls.filter(c => c.fn === fn)

describe('firestoreAdapter', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('returns each document as its fields plus its id', async () => {
    const rows = await firestoreAdapter.load({ kind: 'collection', name: 'propuestas' } as DataSourceSpec)
    expect(rows).toEqual([
      { id: 'a', title: 'first', votes: 2 },
      { id: 'b', title: 'second', votes: 9 },
    ])
  })

  it('turns where / orderBy / limit into clauses on the named collection', async () => {
    await firestoreAdapter.load({
      kind: 'collection',
      name: 'entries',
      where: [['owner', '==', 'uid-1'], ['approved', '==', true]],
      orderBy: 'createdAt',
      orderDesc: true,
      limit: 20,
    } as DataSourceSpec)

    const [{ args: [built] }] = only('getDocs')
    const [target, ...clauses] = (built as { query: unknown[] }).query
    expect(target).toEqual({ collection: [{ db: true }, 'entries'] })
    expect(clauses).toEqual([
      { where: ['owner', '==', 'uid-1'] },
      { where: ['approved', '==', true] },
      { orderBy: ['createdAt', 'desc'] },
      { limit: [20] },
    ])
  })

  it('sorts ascending unless the source says otherwise, and adds nothing it was not asked for', async () => {
    await firestoreAdapter.load({ kind: 'collection', name: 'entries', orderBy: 'title' } as DataSourceSpec)
    const [{ args: [built] }] = only('getDocs')
    expect((built as { query: unknown[] }).query.slice(1)).toEqual([{ orderBy: ['title', 'asc'] }])
  })

  it('refuses a source it cannot serve, rather than reading the wrong thing', async () => {
    await expect(firestoreAdapter.load({ kind: 'rest', url: '/api/x' } as DataSourceSpec))
      .rejects.toThrow(/not a collection source/)
    await expect(firestoreAdapter.load({ kind: 'static', items: [] } as DataSourceSpec))
      .rejects.toThrow(/not a collection source/)
  })
})

describe('firestore writes', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('stamps a created row and hands back the new id', async () => {
    const saved = await firestoreCreate('votos', { propuesta: 'a', value: 1 })
    expect(only('addDoc')[0].args).toEqual([
      { collection: [{ db: true }, 'votos'] },
      { propuesta: 'a', value: 1, createdAt: 'SERVER_TIME' },
    ])
    // The shape base's own storage returns, so `saveTo` behaves the same way.
    expect(saved).toEqual({ id: 'new-id', propuesta: 'a', value: 1 })
  })

  it('patches one document and leaves the rest of it alone', async () => {
    const patched = await firestoreUpdate('propuestas', 'a', { title: 'renamed' })
    expect(only('updateDoc')[0].args).toEqual([
      { doc: [{ db: true }, 'propuestas', 'a'] },
      { title: 'renamed' },
    ])
    expect(patched).toEqual({ id: 'a', title: 'renamed' })
  })

  it('deletes by id', async () => {
    await firestoreDelete('propuestas', 'b')
    expect(only('deleteDoc')[0].args).toEqual([{ doc: [{ db: true }, 'propuestas', 'b'] }])
  })
})
