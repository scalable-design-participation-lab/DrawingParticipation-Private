import type { Feature } from './types/store'

export const useAllFeatureStore = defineStore('all-features', () => {
  /**
   * List of geospatial features.
   */
  const allFeatures = reactive<Feature[]>([])
  /**
   * Adds a new feature to the store.
   *
   * @param feature - The feature object to add.
   */
  function addFeature(feature: Omit<Feature, 'id'>): void {
    allFeatures.push({
      id: Date.now(),
      ...feature,
    })
  }
  return {
    allFeatures,
    addFeature,
  }
})
