import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fromLonLat, toLonLat } from 'ol/proj'
import { useFeatureStore } from '@base/stores/features'
import { Properties } from './types/store'
import { useFilterStore } from './filter'
import { useAuthStore } from './auth'

/** Firestore collection holding user-submitted solutions (separate from the
 *  curated mncData.json catalog). */
const COLLECTION = 'userSolutions'

export interface SolutionInput {
  title: string
  shortDesc: string
  description: string
  primaryTag: string
  location: string
  coordinate: [number, number] // EPSG:3857 (map projection)
  // Optional richer fields from the "Join Our Research" flow.
  mncConnection?: string // "why is this a good example of MNC"
  date?: string
  photos?: string[] // uploaded photo URLs — the entry's own gallery
}

/** Personal contact info from the "Join Our Research" step. Stored in a
 *  separate admin-only collection — never on the public entry document. */
export interface EntryContact {
  connectInfo: boolean | null
  fullName: string
  email: string
  country: string
  city: string
}

/** A user solution as seen by a moderator (with its Firestore id + status). */
export interface ModeratedSolution {
  id: string
  string_id: string
  title: string
  primaryTag: string
  location: string
  approved: boolean
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

/**
 * Pinia store for user-submitted "solutions" (new case-study pins). New
 * submissions are shown to their author immediately but persisted as
 * unapproved; on reload only approved solutions load for the public, while
 * moderators see everything and can approve or delete.
 */
export const useSolutionsStore = defineStore('solutions', () => {
  const featureStore = useFeatureStore()
  const filterStore = useFilterStore()

  // Every user solution the current admin can moderate.
  const moderation = ref<ModeratedSolution[]>([])

  // True while the user is in "click the map to place your pin" mode.
  const isPlacing = ref(false)
  function startPlacing() {
    isPlacing.value = true
  }
  function cancelPlacing() {
    isPlacing.value = false
  }

  // Adds a solution to the shared feature store so it renders like a curated
  // pin (MncMapLayer keys off properties.primaryTag / string_id). De-duped
  // against the CURRENT feature list (not a separate cache) so it stays correct
  // after loadDataIntoFeatures() clears the store on re-init.
  function addSolutionFeature(s: {
    string_id: string
    title: string
    shortDesc: string
    description: string
    primaryTag: string
    location: string
    coordinate: [number, number]
    approved?: boolean
    mncConnection?: string
    date?: string
    photos?: string[]
  }) {
    if (features.some(f => (f.properties as any)?.string_id === s.string_id))
      return
    const properties = new Properties(
      s.location,
      s.date || '',
      s.shortDesc,
      s.description,
      s.mncConnection || '',
      undefined,
      undefined,
      s.primaryTag,
      undefined,
      s.string_id,
      [],
      s.photos || [],
    )
    // Mark pins that are still awaiting approval so the map can distinguish them.
    properties.pending = s.approved === false
    addFeature({
      type: 'Point',
      iconName: s.primaryTag as any,
      coordinates: s.coordinate,
      comment: s.title,
      timestamp: new Date().toISOString(),
      properties,
    })
  }
  const { addFeature, features } = featureStore

  /** Create a new solution: show it now, then try to persist it (as pending).
   *  Returns the generated string_id so the caller can attach uploaded media. */
  async function addSolution(input: SolutionInput): Promise<string> {
    const string_id = `user_${slugify(input.title)}_${Math.floor(Math.random() * 100000)}`
    const [lon, lat] = toLonLat(input.coordinate)

    // A user-created theme isn't in the default visible set, so make sure it is
    // shown — otherwise the new pin would be filtered straight back off the map.
    filterStore.ensureTagVisible(input.primaryTag)

    addSolutionFeature({
      string_id,
      title: input.title,
      shortDesc: input.shortDesc,
      description: input.description,
      primaryTag: input.primaryTag,
      location: input.location,
      coordinate: input.coordinate,
      approved: false,
      mncConnection: input.mncConnection,
      date: input.date,
      photos: input.photos,
    })
    isPlacing.value = false

    try {
      const db = getFirestore()
      await addDoc(collection(db, COLLECTION), {
        string_id,
        title: input.title,
        shortDesc: input.shortDesc,
        description: input.description,
        primaryTag: input.primaryTag,
        location: input.location,
        // Optional richer fields (empty when added via the quick desktop form).
        mncConnection: input.mncConnection || '',
        date: input.date || '',
        photos: input.photos || [],
        lon,
        lat,
        userId: getAuth().currentUser?.uid || 'anonymous',
        // New submissions wait for a moderator before they go public.
        approved: false,
        createdAt: serverTimestamp(),
      })
    }
    catch (err) {
      console.warn('Could not persist solution (shown locally only):', err)
    }

    return string_id
  }

  /** Persist the optional personal contact info for an entry to an admin-only
   *  collection (never on the public entry doc). Best-effort. */
  async function addEntryContact(stringId: string, contact: EntryContact): Promise<void> {
    // Nothing worth storing if the person stayed anonymous with no details.
    if (!contact.email && !contact.fullName)
      return
    try {
      await addDoc(collection(getFirestore(), 'entryContacts'), {
        entryStringId: stringId,
        connectInfo: contact.connectInfo,
        fullName: contact.fullName,
        email: contact.email,
        country: contact.country,
        city: contact.city,
        userId: getAuth().currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
      })
    }
    catch (err) {
      console.warn('Could not persist entry contact:', err)
    }
  }

  /** Load solutions from Firestore onto the map. The public sees only approved
   *  ones; a signed-in admin sees everything and can moderate. */
  async function fetchSolutions(): Promise<void> {
    const authStore = useAuthStore()
    const admin = authStore.isAdmin
    try {
      const db = getFirestore()
      const col = collection(db, COLLECTION)
      const snapshot = await getDocs(admin ? col : query(col, where('approved', '==', true)))
      moderation.value = []
      snapshot.docs.forEach((d) => {
        const data = d.data() as any
        if (typeof data.lon !== 'number' || typeof data.lat !== 'number')
          return
        const approved = data.approved === true
        if (admin) {
          moderation.value.push({
            id: d.id,
            string_id: data.string_id || d.id,
            title: data.title || 'Untitled',
            primaryTag: data.primaryTag || '',
            location: data.location || '',
            approved,
          })
        }
        // Public: only approved reach here (query already filtered). Admin: show
        // all, including pending, so they can review them on the map.
        addSolutionFeature({
          string_id: data.string_id || d.id,
          title: data.title || 'Untitled',
          shortDesc: data.shortDesc || '',
          description: data.description || '',
          primaryTag: data.primaryTag || '',
          location: data.location || '',
          coordinate: fromLonLat([data.lon, data.lat]) as [number, number],
          approved,
          mncConnection: data.mncConnection || '',
          date: data.date || '',
          photos: Array.isArray(data.photos) ? data.photos : [],
        })
      })
    }
    catch (err) {
      console.warn('Could not load user solutions:', err)
    }
  }

  /** Moderator: approve a pending solution so it becomes public. */
  async function approveSolution(id: string): Promise<void> {
    await updateDoc(doc(getFirestore(), COLLECTION, id), { approved: true })
    const m = moderation.value.find(x => x.id === id)
    if (m) {
      m.approved = true
      // Clear the map pin's pending marker so it stops showing as "under review".
      const f = features.find(x => (x.properties as any)?.string_id === m.string_id)
      if (f)
        (f.properties as any).pending = false
    }
  }

  /** Moderator: delete a solution and remove its pin from the map. */
  async function deleteSolution(id: string, string_id: string): Promise<void> {
    await deleteDoc(doc(getFirestore(), COLLECTION, id))
    moderation.value = moderation.value.filter(x => x.id !== id)
    const idx = features.findIndex(f => (f.properties as any)?.string_id === string_id)
    if (idx !== -1)
      features.splice(idx, 1)
  }

  return {
    isPlacing,
    moderation,
    startPlacing,
    cancelPlacing,
    addSolution,
    addEntryContact,
    fetchSolutions,
    approveSolution,
    deleteSolution,
  }
})
