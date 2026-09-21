import type { DataAdapter, DataSourceSpec } from './adapters'

/**
 * Firestore behind the same `collection` data source and the same `saveTo` /
 * `deleteFrom` handlers as base's own storage, so a spec reads and writes the
 * same way whichever backend an app declared in `app.json`.
 *
 * `firebase` is imported at call time: base does not depend on it, and only an
 * app that set `data.backend: "firestore"` ever reaches this file.
 */

async function db() {
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore()
}

/** A row as a spec sees it: the document's fields plus its `id`. */
function row(doc: { id: string, data: () => Record<string, unknown> }) {
  return { id: doc.id, ...doc.data() }
}

export const firestoreAdapter: DataAdapter = {
  async load(spec: DataSourceSpec) {
    if (spec.kind !== 'collection' || !spec.name) {
      throw new Error(`firestore: "${spec.kind}" is not a collection source`)
    }
    const { collection, getDocs, limit, orderBy, query, where } = await import('firebase/firestore')
    const clauses = [
      ...(spec.where ?? []).map(([field, op, value]) => where(field, op as never, value)),
      ...(spec.orderBy ? [orderBy(spec.orderBy, spec.orderDesc ? 'desc' : 'asc')] : []),
      ...(spec.limit ? [limit(spec.limit)] : []),
    ]
    const snapshot = await getDocs(query(collection(await db(), spec.name), ...clauses))
    return snapshot.docs.map(row)
  },
}

/** Append a row; returns the new document id, the way base's own API does. */
export async function firestoreCreate(name: string, data: Record<string, unknown>) {
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
  const ref = await addDoc(collection(await db(), name), { ...data, createdAt: serverTimestamp() })
  return { id: ref.id, ...data }
}

export async function firestoreUpdate(name: string, id: string, patch: Record<string, unknown>) {
  const { doc, updateDoc } = await import('firebase/firestore')
  await updateDoc(doc(await db(), name, id), patch)
  return { id, ...patch }
}

export async function firestoreDelete(name: string, id: string) {
  const { deleteDoc, doc } = await import('firebase/firestore')
  await deleteDoc(doc(await db(), name, id))
}
