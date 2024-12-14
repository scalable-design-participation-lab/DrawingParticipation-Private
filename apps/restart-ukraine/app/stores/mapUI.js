import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
// import { useFirebaseAuth } from 'vuefire'
// import { signOut } from 'firebase/auth'
import { useCollection, useFirestore } from 'vuefire'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'

export const useMapUIStore = defineStore('mapUI', () => {
  const drawEnable = ref(false)
  const drawType = ref('Point')
  const currentFrequency = ref(null)
  const spaceSubwindow = ref(1)
  const comment = ref('')
  const features = reactive([])
  const isCommentModalOpen = ref(false)
  const currentBelongingIcon = ref(null)
  const currentSafetyIcon = ref(null)
  const currentEnvironmentIcon = ref(null)
  const belongingSubwindow = ref(1)
  const safetySubwindow = ref(1)
  const environmentSubwindow = ref(1)
  const showRegistration = ref(true)
  const userData = ref(null)
  // const auth = useFirebaseAuth()
  const currentUser = ref(null)
  const isProhibitDrawing = ref(false)

  const colors = {
    'every day': '#0000FF', // Blue
    'every week': '#00FF00', // Green
    'sometimes': '#800080', // Purple
    'only once': '#B2FB4C', // Yellow
    'never': '#FF0000', // Red
  }

  const mapType = ref('vector')
  const setMapType = (type) => {
    mapType.value = type
  }

  const currentColor = computed(() => {
    if (drawType.value === 'Point') {
      return colors[currentFrequency.value] || '#000000'
    }
    else if (drawType.value === 'Polygon') {
      return 'black'
    }
    else if (drawType.value === 'LineString') {
      return 'red'
    }
    return 'black'
  })

  const db = useFirestore()
  const projectsCollection = useCollection(collection(db, 'projects'))

  function activateDrawing(frequency) {
    currentFrequency.value = frequency
    drawType.value = 'Point'
    drawEnable.value = true
  }

  function handleDrawStart(event) {
    console.log('Draw started:', event)
  }

  function handleDrawEnd(event) {
    const feature = event.feature
    const geometryType = feature.getGeometry().getType()
    const timestamp = new Date().toISOString()

    if (geometryType === 'Point') {
      const coordinates = feature.getGeometry().getCoordinates()

      if (isProhibitDrawing.value) {
        features.push({
          id: Date.now(),
          type: 'Point',
          coordinates,
          isProhibit: true,
          comment: '',
          name: userData.value
            ? {
                firstname: userData.value.firstname,
                lastname: userData.value.lastname,
              }
            : null,
          timestamp,
        })
        isProhibitDrawing.value = false
      }
      else {
        features.push({
          id: Date.now(),
          type: 'Point',
          coordinates,
          iconName:
            currentBelongingIcon.value
            || currentSafetyIcon.value
            || currentEnvironmentIcon.value,
          frequency: currentFrequency.value,
          comment: '',
          name: userData.value
            ? {
                firstname: userData.value.firstname,
                lastname: userData.value.lastname,
              }
            : null,
          timestamp,
        })
      }
    }
    else if (geometryType === 'LineString') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'LineString',
        coordinates,
        comment: '',
        name: userData.value
          ? {
              firstname: userData.value.firstname,
              lastname: userData.value.lastname,
            }
          : null,
        timestamp,
      })
    }
    else if (geometryType === 'Polygon') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'Polygon',
        coordinates,
        comment: '',
        name: userData.value
          ? {
              firstname: userData.value.firstname,
              lastname: userData.value.lastname,
            }
          : null,
        timestamp,
      })
    }

    drawEnable.value = false
    currentBelongingIcon.value = null
    currentSafetyIcon.value = null
    currentEnvironmentIcon.value = null
    currentFrequency.value = null
  }

  function activatePolygonDrawing() {
    drawType.value = 'Polygon'
    drawEnable.value = true
    currentFrequency.value = null
  }

  function activateLineStringDrawing() {
    drawType.value = 'LineString'
    drawEnable.value = true
    currentFrequency.value = null
  }

  function resetOtherSubwindows(currentTheme) {
    if (currentTheme !== 'space')
      spaceSubwindow.value = 1
    if (currentTheme !== 'belonging')
      belongingSubwindow.value = 1
    if (currentTheme !== 'safety')
      safetySubwindow.value = 1
    if (currentTheme !== 'environment')
      environmentSubwindow.value = 1
  }

  function nextSpaceSubwindow() {
    if (spaceSubwindow.value < 4) {
      spaceSubwindow.value++
      resetOtherSubwindows('space')
      console.log('Current space subwindow:', spaceSubwindow.value)
    }
  }

  function prevSpaceSubwindow() {
    if (spaceSubwindow.value > 1) {
      spaceSubwindow.value--
      resetOtherSubwindows('space')
    }
  }

  function nextBelongingSubwindow() {
    if (belongingSubwindow.value < 1) {
      belongingSubwindow.value++
      resetOtherSubwindows('belonging')
    }
  }

  function prevBelongingSubwindow() {
    if (belongingSubwindow.value > 1) {
      belongingSubwindow.value--
      resetOtherSubwindows('belonging')
    }
  }

  function nextSafetySubwindow() {
    if (safetySubwindow.value < 1) {
      safetySubwindow.value++
      resetOtherSubwindows('safety')
    }
  }

  function prevSafetySubwindow() {
    if (safetySubwindow.value > 1) {
      safetySubwindow.value--
      resetOtherSubwindows('safety')
    }
  }

  function nextEnvironmentSubwindow() {
    if (environmentSubwindow.value < 2) {
      environmentSubwindow.value++
      resetOtherSubwindows('environment')
    }
  }

  function prevEnvironmentSubwindow() {
    if (environmentSubwindow.value > 1) {
      environmentSubwindow.value--
      resetOtherSubwindows('environment')
    }
  }

  function addComment(pointId, newComment) {
    const feature = features.find(f => f.id === pointId)
    if (feature) {
      feature.comment = newComment
    }
    console.log('Comment added:', newComment)
  }

  function getColorForFrequency(frequency) {
    return colors[frequency] || '#000000'
  }

  function addFeature(feature) {
    features.push({
      id: Date.now(),
      ...feature,
      comment: feature.comment || '',
      frequency: feature.frequency || null,
      name: feature.name || null,
      timestamp: feature.timestamp || new Date().toISOString(),
    })
    drawEnable.value = false
  }

  function setCommentModalOpen(isOpen) {
    this.isCommentModalOpen = isOpen
  }

  function activateBelongingDrawing(iconName) {
    currentBelongingIcon.value = iconName
    drawType.value = 'Point'
    drawEnable.value = true
  }

  function activateSafetyDrawing(iconName) {
    currentSafetyIcon.value = iconName
    drawType.value = 'Point'
    drawEnable.value = true
  }

  function activateEnvironmentDrawing(iconName) {
    currentEnvironmentIcon.value = iconName
    drawType.value = 'Point'
    drawEnable.value = true
  }

  function updateFeatureImages(featureId, images) {
    const feature = this.features.find(f => f.id === featureId)
    if (feature) {
      feature.images = images
    }
  }

  function setUserData(data) {
    userData.value = data
    currentUser.value = data.userId
    showRegistration.value = false
  }

  async function logoutUser() {
    try {
      // await signOut(auth)
      currentUser.value = null
      userData.value = null
      showRegistration.value = true
    }
    catch (error) {
      console.error('Error signing out:', error)
    }
  }

  async function saveDataToDatabase() {
    const db = getFirestore()
    const projectsCollection = collection(db, 'projects')

    const userId = currentUser.value?.uid || 'anonymous'
    const timestamp = new Date().toISOString()

    const projectData = {
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

    features.forEach((feature) => {
      if (feature.type === 'Point' && feature.frequency) {
        const frequencyKey = getFrequencyKey(feature.frequency)
        projectData.space[frequencyKey].push({
          lat: feature.coordinates[1],
          lon: feature.coordinates[0],
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
    }
    catch (error) {
      console.error('Error saving data to database:', error)
      throw error
    }
  }

  function getFrequencyKey(frequency) {
    const frequencyMap = {
      'every day': 'everyday',
      'every week': 'everyweek',
      'sometimes': 'sometimes',
      'only once': 'once',
      'never': 'never',
    }
    return frequencyMap[frequency] || 'sometimes'
  }

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

  function resetAllSubwindows() {
    spaceSubwindow.value = 1
    belongingSubwindow.value = 1
    safetySubwindow.value = 1
    environmentSubwindow.value = 1
  }

  function getComment(pointId) {
    const feature = features.find(f => f.id === pointId)
    return feature?.comment || ''
  }

  function deleteFeature(featureId) {
    const index = features.findIndex(f => f.id === featureId)
    if (index !== -1) {
      features.splice(index, 1)
    }
  }

  function activateProhibitDrawing() {
    drawType.value = 'Point'
    drawEnable.value = true
    isProhibitDrawing.value = true
  }

  return {
    drawEnable,
    drawType,
    currentFrequency,
    spaceSubwindow,
    comment,
    features,
    currentColor,
    activateDrawing,
    handleDrawStart,
    handleDrawEnd,
    activatePolygonDrawing,
    activateLineStringDrawing,
    nextSpaceSubwindow,
    prevSpaceSubwindow,
    nextBelongingSubwindow,
    prevBelongingSubwindow,
    nextSafetySubwindow,
    prevSafetySubwindow,
    nextEnvironmentSubwindow,
    prevEnvironmentSubwindow,
    addComment,
    getColorForFrequency,
    addFeature,
    isCommentModalOpen,
    setCommentModalOpen,
    currentBelongingIcon,
    activateBelongingDrawing,
    currentSafetyIcon,
    activateSafetyDrawing,
    currentEnvironmentIcon,
    activateEnvironmentDrawing,
    updateFeatureImages,
    belongingSubwindow,
    safetySubwindow,
    environmentSubwindow,
    showRegistration,
    userData,
    setUserData,
    currentUser,
    logoutUser,
    saveDataToDatabase,
    resetAllSubwindows,
    getComment,
    mapType,
    setMapType,
    deleteFeature,
    isProhibitDrawing,
    activateProhibitDrawing,
  }
})
