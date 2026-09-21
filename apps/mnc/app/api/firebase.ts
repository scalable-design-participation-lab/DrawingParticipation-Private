import { getAuth } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { deleteObject, getDownloadURL, getStorage, ref as storageRef, uploadBytesResumable } from 'firebase/storage'

/**
 * Firestore / Storage calls shared by the handlers and the upload widget.
 * Plain functions: no store, no component state. nuxt-vuefire initialises the
 * default app, so getFirestore() / getStorage() / getAuth() just resolve it.
 */
export interface MediaItem {
  url: string
  path: string
  name: string
  size: number
  contentType: string
  kind: 'image' | 'audio' | 'video'
}

export interface Contribution {
  id?: string
  projectId: string
  comment: string
  media: MediaItem[]
  userId: string
  createdAt: string
  approved?: boolean
}

const CONTRIBUTIONS = 'contributions'

export const currentUid = () => getAuth().currentUser?.uid || 'anonymous'

/** Resumable upload to contributions/<projectId>/…; `onProgress` gets 0-100. */
export function uploadFile(projectId: string, file: File, onProgress?: (percent: number) => void): Promise<MediaItem> {
  const path = `${CONTRIBUTIONS}/${projectId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`
  const task = uploadBytesResumable(storageRef(getStorage(), path), file, { contentType: file.type })
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => onProgress?.(snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0),
      reject,
      async () => resolve({
        url: await getDownloadURL(task.snapshot.ref),
        path,
        name: file.name,
        size: file.size,
        contentType: file.type,
        kind: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image',
      }),
    )
  })
}

export async function addContribution(projectId: string, payload: { comment: string, media: MediaItem[] }) {
  if (!projectId) {
    throw new Error('addContribution: projectId is required')
  }
  await addDoc(collection(getFirestore(), CONTRIBUTIONS), {
    projectId,
    comment: payload.comment,
    media: payload.media,
    userId: currentUid(),
    approved: false,
    createdAt: serverTimestamp(),
  })
}

function toContribution(id: string, data: Record<string, unknown>): Contribution {
  return {
    id,
    projectId: String(data.projectId ?? ''),
    comment: String(data.comment ?? ''),
    media: Array.isArray(data.media) ? data.media as MediaItem[] : [],
    userId: String(data.userId ?? 'anonymous'),
    approved: data.approved === true,
    createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.().toISOString() ?? '',
  }
}

const newestFirst = (a: Contribution, b: Contribution) => (b.createdAt || '').localeCompare(a.createdAt || '')

/** A project's contributions: moderators see all, the public only approved ones. */
export async function fetchContributions(projectId: string, admin: boolean): Promise<Contribution[]> {
  if (!projectId) {
    return []
  }
  const base = collection(getFirestore(), CONTRIBUTIONS)
  const q = admin
    ? query(base, where('projectId', '==', projectId))
    : query(base, where('projectId', '==', projectId), where('approved', '==', true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => toContribution(d.id, d.data())).sort(newestFirst)
}

export async function fetchPendingContributions(): Promise<Contribution[]> {
  const snapshot = await getDocs(query(collection(getFirestore(), CONTRIBUTIONS), where('approved', '==', false)))
  return snapshot.docs.map(d => toContribution(d.id, d.data())).sort(newestFirst)
}

export async function approveContribution(id: string) {
  await updateDoc(doc(getFirestore(), CONTRIBUTIONS, id), { approved: true })
}

/** Storage files first (best effort), then the document. */
export async function deleteContribution(contribution: Contribution) {
  for (const m of contribution.media) {
    if (m.path) {
      await deleteObject(storageRef(getStorage(), m.path)).catch(e => console.warn('Could not delete media file:', m.path, e))
    }
  }
  await deleteDoc(doc(getFirestore(), CONTRIBUTIONS, contribution.id!))
}
