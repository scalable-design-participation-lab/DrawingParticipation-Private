import { useFirestore, useCollection } from 'vuefire'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { useUserStore } from './user';
import { useFeatureStore } from './features';
function getBelongingKey(iconName) {
    const belongingMap = {
        dislike: 'negative',
        heart: 'love',
        smile: 'positive',
    }
    return belongingMap[iconName]
}

function getSafetyKey(iconName) {
    const safetyMap = {
        broken: 'unsafe',
        calm: 'safe',
        lock: 'great',
    }
    return safetyMap[iconName]
}

function getEnvironmentKey(iconName) {
    const environmentMap = {
        pollution: 'pollution',
        trash: 'trash',
        leaf: 'flora-fauna',
    }
    return environmentMap[iconName]
}
function getFrequencyKey(frequency) {
    const frequencyMap = {
        'every day': 'everyday',
        'every week': 'everyweek',
        sometimes: 'sometimes',
        'only once': 'once',
        never: 'never',
    }
    return frequencyMap[frequency] || 'sometimes'
}
export const useDb= defineStore("db", () => {
    const { currentUser, userData } = useUserStore();
    const { features } = useFeatureStore();

    async function saveDataToDatabase() {
        const db = getFirestore()
        const projectsCollection = collection(db, 'projects')

        const userId = currentUser.uid || 'anonymous'
        const timestamp = new Date().toISOString()

        const projectData = {
            userId: userId,
            name: userData.value
                ? {
                    lastname: userData.value.lastname,
                    firstname: userData.value.firstname,
                }
                : null,
            timestamp: timestamp,
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
                pollution: [],
                'flora-fauna': [],
                trash: [],
            },
        }

        features.forEach((feature) => {
            if (feature.type === 'Point' && feature.frequency) {
                const frequencyKey = getFrequencyKey(feature.frequency)
                projectData.space[frequencyKey].push({
                    lat: feature.coordinates[1],
                    lon: feature.coordinates[0],
                    timestamp: feature.timestamp || timestamp,
                    comment: feature.comment || '',
                })
            } else if (feature.type === 'Polygon') {
                projectData.space.recreational.push({
                    geometry: JSON.stringify(feature.coordinates),
                    timestamp: feature.timestamp || timestamp,
                    comment: feature.comment || '',
                })
            } else if (feature.type === 'LineString') {
                projectData.space.restricted.push({
                    geometry: JSON.stringify(feature.coordinates),
                    timestamp: feature.timestamp || timestamp,
                    comment: feature.comment || '',
                })
            }
            if (feature.type === 'Point' && feature.isProhibit) {
                projectData.space.prohibit.push({
                    lat: feature.coordinates[1],
                    lon: feature.coordinates[0],
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
                        lat: feature.coordinates[1],
                        lon: feature.coordinates[0],
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
                        lat: feature.coordinates[1],
                        lon: feature.coordinates[0],
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
                        lat: feature.coordinates[1],
                        lon: feature.coordinates[0],
                        timestamp: feature.timestamp || timestamp,
                        comment: feature.comment || '',
                    })
                }
            }
        })

        try {
            await addDoc(projectsCollection, projectData)
            console.log('Data saved to database successfully')
        } catch (error) {
            console.error('Error saving data to database:', error)
            throw error
        }
    }
    return {
        saveDataToDatabase,
    }
})