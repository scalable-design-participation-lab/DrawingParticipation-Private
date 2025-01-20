import { useFirestore } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'
import type { Feature } from '@base/stores/types/store'

export const useAllFeatureStore = defineStore('all-features',  () => {
  /**
   * List of geospatial features.
   */
  const allFeatures = reactive<Feature[]>([])
  /**
   * adds a new feature to the store.
   *
   * @param feature - the feature object to add.
   */
  function addFeature(feature: Omit<Feature, 'id'>): void {
    allFeatures.push({
      id: Date.now(),
      ...feature,
    })
  }

  /**
   * Fetches all feature data from the Firestore database and populates the `allFeatures` array.
   * 
   * This function queries the Firestore collection `projects` and processes the data within it
   * to extract and categorize geospatial features. Features are added to the `allFeatures` array
   * based on their type (e.g., Point, Polygon, LineString) and associated metadata.
   *
   * ### Features Processed:
   * - `space.prohibit`: Points representing prohibited areas.
   * - Other `space` frequencies (excluding `prohibit`, `recreational`, `restricted`): Points categorized by frequency.
   * - `space.recreational`: Polygons representing recreational areas.
   * - `space.restricted`: LineStrings representing restricted areas.
   * - `belonging`: Points associated with specific belongings.
   * - `safety`: Points related to safety data.
   * - `environment`: Points related to environmental data.
   *
   * ### Note:
   * - This function clears the existing `allFeatures` array before adding new data.
   *
   * @returns {Promise<void>} A promise that resolves once all features are fetched and processed.
   */
  async function fetchAllFeature(): Promise<void> {
    allFeatures.length = 0 // clear the array
    const db = useFirestore()
    const projectsCollection = collection(db, 'projects')
    const querySnapshot = await getDocs(projectsCollection)

    for (const doc of querySnapshot.docs) {
      const projectData = doc.data()

      // Process space data including prohibit points
      if (Array.isArray(projectData.space.prohibit)) {
        projectData.space.prohibit.forEach((point) => {
          allFeatures.push({
            type: 'Point',
            coordinates: [point.lon, point.lat],
            isProhibit: true,
            comment: point.comment,
            name: projectData.name,
            timestamp: point.timestamp,
          })
        })
      }

      // Process other space data (excluding prohibit)
      Object.keys(projectData.space).forEach((frequency) => {
        if (
          Array.isArray(projectData.space[frequency]) &&
          frequency !== 'prohibit' &&
          frequency !== 'recreational' &&
          frequency !== 'restricted'
        ) {
          projectData.space[frequency].forEach((point) => {
            allFeatures.push({
              type: 'Point',
              coordinates: [point.lon, point.lat],
              frequency: frequency,
              comment: point.comment,
              name: projectData.name,
              timestamp: point.timestamp,
            })
          })
        }
      })

      // Process space.recreational data (Polygons)
      if (Array.isArray(projectData.space.recreational)) {
        projectData.space.recreational.forEach((polygon) => {
          allFeatures.push({
            type: 'Polygon',
            coordinates: JSON.parse(polygon.geometry),
            comment: polygon.comment,
            name: projectData.name,
            timestamp: polygon.timestamp,
          })
        })
      }

      // Process space.restricted data (LineStrings)
      if (Array.isArray(projectData.space.restricted)) {
        projectData.space.restricted.forEach((lineString) => {
          allFeatures.push({
            type: 'LineString',
            coordinates: JSON.parse(lineString.geometry),
            comment: lineString.comment,
            name: projectData.name,
            timestamp: lineString.timestamp,
          })
        })
      }

      // Process belonging data
      Object.keys(projectData.belonging).forEach((key) => {
        if (Array.isArray(projectData.belonging[key])) {
          projectData.belonging[key].forEach((point) => {
            allFeatures.push({
              type: 'Point',
              coordinates: [point.lon, point.lat],
              iconName: key,
              comment: point.comment,
              name: projectData.name,
              timestamp: point.timestamp,
            })
          })
        }
      })

      // Process safety data
      Object.keys(projectData.safety).forEach((key) => {
        if (Array.isArray(projectData.safety[key])) {
          projectData.safety[key].forEach((point) => {
            allFeatures.push({
              type: 'Point',
              coordinates: [point.lon, point.lat],
              iconName: key,
              comment: point.comment,
              name: projectData.name,
              timestamp: point.timestamp,
            })
          })
        }
      })

      // Process environment data
      Object.keys(projectData.environment).forEach((key) => {
        if (Array.isArray(projectData.environment[key])) {
          projectData.environment[key].forEach((point) => {
            allFeatures.push({
              type: 'Point',
              coordinates: [point.lon, point.lat],
              iconName: key,
              comment: point.comment,
              name: projectData.name,
              timestamp: point.timestamp,
            })
          })
        }
      })
    }
  }

  // Call fetchAllFeature when the store is initialized
  onMounted(() => {
    fetchAllFeature()
  })

  return {
    allFeatures,
    addFeature,
  }
})
