import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { useUserStore } from './user';
import { useSideBarStore } from './sidebar';

export const useDrawingStore = defineStore("drawing", () => {
  const drawEnable = ref(false);
  const drawType = ref('Point');
  const features = reactive([]);
  const isProhibitDrawing = ref(false);
  const { currentBelongingIcon, currentSafetyIcon, currentEnvironmentIcon } = useSideBarStore()
  const { currentFrequency, setFrequency } = useSideBarStore()
  const { userData } = useUserStore()

  function activateDrawing(type: string) {
    setFrequency(type)
    drawType.value = type;
    drawEnable.value = true;
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
          coordinates: coordinates,
          isProhibit: true,
          comment: '',
          name: userData.value
            ? {
              firstname: userData.value.firstname,
              lastname: userData.value.lastname,
            }
            : null,
          timestamp: timestamp,
        })
        isProhibitDrawing.value = false
      } else {
        features.push({
          id: Date.now(),
          type: 'Point',
          coordinates: coordinates,
          iconName:
            currentBelongingIcon.value ||
            currentSafetyIcon.value ||
            currentEnvironmentIcon.value,
          frequency: currentFrequency,
          comment: '',
          name: userData.value
            ? {
              firstname: userData.value.firstname,
              lastname: userData.value.lastname,
            }
            : null,
          timestamp: timestamp,
        })
      }
    } else if (geometryType === 'LineString') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'LineString',
        coordinates: coordinates,
        comment: '',
        name: userData.value
          ? {
            firstname: userData.value.firstname,
            lastname: userData.value.lastname,
          }
          : null,
        timestamp: timestamp,
      })
    } else if (geometryType === 'Polygon') {
      const coordinates = feature.getGeometry().getCoordinates()
      features.push({
        id: Date.now(),
        type: 'Polygon',
        coordinates: coordinates,
        comment: '',
        name: userData.value
          ? {
            firstname: userData.value.firstname,
            lastname: userData.value.lastname,
          }
          : null,
        timestamp: timestamp,
      })
    }

    drawEnable.value = false
    currentBelongingIcon.value = null
    currentSafetyIcon.value = null
    currentEnvironmentIcon.value = null
    setFrequency(null)
  }

  function handleDrawStart(event) {
    console.log('Drawing started', typeof event)
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
  function activatePolygonDrawing() {
    drawType.value = 'Polygon'
    drawEnable.value = true
    setFrequency(null)
  }

  function activateLineStringDrawing() {
    drawType.value = 'LineString'
    drawEnable.value = true
    setFrequency(null)
  }
  function activateProhibitDrawing() {
    drawType.value = 'Point'
    drawEnable.value = true
    isProhibitDrawing.value = true
  }

  return {
    drawEnable,
    drawType,
    features,
    isProhibitDrawing,
    activateDrawing,
    handleDrawEnd,
    handleDrawStart,
    activateBelongingDrawing,
    activateSafetyDrawing,
    activateEnvironmentDrawing,
    activatePolygonDrawing,
    activateLineStringDrawing,
    activateProhibitDrawing

  };
});