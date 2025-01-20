import { useAllFeatureStore } from './all-features'
import { useFeatureStore } from '@base/stores/features'

// This could be a composable instead of a store
export const useRouteFeatureStore = defineStore('router-feature', () => {
  const featureStore = useFeatureStore()
  const allFeatureStore = useAllFeatureStore()
  const route = useRoute()

  // Define a mapping of routes to data sources
  const routeDataMap = {
    '/': () => featureStore.features,
    '/result': () => allFeatureStore.allFeatures,
  }

  const defaultDataSource = () => []

  const getDataForRoute = () => {
    const getDataSource = routeDataMap[route.path] || defaultDataSource
    return getDataSource()
  }

  return {
    getDataForRoute,
  }
})
