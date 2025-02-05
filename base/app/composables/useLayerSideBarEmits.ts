import type { HeatMapLayerSettings } from '@components/GeoSpatialLayer/HeatMap.vue'
import type { LayerSidebarEmits } from '@components/GeoSpatialLayer/LayerSidebar.vue'

export function useLayerSidebarEmits(emit: LayerSidebarEmits) {
  const updateSelection = (layerSettings: Record<string, HeatMapLayerSettings>) => {
    Object.entries(layerSettings).forEach(([key, settings]) => {
      emit('updateSelection', key, settings)
    })
  }

  const updateFilter = (key: string) => {
    emit('updateFilter', key)
  }

  const updateFilterTime = (timeRange: { start: Date, end: Date }) => {
    emit('updateFilterTime', timeRange)
  }

  return {
    updateSelection,
    updateFilter,
    updateFilterTime,
  }
}
