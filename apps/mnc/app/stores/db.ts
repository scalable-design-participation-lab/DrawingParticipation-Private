import { addDoc, collection, getFirestore } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { fromLonLat } from 'ol/proj'
import { useFeatureStore } from '@base/stores/features'
import { useUserStore } from '@base/stores/user'
import { Properties } from "./types/store"
import type { ProjectData } from "./types/store"
// Structured citations (label + URL) per project, keyed by string_id.
import mncLinks from '../../content/mncLinks.json'
// All photo paths per project (for the detail-view carousel), keyed by string_id.
import mncPhotos from '../../content/mncPhotos.json'



/**
 * Pinia store for managing and saving user and feature data to Firestore.
 */
export const useDb = defineStore('db', () => {
  const { currentUser, userData } = useUserStore()
  const { features, addFeature } = useFeatureStore()

  /**
   * Loads feature data into state.
   */

  async function loadDataIntoFeatures(): Promise<void> {
    try {
      // Clear any previously loaded features so repeated invocations
      // (HMR, remounts, navigation) don't stack duplicate pins on the map.
      features.splice(0, features.length)

      // Import the mncData.json file
      const mncData = await import('../../content/mncData.json')
      const data = mncData.default || mncData

      // Loop through each entry and create features
      data.forEach((entry: any) => {
        const lon = parseFloat(entry.Longitude)
        const lat = parseFloat(entry.Latitude)

        // Convert from EPSG:4326 (lat/lon) to EPSG:3857 (Web Mercator)
        const coordinates = fromLonLat([lon, lat], 'EPSG:3857') as [number, number]

        addFeature({
          type: 'Point',
          iconName: entry["Primary Tag"] === 'Health & Crisis Response' ||
                    entry["Primary Tag"] === 'Transportation & Mobility' ||
                    entry["Primary Tag"] === 'Digital Access & Connectivity' ||
                    entry["Primary Tag"] === 'Community Mapping & Visibility' ||
                    entry["Primary Tag"] === 'Art & Cultural Expression'
                    ? entry["Primary Tag"] : 'heart',
          coordinates,
          comment: entry.Title || '',
          timestamp: new Date().toISOString(),
          properties: new Properties(
            entry.Location,
            String(entry.Date),
            entry["Short Description"],
            entry.Description,
            entry["Connection to Mobile Networked Creativity"],
            entry["Media Captions"],
            entry.Links,
            entry["Primary Tag"],
            entry["Secondary Tags"],
            entry.string_id,
            (mncLinks as Record<string, { label: string, url: string }[]>)[entry.string_id] || [],
            (mncPhotos as Record<string, string[]>)[entry.string_id] || []
          )
        })
      })

      console.log(`Loaded ${data.length} features from mncData.json`)
    }
    catch (error) {
      console.error('Error loading data into features:', error)
      throw error
    }
  }

  /**
   * Saves user and feature data to the Firestore database.
   * @async
   * @throws Will throw an error if saving to Firestore fails.
   */
  async function saveDataToDatabase(): Promise<void> {
    const db = getFirestore()
    const projectsCollection = collection(db, 'projects')

    const userId = currentUser || 'anonymous'
    const timestamp = new Date().toISOString()

    // Initialize project data structure
    const projectData: ProjectData = {
      userId,
      name: userData.value
        ? {
            lastname: userData.value.lastname,
            firstname: userData.value.firstname,
          }
        : null,
      timestamp,
      space: {
        everyday: [],
        everyweek: [],
        sometimes: [],
        once: [],
        never: [],
        recreational: [],
        restricted: [],
        prohibit: [],
      },
      belonging: {
        negative: [],
        love: [],
        positive: [],
      },
      safety: {
        safe: [],
        unsafe: [],
        great: [],
      },
      environment: {
        'pollution': [],
        'flora-fauna': [],
        'trash': [],
      },
    }

    // Process features and populate project data
    features.forEach((feature) => {
      if (feature.type === 'Point' && feature.frequency) {
        const frequencyKey = getFrequencyKey(feature.frequency)
        projectData.space[frequencyKey].push({
          lat: (feature.coordinates as [number, number])[1],
          lon: (feature.coordinates as [number, number])[0],
          timestamp: feature.timestamp || timestamp,
          comment: feature.comment || '',
        })
      }
      else if (feature.type === 'Polygon') {
        projectData.space.recreational.push({
          geometry: JSON.stringify(feature.coordinates),
          timestamp: feature.timestamp || timestamp,
          comment: feature.comment || '',
        })
      }
      else if (feature.type === 'LineString') {
        projectData.space.restricted.push({
          geometry: JSON.stringify(feature.coordinates),
          timestamp: feature.timestamp || timestamp,
          comment: feature.comment || '',
        })
      }
      if (feature.type === 'Point' && feature.isProhibit) {
        projectData.space.prohibit.push({
          lat: (feature.coordinates as [number, number])[1],
          lon: (feature.coordinates as [number, number])[0],
          timestamp: feature.timestamp || timestamp,
          comment: feature.comment || '',
        })
      }
    })

    features.forEach((feature) => {
      if (feature.type === 'Point' && feature.iconName) {
        const belongingKey = getBelongingKey(feature.iconName)
        if (belongingKey) {
          projectData.belonging[belongingKey].push({
            lat: (feature.coordinates as [number, number])[1],
            lon: (feature.coordinates as [number, number])[0],
            timestamp: feature.timestamp || timestamp,
            comment: feature.comment || '',
          })
        }
      }
    })

    features.forEach((feature) => {
      if (feature.type === 'Point' && feature.iconName) {
        const safetyKey = getSafetyKey(feature.iconName)
        if (safetyKey) {
          projectData.safety[safetyKey].push({
            lat: (feature.coordinates as [number, number])[1],
            lon: (feature.coordinates as [number, number])[0],
            timestamp: feature.timestamp || timestamp,
            comment: feature.comment || '',
          })
        }
      }
    })

    features.forEach((feature) => {
      if (feature.type === 'Point' && feature.iconName) {
        const environmentKey = getEnvironmentKey(feature.iconName)
        if (environmentKey) {
          projectData.environment[environmentKey].push({
            lat: (feature.coordinates as [number, number])[1],
            lon: (feature.coordinates as [number, number])[0],
            timestamp: feature.timestamp || timestamp,
            comment: feature.comment || '',
          })
        }
      }
    })

    try {
      await addDoc(projectsCollection, projectData)
      console.log('Data saved to database successfully')
    }
    catch (error) {
      console.error('Error saving data to database:', error)
      throw error
    }
  }

  return {
    saveDataToDatabase,
    loadDataIntoFeatures,
  }
})

/**
 * Maps frequency strings to their corresponding keys.
 * @param frequency The frequency of the feature (e.g., "every day").
 * @returns A key representing the frequency category.
 */
function getFrequencyKey(frequency: string): keyof ProjectData['space'] {
  const frequencyMap = {
    'every day': 'everyday',
    'every week': 'everyweek',
    'sometimes': 'sometimes',
    'only once': 'once',
    'never': 'never',
  }
  return frequencyMap[frequency] || 'sometimes'
}

/**
 * Maps an icon name to a belonging category key.
 * @param iconName The icon name (e.g., "heart").
 * @returns The belonging category key.
 */
function getBelongingKey(iconName: string): keyof ProjectData['belonging'] | undefined {
  const belongingMap = {
    dislike: 'negative',
    heart: 'love',
    smile: 'positive',
  }
  return belongingMap[iconName]
}

/**
 * Maps an icon name to a safety category key.
 * @param iconName The icon name (e.g., "calm").
 * @returns The safety category key.
 */
function getSafetyKey(iconName: string): keyof ProjectData['safety'] | undefined {
  const safetyMap = {
    broken: 'unsafe',
    calm: 'safe',
    lock: 'great',
  }
  return safetyMap[iconName]
}

/**
 * Maps an icon name to an environment category key.
 * @param iconName The icon name (e.g., "leaf").
 * @returns The environment category key.
 */
function getEnvironmentKey(iconName: string): keyof ProjectData['environment'] | undefined {
  const environmentMap = {
    pollution: 'pollution',
    trash: 'trash',
    leaf: 'flora-fauna',
  }
  return environmentMap[iconName]
}
