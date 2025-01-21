import { useFirestore } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'
import type { DrawType, Feature, FrequencyType } from '@base/stores/types/store'
import type { Category } from './types/store';


export const useAllFeatureStore = defineStore('all-features',  () => {
  /**
   * List of geospatial features.
   */
  const allFeatures = reactive<Feature[]>([])

  /**
   * Map of geospatial feature by Type
   */
  const featuresByType = reactive<Record<DrawType, Feature[]>>({
    Point: [],
    LineString: [],
    Polygon: []
  })

  /**
   * Map of geospatial feature by Category
   */
  const featuresByCategory  = reactive<Record<Category,Feature[]>>({})

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
    Object.assign(featuresByType, {});
    Object.assign(featuresByCategory, {});

    const db = useFirestore()
    const projectsCollection = collection(db, 'projects')
    const querySnapshot = await getDocs(projectsCollection)

    for (const doc of querySnapshot.docs) {
      const projectData = doc.data()

      // Process space data including prohibit points
      if (Array.isArray(projectData.space.prohibit)) {
        projectData.space.prohibit.forEach((point) => {
          const feature: Feature = {
            type: 'Point',
            coordinates: [point.lon, point.lat],
            isProhibit: true,
            comment: point.comment,
            name: projectData.name,
            timestamp: point.timestamp,
          } 
          allFeatures.push(feature)
          addToMap(featuresByType, feature.type, feature)
          addToMap(featuresByCategory, 'space.prohibit', feature)
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
            const feature: Feature ={
              type: 'Point',
              coordinates: [point.lon, point.lat],
              frequency: frequency as FrequencyType,
              comment: point.comment,
              name: projectData.name,
              timestamp: point.timestamp,
            } 
            allFeatures.push(feature)
            addToMap(featuresByType, feature.type, feature)
            addToMap(featuresByCategory, `space.${frequency}`, feature)
          })
        }
      })

      // Process space.recreational data (Polygons)
      if (Array.isArray(projectData.space.recreational)) {
        projectData.space.recreational.forEach((polygon) => {
          const feature: Feature = {
            type: 'Polygon',
            coordinates: JSON.parse(polygon.geometry),
            comment: polygon.comment,
            name: projectData.name,
            timestamp: polygon.timestamp,
          }
          allFeatures.push(feature)
          addToMap(featuresByType, feature.type, feature)
          addToMap(featuresByCategory, `space.recreational`, feature)
        })
      }

      // Process space.restricted data (LineStrings)
      if (Array.isArray(projectData.space.restricted)) {
        projectData.space.restricted.forEach((lineString) => {
          const feature: Feature ={
            type: 'LineString',
            coordinates: JSON.parse(lineString.geometry),
            comment: lineString.comment,
            name: projectData.name,
            timestamp: lineString.timestamp,
          } 
          allFeatures.push(feature)
          addToMap(featuresByType, feature.type, feature)
          addToMap(featuresByCategory, `space.restricted`, feature)
        })
      }

     // Process belonging, safety, and environment data
      ['belonging', 'safety', 'environment'].forEach((category) => {
        if (projectData[category]) {
          Object.keys(projectData[category]).forEach((key) => {
            if (Array.isArray(projectData[category][key])) {
              projectData[category][key].forEach((point) => {
                const feature: Feature = {
                  id: Date.now(),
                  type: 'Point',
                  coordinates: [point.lon, point.lat],
                  iconName: key,
                  comment: point.comment,
                  name: projectData.name,
                  timestamp: point.timestamp,
                };
                allFeatures.push(feature);
                addToMap(featuresByType, feature.type, feature);
                addToMap(featuresByCategory, `${category}.${key}`, feature);
              });
            }
          });
        }
      });
    }
  }

  // Call fetchAllFeature when the store is initialized
  onMounted(() => {
    fetchAllFeature()
  })

/**
 * Helper function to categorize features as they're added
 * @param map  a Map of geospatial features
 * @param key  a key label for the store
 * @param value the value for the key 
 */
function addToMap(map: Record<string, Feature[]>, key: string, value: Feature) {
  if (!map[key]) {
    map[key] = []; // Initialize the array if it doesn't exist
  }
  map[key].push(value); // Push the value to the array
}

  return {
    allFeatures,
    addFeature,
    featuresByCategory,
    featuresByType
  }
})
