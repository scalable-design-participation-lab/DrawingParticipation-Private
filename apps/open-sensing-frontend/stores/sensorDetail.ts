import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDashboardStore } from './dashboard'
import * as turf from '@turf/turf'

export interface Sensor {
  moduleid: string
  ecohub_location: string
  lat: number | null
  lon: number | null
  temperature: number
  relative_humidity: number
  voc: number
  nox: number
  pm1: number
  pm25: number
  pm4: number
  pm10: number
  bme_humid: number
  bme_temp: number
  bme_pressure: number
  scd_temp: number
  scd_humid: number
  scd_co2: number
  timestamp: string
}
const DBSCAN_MAX_DISTANCE_KM = 20
const DBSCAN_MIN_POINTS = 1
interface ClusterDetail {
  id: number
  centroidCoords: [number, number]
  points: any
  pointCount: number
  label?: string
  isLoadingLabel: boolean
  labelError?: string
}

export const useSensorDetailStore = defineStore('sensorDetail', () => {
  const dashboardStore = useDashboardStore()
  const showSensorInfo = ref(false)
  const showSensorDetail = ref(false)
  const selectedSensorId = ref<string | null>(null)
  const clickPosition = ref({ x: 0, y: 0 })
  const sensors = ref<Sensor[]>([])
  const isLoading = ref(false)
  const clusterDetailsWithLabels = ref<Record<number, ClusterDetail>>({})
  const sensorsSortedByLat = computed(() =>
    sensors.value
      .filter((s) => s.lat != null)
      .sort((a, b) => (a.lat! > b.lat! ? 1 : -1))
  )
  const currentSortedIndex = computed(() =>
    sensorsSortedByLat.value.findIndex(
      (s) => s.moduleid === selectedSensorId.value
    )
  )
  function getClusterIdForSensor(sensorId: string | null): number | null {
    if (!sensorId) {
      return null
    }

    const clusterEntries = Object.entries(processedDBSCANClusters.value)
    for (const [clusterIdStr, cluster] of clusterEntries) {
      const found = cluster.points.some(
        (point: any) => point.properties.moduleid === sensorId
      )
      if (found) {
        return Number(clusterIdStr)
      }
    }

    return null
  }
  function getSortedSensorsInCluster(sensorId: string | null): Sensor[] {
    const clusterId = getClusterIdForSensor(sensorId)
    if (clusterId === null) {
      return []
    }

    const cluster = processedDBSCANClusters.value[clusterId]
    const sensorIdsInCluster = new Set(
      cluster.points.map((p: any) => p.properties.moduleid)
    )

    const sorted = sensorsSortedByLat.value.filter((s) =>
      sensorIdsInCluster.has(s.moduleid)
    )

    return sorted
  }

  const loadSensors = async () => {
    if (isLoading.value) return
    isLoading.value = true

    try {
      const response = await $fetch('/api/sensor-data')
      if (Array.isArray(response)) {
        sensors.value = response.map((sensor) => {
          return {
            ...sensor,
            lat: sensor.lat || null,
            lon: sensor.lon || null,
            temperature: Number(sensor.temperature) || 0,
            relative_humidity: Number(sensor.relative_humidity) || 0,
            voc: Number(sensor.voc) || 0,
            nox: Number(sensor.nox) || 0,
            pm1: Number(sensor.pm1) || 0,
            pm25: Number(sensor.pm25) || 0,
            pm4: Number(sensor.pm4) || 0,
            pm10: Number(sensor.pm10) || 0,
          }
        })

        filteredLocations.value = Array.from(
          new Set(
            sensors.value
              .filter((sensor) => sensor.ecohub_location)
              .map((sensor) => sensor.ecohub_location)
          )
        )

        // Sync processed clusters to clusterDetailsWithLabels
        clusterDetailsWithLabels.value = {}
        const processed = processedDBSCANClusters.value
        for (const id in processed) {
          const cluster = processed[id]
          clusterDetailsWithLabels.value[cluster.id] = {
            ...cluster,
            label: 'Loading...',
            isLoadingLabel: true,
          }

          // Fetch label asynchronously
          fetchAndSetLabelForCluster(cluster.id, cluster.centroidCoords)
        }
      } else {
        console.error('Unexpected response format:', response)
        sensors.value = []
        filteredLocations.value = []
      }
    } catch (err) {
      console.error('Error loading sensors:', err)
      sensors.value = []
      filteredLocations.value = []
    } finally {
      isLoading.value = false
    }
  }

  const selectedSensor = computed(() =>
    sensors.value.find((sensor) => sensor.moduleid === selectedSensorId.value)
  )

  const toggleSensorDetail = () => {
    showSensorDetail.value = !showSensorDetail.value
    if (showSensorDetail.value) {
      showSensorInfo.value = false
      dashboardStore.showDashboard = false
    }
  }

  const updateSelectedSensor = (id: string) => {
    selectedSensorId.value = id
    showSensorInfo.value = true
    showSensorDetail.value = false
    dashboardStore.showDashboard = false
  }

  function getNextSensorId(): string | null {
    const currentId = selectedSensorId.value
    const sorted = getSortedSensorsInCluster(currentId)

    const idx = sorted.findIndex((s) => s.moduleid === currentId)
    if (idx === -1) {
      return null
    }

    const nextIdx = (idx + 1) % sorted.length

    return sorted[nextIdx].moduleid
  }

  function getPreviousSensorId(): string | null {
    const currentId = selectedSensorId.value
    const sorted = getSortedSensorsInCluster(currentId)

    const idx = sorted.findIndex((s) => s.moduleid === currentId)
    if (idx === -1) {
      return null
    }

    const prevIdx = (idx - 1 + sorted.length) % sorted.length

    return sorted[prevIdx].moduleid
  }
  const selectNextSensor = () => {
    const next = getNextSensorId()
    if (next) selectedSensorId.value = next
  }
  const selectPreviousSensor = () => {
    const prev = getPreviousSensorId()
    if (prev) selectedSensorId.value = prev
  }

  const closeSensorInfo = () => {
    showSensorInfo.value = false
  }

  const updateClickPosition = (position) => {
    clickPosition.value = position
  }

  const availableLocations = computed(() => {
    const locations = new Set<string>()
    sensors.value.forEach((sensor) => {
      if (sensor.ecohub_location) {
        locations.add(sensor.ecohub_location)
      }
    })
    return Array.from(locations)
  })

  const filteredLocations = ref<string[]>([])

  const initialFilteredLocations = computed(() => {
    return availableLocations.value
  })

  const updateFilteredLocations = (locations: string[]) => {
    filteredLocations.value = locations
  }

  const filteredSensors = computed(() => {
    if (filteredLocations.value.length === 0) {
      return []
    }
    return sensors.value.filter((sensor) =>
      filteredLocations.value.includes(sensor.ecohub_location)
    )
  })
  const densityBasedSensorClusters = computed(() => {
    const sensorsWithCoords = filteredSensors.value.filter(
      (s) =>
        s.lon != null &&
        s.lat != null &&
        !isNaN(Number(s.lon)) &&
        !isNaN(Number(s.lat))
    )

    if (sensorsWithCoords.length === 0) {
      return turf.featureCollection([])
    }

    const features = sensorsWithCoords.map((sensor) =>
      turf.point([Number(sensor.lon), Number(sensor.lat)], { ...sensor })
    )
    const pointFeatureCollection = turf.featureCollection(features)

    try {
      const pointsToCluster = turf.clone(pointFeatureCollection)

      const clusteredCollection = turf.clustersDbscan(
        pointsToCluster,
        DBSCAN_MAX_DISTANCE_KM,
        {
          minPoints: DBSCAN_MIN_POINTS,
          units: 'kilometers',
        }
      )

      return clusteredCollection
    } catch (error) {
      console.error(
        'Error during DBSCAN clustering in sensorDetail store:',
        error
      )
      return turf.featureCollection([])
    }
  })
  const processedDBSCANClusters = computed(() => {
    const clustersOutput: Record<
      number,
      Omit<ClusterDetail, 'label' | 'isLoadingLabel' | 'labelError'>
    > = {}
    const features = densityBasedSensorClusters.value.features

    if (!features || features.length === 0) {
      return clustersOutput
    }

    const pointsByCluster: Record<number, any> = {}
    features.forEach((feature) => {
      const props = feature.properties
      if (
        props &&
        props.dbscan !== 'noise' &&
        typeof props.cluster === 'number' &&
        props.cluster >= 0
      ) {
        if (!pointsByCluster[props.cluster]) {
          pointsByCluster[props.cluster] = []
        }
        pointsByCluster[props.cluster].push(feature as any)
      }
    })

    for (const clusterIdStr in pointsByCluster) {
      const clusterId = parseInt(clusterIdStr, 10)
      const currentClusterPoints = pointsByCluster[clusterId]

      if (currentClusterPoints && currentClusterPoints.length > 0) {
        const pointFc = turf.featureCollection(currentClusterPoints)
        const centerFeature = turf.centerOfMass(pointFc)

        clustersOutput[clusterId] = {
          id: clusterId,
          centroidCoords: centerFeature.geometry.coordinates as [
            number,
            number
          ],
          points: currentClusterPoints,
          pointCount: currentClusterPoints.length,
        }
      }
    }
    return clustersOutput
  })

  async function fetchAndSetLabelForCluster(
    clusterId: number,
    centroidCoords: [number, number]
  ) {
    if (clusterDetailsWithLabels.value[clusterId]) {
      clusterDetailsWithLabels.value[clusterId].isLoadingLabel = true
      clusterDetailsWithLabels.value[clusterId].labelError = undefined
    } else {
      console.warn(
        `Attempted to fetch label for clusterId ${clusterId} not yet in clusterDetailsWithLabels`
      )
      return
    }
    const mapboxToken =
      'pk.eyJ1IjoiY2VzYW5kb3ZhbDA5IiwiYSI6ImNsdHl3OXI0eTBoamkya3MzamprbmlsMTUifQ.bIy013nDKsteOtWQRZMjqw'

    const [longitude, latitude] = centroidCoords
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place&limit=1`

    try {
      const response = await fetch(geocodingUrl)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `Mapbox API error: ${response.status}`
        )
      }
      const data = await response.json()

      let label = 'Unknown Location'
      if (data.features && data.features.length > 0) {
        label =
          data.features[0].place_name ||
          data.features[0].text ||
          'Nearby Location'
      }

      if (clusterDetailsWithLabels.value[clusterId]) {
        clusterDetailsWithLabels.value[clusterId].label = label
      }
    } catch (error: any) {
      console.error(
        `Failed to fetch label for cluster ${clusterId} [${longitude},${latitude}]:`,
        error
      )
      if (clusterDetailsWithLabels.value[clusterId]) {
        clusterDetailsWithLabels.value[clusterId].label = 'Error fetching label'
        clusterDetailsWithLabels.value[clusterId].labelError = error.message
      }
    } finally {
      if (clusterDetailsWithLabels.value[clusterId]) {
        clusterDetailsWithLabels.value[clusterId].isLoadingLabel = false
      }
    }
  }
  return {
    showSensorInfo,
    showSensorDetail,
    selectedSensor,
    toggleSensorDetail,
    updateSelectedSensor,
    closeSensorInfo,
    sensors,
    selectedSensorId,
    clickPosition,
    updateClickPosition,
    selectNextSensor,
    selectPreviousSensor,
    loadSensors,
    isLoading,
    availableLocations,
    filteredLocations,
    filteredSensors,
    updateFilteredLocations,
    initialFilteredLocations,
    densityBasedSensorClusters,
    fetchAndSetLabelForCluster,
    processedDBSCANClusters,
    clusterDetailsWithLabels,
  }
})
