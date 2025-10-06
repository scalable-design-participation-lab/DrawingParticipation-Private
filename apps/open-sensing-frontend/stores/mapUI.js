import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

export const useMapUIStore = defineStore('mapUI', () => {
  const drawEnable = ref(true)
  const drawType = ref('Point')
  const currentFrequency = ref(null)
  const spaceSubwindow = ref(1)
  const comment = ref('')
  const features = reactive([])
  const isCommentPopupOpen = ref(false)
  const currentBelongingIcon = ref(null)
  const currentSafetyIcon = ref(null)
  const currentEnvironmentIcon = ref(null)
  const belongingSubwindow = ref(1)
  const safetySubwindow = ref(1)
  const environmentSubwindow = ref(1)

  const colors = {
    'every day': '#FF0000',
    'every week': '#00FF00',
    sometimes: '#0000FF',
    'only once': '#FFFF00',
    never: '#FF00FF',
  }

  const currentColor = computed(() => {
    if (drawType.value === 'Point') {
      return colors[currentFrequency.value] || '#000000'
    } else if (drawType.value === 'Polygon') {
      return 'black'
    } else if (drawType.value === 'LineString') {
      return 'red'
    }
    return 'black'
  })

  function activateDrawing(frequency) {
    currentFrequency.value = frequency
    drawType.value = 'Point'
    drawEnable.value = true
  }

  function handleDrawStart(event) {}

  function handleDrawEnd(event) {
    const feature = event.feature
    const geometryType = feature.getGeometry().getType()

    if (geometryType === 'Point') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'Point',
        coordinates: coordinates,
        iconName:
          currentBelongingIcon.value ||
          currentSafetyIcon.value ||
          currentEnvironmentIcon.value,
        frequency: currentFrequency.value,
        comment: '',
      })
    } else if (geometryType === 'LineString') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'LineString',
        coordinates: coordinates,
        comment: '',
      })
    } else if (geometryType === 'Polygon') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'Polygon',
        coordinates: coordinates,
        comment: '',
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
    if (currentTheme !== 'space') spaceSubwindow.value = 1
    if (currentTheme !== 'belonging') belongingSubwindow.value = 1
    if (currentTheme !== 'safety') safetySubwindow.value = 1
    if (currentTheme !== 'environment') environmentSubwindow.value = 1
  }

  function nextSpaceSubwindow() {
    if (spaceSubwindow.value < 4) {
      spaceSubwindow.value++
      resetOtherSubwindows('space')
    }
  }

  function prevSpaceSubwindow() {
    if (spaceSubwindow.value > 1) {
      spaceSubwindow.value--
      resetOtherSubwindows('space')
    }
  }

  function nextBelongingSubwindow() {
    if (belongingSubwindow.value < 2) {
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
    if (safetySubwindow.value < 2) {
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
    const feature = features.find((f) => f.id === pointId)
    if (feature) {
      feature.comment = newComment
    }
  }

  function getColorForFrequency(frequency) {
    return colors[frequency] || '#000000'
  }

  function addFeature(feature) {
    features.push({
      id: Date.now(),
      ...feature,
      comment: '',
      frequency: feature.type === 'Point' ? currentFrequency.value : null,
    })
    drawEnable.value = false
  }

  function setCommentPopupOpen(isOpen) {
    this.isCommentPopupOpen = isOpen
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
    const feature = this.features.find((f) => f.id === featureId)
    if (feature) {
      feature.images = images
    }
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
    isCommentPopupOpen,
    setCommentPopupOpen,
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
  }
})
