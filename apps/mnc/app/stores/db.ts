import { addDoc, collection, getFirestore } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useFeatureStore } from '@base/stores/features'
import { useUserStore } from '@base/stores/user'
import type { ProjectData } from "./types/store"



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
      // Import the mncData.json file
      const mncData = await import('../../content/mncData.json')
      const data = mncData.default || mncData

      // Loop through each entry and create features
      data.forEach((entry: any) => {
        const lon = parseFloat(entry.Longitude)
        const lat = parseFloat(entry.Latitude)
        
        // Create a new feature
        addFeature({
          type: 'Point',
          iconName: 'heart',
          coordinates: [lon, lat],
          comment: entry.Title || '',
          timestamp: new Date().toISOString(),
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
