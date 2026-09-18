import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import * as turf from '@turf/turf'
import { toLonLat } from 'ol/proj'
import { useAllFeatureStore } from '@base/stores/all-features'
import type { HeatMapLayerSettings } from '@base/components/GeoSpatialLayer/HeatMap/HeatMap.vue'
import { layerDefinitions } from '../stores/layerRegistry'
import { useLayersStore } from '../stores/layers'
import { useState } from '#app'

/**
 * Everything the analysis dashboard and its map layers share. Lived in
 * pages/dashboard.vue before; now AnalysisPanel and AnalysisLayers both call
 * this, so the page itself can be a JSON spec.
 */
export function useAnalysis() {
  const allFeatureStore = useAllFeatureStore()
  const { featuresByCategory } = allFeatureStore
  const { allFeatures, featuresByType } = storeToRefs(allFeatureStore)
  const layersStore = useLayersStore()
  const { layers } = storeToRefs(layersStore)

  // Shared, page-scoped settings (useState so both components see one object).
  const filters = useState<Record<string, boolean>>('analysis.filters', () => ({ Comments: false }))
  const layerSettings = useState<Record<string, HeatMapLayerSettings>>('analysis.layerSettings', () => ({}))
  const filterTime = useState<{ start: Date, end: Date }>('filterTime', () => {
    const end = new Date()
    const start = new Date()
    start.setFullYear(end.getFullYear() - 1)
    return { start, end }
  })

  const ranges = [
    { label: 'Last 7 days', duration: { days: 7 } },
    { label: 'Last 14 days', duration: { days: 14 } },
    { label: 'Last 30 days', duration: { days: 30 } },
    { label: 'Last 3 months', duration: { months: 3 } },
    { label: 'Last 6 months', duration: { months: 6 } },
    { label: 'Last year', duration: { years: 1 } },
  ]

  const metaData = computed(() => ({
    'Data Entries': allFeatures.value.length,
    'Categories': Object.keys(featuresByCategory).length,
    'Geometric Type': Object.keys(featuresByType.value).length,
  }))

  const features = computed(() => {
    const pts = (featuresByType.value.Point ?? []).map(f =>
      turf.point(toLonLat(f.coordinates as [number, number]), { value: Math.random() * 100 }),
    )
    return turf.featureCollection(pts)
  })

  function getGeoJsonFeature(featureKey: string) {
    let list = featuresByCategory[featureKey] ?? []
    if (!Array.isArray(list) || list.length === 0) {
      return turf.featureCollection([])
    }
    if (filters.value.Comments) {
      list = list.filter(feat => feat.comment && feat.comment.length > 0)
    }
    if (filterTime.value) {
      list = list.filter((feat) => {
        if (!feat.timestamp) {
          return false
        }
        const t = new Date(feat.timestamp)
        return t >= filterTime.value.start && t <= filterTime.value.end
      })
    }
    const points = list
      .filter(feat => Array.isArray(feat.coordinates) && feat.coordinates.length === 2
        && typeof feat.coordinates[0] === 'number' && typeof feat.coordinates[1] === 'number')
      .map(feat => turf.point(toLonLat(feat.coordinates)))
    return turf.featureCollection(points)
  }

  const heatmapFeatures = computed(() =>
    Object.fromEntries(Object.keys(featuresByCategory).map(key => [key, getGeoJsonFeature(key)])),
  )

  const categories = computed(() => {
    const grouped: Record<string, string[]> = {}
    for (const key of Object.keys(featuresByCategory)) {
      const [section, category] = key.split('.')
      if (section && category) {
        grouped[section] = grouped[section] || []
        grouped[section].push(category)
      }
    }
    return grouped
  })

  const layerCards = computed(() =>
    Object.entries(layerDefinitions).map(([type, def]) => ({
      type: type as keyof typeof layerDefinitions,
      label: def.label,
      iconName: def.icon,
      active: layers.value.some(l => l.type === type),
    })),
  )

  function resetHeatMapState() {
    filters.value.Comments = false
    const end = new Date()
    const start = new Date()
    start.setFullYear(end.getFullYear() - 1)
    filterTime.value = { start, end }
    for (const key in layerSettings.value) {
      delete layerSettings.value[key]
    }
  }

  /** Add or remove a layer type. Returns true when a layer was added. */
  function toggleLayer(type: keyof typeof layerDefinitions) {
    const existing = layers.value.find(l => l.type === type)
    if (existing) {
      layersStore.removeLayer(existing.id)
      if (type === 'heatmap') {
        resetHeatMapState()
      }
      return false
    }
    layersStore.addLayer(type)
    return true
  }

  return {
    layers,
    filters,
    layerSettings,
    filterTime,
    ranges,
    metaData,
    features,
    heatmapFeatures,
    categories,
    layerCards,
    toggleLayer,
  }
}
