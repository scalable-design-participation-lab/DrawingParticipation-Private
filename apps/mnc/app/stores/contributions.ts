import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { deleteObject, getDownloadURL, getStorage, ref as storageRef, uploadBytesResumable } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { Contribution, MediaItem } from './types/contribution'
import { useAuthStore } from './auth'

/** Firestore collection that holds every user contribution. */
const CONTRIBUTIONS_COLLECTION = 'contributions'

/**
 * Monotonic counter making every Storage path in a batch unique.
 *
 * `Date.now()` alone is not enough: a batch upload usually carries files that
 * share a name (a phone photo roll hands us `image.jpg` for every shot), and
 * two of them can finish within the same millisecond. The paths then collide,
 * the second upload overwrites the first object, and every media item ends up
 * resolving to the SAME picture — the batch looks duplicated.
 */
let uploadSeq = 0

/**
 * Pinia store that persists user-contributed media + comments for existing
 * MNC projects.
 *
 * Files are uploaded to Firebase Storage; one metadata document per submission
 * is written to the Firestore `contributions` collection, keyed by the
 * project's `string_id`.
 *
 * Firebase itself is initialized by the `nuxt-vuefire` module (see
 * apps/mnc/nuxt.config.ts), so `getFirestore()` / `getStorage()` resolve the
 * already-initialized default app — no manual `initializeApp` is needed here.
 */
export const useContributionsStore = defineStore('contributions', () => {
  /** Cache of contributions per projectId, so re-opening a project is instant. */
  const byProject = reactive<Record<string, Contribution[]>>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  /** All pending (unapproved) contributions across projects, for the moderator queue. */
  const pending = ref<Contribution[]>([])

  /**
   * Builds a collision-resistant Storage path for a file. The timestamp keeps
   * the bucket readable; the sequence number and random suffix are what make
   * the path unique for same-named files uploaded in the same millisecond.
   */
  function buildStoragePath(projectId: string, file: File): string {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    uploadSeq += 1
    const unique = `${Date.now()}-${uploadSeq}-${Math.random().toString(36).slice(2, 8)}`
    return `${CONTRIBUTIONS_COLLECTION}/${projectId}/${unique}-${safeName}`
  }

  /**
   * Uploads a single file to Firebase Storage and resolves with its media
   * metadata. `onProgress` receives 0-100 as the upload streams.
   */
  function uploadFile(
    projectId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<MediaItem> {
    const storage = getStorage()
    const path = buildStoragePath(projectId, file)
    const task = uploadBytesResumable(storageRef(storage, path), file, {
      contentType: file.type,
    })

    return new Promise<MediaItem>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const percent = snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0
          onProgress?.(percent)
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({
            url,
            path,
            name: file.name,
            size: file.size,
            contentType: file.type,
            kind: file.type.startsWith('video/')
              ? 'video'
              : file.type.startsWith('audio/')
                ? 'audio'
                : 'image',
          })
        },
      )
    })
  }

  /**
   * Writes a contribution document (uploaded media + comment) to Firestore.
   */
  async function addContribution(
    projectId: string,
    payload: { comment: string, media: MediaItem[] },
  ): Promise<void> {
    if (!projectId)
      throw new Error('addContribution: projectId is required')

    const db = getFirestore()
    // Falls back to "anonymous" until auth is wired in (see base/layers/auth).
    const userId = getAuth().currentUser?.uid || 'anonymous'

    await addDoc(collection(db, CONTRIBUTIONS_COLLECTION), {
      projectId,
      comment: payload.comment,
      media: payload.media,
      userId,
      // New contributions wait for a moderator before they go public.
      approved: false,
      // Server-side timestamp keeps ordering correct across clients.
      createdAt: serverTimestamp(),
    })
  }

  /**
   * Loads all contributions for a project, caches them in `byProject`, and
   * returns them sorted newest-first.
   *
   * Note: we filter in Firestore by `projectId` and sort client-side, which
   * avoids requiring a composite Firestore index on (projectId, createdAt).
   */
  async function fetchContributions(projectId: string): Promise<Contribution[]> {
    if (!projectId)
      return []

    isLoading.value = true
    error.value = null
    try {
      const db = getFirestore()
      const admin = useAuthStore().isAdmin
      const base = collection(db, CONTRIBUTIONS_COLLECTION)
      // Firestore list rules require the query itself to guarantee readable
      // rows, so the public must constrain to approved==true (two equality
      // filters need no composite index); moderators read all for the project.
      const q = admin
        ? query(base, where('projectId', '==', projectId))
        : query(base, where('projectId', '==', projectId), where('approved', '==', true))
      const snapshot = await getDocs(q)

      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any
        return {
          id: docSnap.id,
          projectId: data.projectId,
          comment: data.comment || '',
          media: Array.isArray(data.media) ? data.media : [],
          userId: data.userId || 'anonymous',
          approved: data.approved === true,
          // serverTimestamp resolves to a Firestore Timestamp; normalize to ISO.
          createdAt: data.createdAt?.toDate?.().toISOString?.() || '',
        } as Contribution
      })

      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      byProject[projectId] = items
      return items
    }
    catch (err: any) {
      console.error('Failed to fetch contributions:', err)
      error.value = err?.message || 'Failed to load contributions'
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /** Moderator: load every pending contribution across all projects (admin-only;
   *  the where(approved==false) query is rejected for the public by the rules). */
  async function fetchPendingContributions(): Promise<void> {
    try {
      const db = getFirestore()
      const q = query(collection(db, CONTRIBUTIONS_COLLECTION), where('approved', '==', false))
      const snap = await getDocs(q)
      pending.value = snap.docs
        .map((d) => {
          const data = d.data() as any
          return {
            id: d.id,
            projectId: data.projectId,
            comment: data.comment || '',
            media: Array.isArray(data.media) ? data.media : [],
            userId: data.userId || 'anonymous',
            approved: false,
            createdAt: data.createdAt?.toDate?.().toISOString?.() || '',
          } as Contribution
        })
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    }
    catch (e) {
      console.warn('Could not load pending contributions:', e)
    }
  }

  /** Moderator: approve a pending contribution. */
  async function approveContribution(id: string, projectId: string): Promise<void> {
    await updateDoc(doc(getFirestore(), CONTRIBUTIONS_COLLECTION, id), { approved: true })
    const c = byProject[projectId]?.find(x => x.id === id)
    if (c)
      c.approved = true
    pending.value = pending.value.filter(x => x.id !== id)
  }

  /** Moderator: delete a contribution (Firestore doc + its Storage files). */
  async function deleteContribution(contribution: Contribution): Promise<void> {
    // Remove the stored media files first (best-effort), then the document.
    for (const m of contribution.media) {
      if (m.path) {
        try {
          await deleteObject(storageRef(getStorage(), m.path))
        }
        catch (e) {
          console.warn('Could not delete media file:', m.path, e)
        }
      }
    }
    await deleteDoc(doc(getFirestore(), CONTRIBUTIONS_COLLECTION, contribution.id!))
    const list = byProject[contribution.projectId]
    if (list)
      byProject[contribution.projectId] = list.filter(x => x.id !== contribution.id)
    pending.value = pending.value.filter(x => x.id !== contribution.id)
  }

  return {
    byProject,
    pending,
    isLoading,
    error,
    uploadFile,
    addContribution,
    fetchContributions,
    fetchPendingContributions,
    approveContribution,
    deleteContribution,
  }
})
