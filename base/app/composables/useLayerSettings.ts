import { computed, reactive, ref } from 'vue'

function getRandomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
}

export interface LayerSettings {
  weight: number
  blur: number
  radius: number
  opacity: number
  gradient: string[]
  visible: boolean
  zIndex: number
}

export function useLayerSettings(layerSettings: Ref<Record<string, LayerSettings>>) {
  const highlightedButtons = reactive(new Set<string>())
  const currentZIndex = ref(1)

  function toggleLayer(button: string, section: string) {
    const key = `${section}.${button}`
    if (highlightedButtons.has(button)) {
      highlightedButtons.delete(button)
      if (layerSettings.value[key]) {
        layerSettings.value[key].visible = false
        layerSettings.value[key].zIndex = 0
      }
    }
    else {
      highlightedButtons.add(button)
      if (!layerSettings.value[key]) {
        layerSettings.value[key] = {
          weight: 1,
          blur: 20,
          radius: 20,
          opacity: 0.8,
          gradient: [
            getRandomHexColor(),
            '#0ff',
            '#0f0',
            '#ff0',
            getRandomHexColor(),
          ],
          visible: true,
          zIndex: currentZIndex.value,
        }
        currentZIndex.value += 1
      }
      else {
        layerSettings.value[key].visible = true
        layerSettings.value[key].zIndex = currentZIndex.value
      }
    }
  }

  // Sort and update layer order
  const sortedSettings = computed({
    get: () =>
      Object.entries(layerSettings.value)
        .filter(([_, settings]) => settings.visible)
        .map(([key, settings]) => {
          const [section, button] = key.split('.')
          return { key: button, section, ...settings }
        })
        .sort((a, b) => b.zIndex - a.zIndex),
    set: (newOrder) => {
      newOrder.forEach((item, index) => {
        layerSettings.value[`${item.section}.${item.key}`].zIndex = newOrder.length - index
      })
    },
  })

  function updateGradient(section: string, button: string, index: number, color: string) {
    const key = `${section}.${button}`
    if (layerSettings.value[key]) {
      // Create a new array to trigger reactivity
      layerSettings.value[key].gradient = [...layerSettings.value[key].gradient]
      layerSettings.value[key].gradient[index] = color
    }
  }

  return {
    highlightedButtons,
    sortedSettings,
    toggleLayer,
    updateGradient,
  }
}
