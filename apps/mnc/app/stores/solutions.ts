import { addDoc, collection, getDocs, getFirestore, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fromLonLat, toLonLat } from 'ol/proj'
import { useFeatureStore } from '@base/stores/features'
import { Properties } from './types/store'

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
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

/**
 * Pinia store for user-submitted "solutions" (new case-study pins). A new
 * solution is shown on the map immediately (added to the shared feature store)
 * and persisted to Firestore on a best-effort basis.
 */
export const useSolutionsStore = defineStore('solutions', () => {
  const { addFeature } = useFeatureStore()

  // True while the user is in "click the map to place your pin" mode.
  const isPlacing = ref(false)
  function startPlacing() {
    isPlacing.value = true
  }
  function cancelPlacing() {
    isPlacing.value = false
  }

  // Adds a solution to the shared feature store so it renders like a curated
  // pin (MncMapLayer keys off properties.primaryTag / string_id).
  function addSolutionFeature(s: {
    string_id: string
    title: string
    shortDesc: string
    description: string
    primaryTag: string
    location: string
    coordinate: [number, number]
  }) {
    addFeature({
      type: 'Point',
      // MncMapLayer keys off properties.primaryTag; iconName isn't in the base
      // IconType union for MNC themes, so cast to satisfy the Feature type.
      iconName: s.primaryTag as any,
      coordinates: s.coordinate,
      comment: s.title,
      timestamp: new Date().toISOString(),
      properties: new Properties(
        s.location,
        '',
        s.shortDesc,
        s.description,
        '',
        undefined,
        undefined,
        s.primaryTag,
        undefined,
        s.string_id,
        [],
        [],
      ),
    })
  }

  /** Create a new solution: show it now, then try to persist it. */
  async function addSolution(input: SolutionInput): Promise<void> {
    const string_id = `user_${slugify(input.title)}_${Math.floor(Math.random() * 100000)}`
    const [lon, lat] = toLonLat(input.coordinate)

    addSolutionFeature({
      string_id,
      title: input.title,
      shortDesc: input.shortDesc,
      description: input.description,
      primaryTag: input.primaryTag,
      location: input.location,
      coordinate: input.coordinate,
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
        lon,
        lat,
        userId: getAuth().currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
      })
    }
    catch (err) {
      console.warn('Could not persist solution (shown locally only):', err)
    }
  }

  /** Load previously submitted solutions from Firestore onto the map. */
  async function fetchSolutions(): Promise<void> {
    try {
      const db = getFirestore()
      const snapshot = await getDocs(collection(db, COLLECTION))
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any
        if (typeof data.lon !== 'number' || typeof data.lat !== 'number')
          return
        addSolutionFeature({
          string_id: data.string_id || doc.id,
          title: data.title || 'Untitled',
          shortDesc: data.shortDesc || '',
          description: data.description || '',
          primaryTag: data.primaryTag || '',
          location: data.location || '',
          coordinate: fromLonLat([data.lon, data.lat]) as [number, number],
        })
      })
    }
    catch (err) {
      console.warn('Could not load user solutions:', err)
    }
  }

  return { isPlacing, startPlacing, cancelPlacing, addSolution, fetchSolutions }
})
