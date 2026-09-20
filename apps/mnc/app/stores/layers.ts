import { defineStore } from 'pinia'
import { reactive, toRefs} from 'vue'
import { layerDefinitions } from './layerRegistry'

// Define a type for the reactive props of each layer
export type LayerProps = Record<string, Ref<any>>

// State for a single layer
export interface LayerState {
  id: number
  type: keyof typeof layerDefinitions
  visible: boolean
  props: LayerProps
}

let nextId = 1

export const useLayersStore = defineStore('layers', {
  state: (): { layers: LayerState[] } => ({
    layers: []
  }),
  actions: {
    /**
     * Add a new layer of the given type, cloning its defaultProps into a reactive props object.
     */
    addLayer(type: keyof typeof layerDefinitions) {
      const def = layerDefinitions[type]
      if (!def) return

      const reactiveProps = toRefs(reactive({ ...def.defaultProps })) as LayerProps

      this.layers.push({
        id: nextId++,
        type,
        visible: true,
        props: reactiveProps
      })
    },

    /**
     * Remove a layer by its ID.
     */
    removeLayer(id: number) {
      this.layers = this.layers.filter(layer => layer.id !== id)
    },

    /**
     * Toggle the visibility flag of a layer.
     */
    toggleLayerVisibility(id: number) {
      const layer = this.layers.find(l => l.id === id)
      if (layer) layer.visible = !layer.visible
    },

    /**
     * Update one or more reactive props on an existing layer.
     */
    updateLayerProps(
      id: number,
      newProps: Partial<Record<keyof typeof layerDefinitions[keyof typeof layerDefinitions]['defaultProps'], any>>
    ) {
      const layer = this.layers.find(l => l.id === id)
      if (!layer) return

      Object.entries(newProps).forEach(([key, value]) => {
        const propRef = layer.props[key]
        if (propRef) {
          propRef.value = value
        }
      })
    }
  }
})
