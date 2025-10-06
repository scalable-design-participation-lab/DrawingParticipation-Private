import * as d3 from 'd3'
import sensorLocations from '../static/Sensor_Locations_NEU.json'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDashboardUIStore = defineStore('dashboardUI', () => {
  // Map related state and functions
  const mapType = ref('satellite')
  const mapCenter = ref(null)

  const setMapType = (type) => {
    mapType.value = type
  }

  const updateMapCenter = (center) => {
    mapCenter.value = center
  }

  // Sensor related state and functions
  const showSensorInfo = ref(false)
  const showSensorDetail = ref(false)
  const selectedSensorId = ref(null)
  const clickPosition = ref({ x: 0, y: 0 })

  const selectedSensor = computed(() =>
    sensors.value.find((sensor) => sensor.id === selectedSensorId.value)
  )

  const toggleSensorDetail = () => {
    showSensorDetail.value = !showSensorDetail.value
    if (showSensorDetail.value) {
      showSensorInfo.value = false
      showDashboard.value = false
    }
  }

  const updateSelectedSensor = (id) => {
    selectedSensorId.value = id
    showSensorInfo.value = true
    showSensorDetail.value = false
    showDashboard.value = false
  }

  const getNextSensorId = () => {
    const currentIndex = sensors.value.findIndex(
      (sensor) => sensor.id === selectedSensorId.value
    )
    return sensors.value[(currentIndex + 1) % sensors.value.length].id
  }

  const getPreviousSensorId = () => {
    const currentIndex = sensors.value.findIndex(
      (sensor) => sensor.id === selectedSensorId.value
    )
    return sensors.value[
      (currentIndex - 1 + sensors.value.length) % sensors.value.length
    ].id
  }

  const selectNextSensor = () => {
    selectedSensorId.value = getNextSensorId()
  }

  const selectPreviousSensor = () => {
    selectedSensorId.value = getPreviousSensorId()
  }

  const closeSensorInfo = () => {
    showSensorInfo.value = false
  }

  const updateClickPosition = (position) => {
    clickPosition.value = position
  }

  // Sensor data
  const locations = [
    'Architecture Studios',
    'Cabot Center',
    'Cargill Hall',
    'Carter Playground',
    'Centennial Common',
    'Columbus Garage',
    'Curry Student Center',
    'Forsyth Building',
    'Gainsborough Garage',
    'Gainsborough Garage Roof',
    'ISEC Terrace',
    'Matthews Arena',
    'Robinson Hall',
    'Snell Library Quad',
  ]

  const getRandomValue = (min, max) => Math.random() * (max - min) + min

  const sensors = ref(
    sensorLocations.features.map((feature, index) => ({
      id: feature.properties.OBJECTID,
      location: locations[index % locations.length],
      temperature: feature.properties.temperature,
      humidity: feature.properties.relative_humidity,
      voc: feature.properties.voc,
      nox: feature.properties.nox,
      pm25: Number(feature.properties.pm25.toFixed(2)),
      coordinates: feature.geometry.coordinates,
      timestamp: new Date(feature.properties.timestamp).toLocaleString(),
      batteryLevel: Math.floor(getRandomValue(20, 100)),
      signalStrength: Math.floor(getRandomValue(1, 5)),
      lastMaintenance: new Date(
        Date.now() - getRandomValue(0, 30 * 24 * 60 * 60 * 1000)
      ).toLocaleDateString(),
      status: ['Active', 'Inactive', 'Maintenance'][
        Math.floor(Math.random() * 3)
      ],
      airQuality: ['Good', 'Moderate', 'Poor', 'Very Poor'][
        Math.floor(Math.random() * 4)
      ],
      soilMoisture: getRandomValue(20, 80).toFixed(1) + '%',
    }))
  )

  // Filter related state and functions
  const showFilter = ref(false)

  const toggleFilter = () => {
    showFilter.value = !showFilter.value
  }

  // Dashboard related state and functions
  const showDashboard = ref(false)

  const toggleDashboard = () => {
    showDashboard.value = !showDashboard.value
    if (showDashboard.value) {
      showSensorInfo.value = false
      showSensorDetail.value = false
    }
  }

  const setPopUpVisibility = (popUp) => {
    if (popUp === 'dashboard') {
      showDashboard.value = true
    } else {
      showDashboard.value = false
    }
  }

  // Eco-Hubs and Datasets
  const existingHubs = ref(
    Object.fromEntries(locations.map((loc) => [loc, true]))
  )
  const existingDatasets = ref({
    Temperature: true,
    'Relative Humidity': true,
    'VOC (ppb)': true,
    'NOx (ppb)': true,
    pm1: true,
    'pm2.5': true,
    pm4: true,
    pm10: true,
  })

  const updateExistingHubs = (newHubs) => {
    existingHubs.value = { ...newHubs }
  }

  const updateExistingDatasets = (newDatasets) => {
    existingDatasets.value = { ...newDatasets }
  }

  const toggleDataset = (datasetKey) => {
    existingDatasets.value[datasetKey] = !existingDatasets.value[datasetKey]
  }

  const toggleHub = (hubKey) => {
    existingHubs.value[hubKey] = !existingHubs.value[hubKey]
  }

  // Sensor data loading
  const sensorData = ref({})
  const lastFetchTime = ref(null)
  const isFetching = ref(false)

  const loadSensorData = async (force = false) => {
    const cacheTime = 5400000 // 1h30m
    if (
      force ||
      !sensorData.value ||
      !lastFetchTime.value ||
      Date.now() - lastFetchTime.value > cacheTime
    ) {
      if (isFetching.value) return sensorData.value
      isFetching.value = true
      try {
        const data = await $fetch('/api/sensor-data')
        const metrics = {
          Temperature: { name: 'temperature', label: 'Temperature (°C)' },
          'Relative Humidity': {
            name: 'relative_humidity',
            label: 'Relative Humidity (%)',
          },
          'VOC (ppb)': { name: 'voc', label: 'VOC (ppb)' },
          'NOx (ppb)': { name: 'nox', label: 'NOx (ppb)' },
          pm1: { name: 'pm1', label: 'PM1 (µg/m³)' },
          'pm2.5': { name: 'pm25', label: 'PM2.5 (µg/m³)' },
          pm4: { name: 'pm4', label: 'PM4 (µg/m³)' },
          pm10: { name: 'pm10', label: 'PM10 (µg/m³)' },
          scd_temp: {
            name: 'scd_temp',
            label: 'SCD Temperature (°C)',
          },
          scd_humid: {
            name: 'scd_humid',
            label: 'SCD Humidity (%)',
          },
          scd_co2: { name: 'scd_co2', label: 'SCD CO2 (ppm)' },
        }

        const metricData = {}
        Object.keys(metrics).forEach((key) => {
          const values = data.map((d) => d[metrics[key].name])
          metricData[key] = {
            data: data.map((d) => ({
              date: new Date(d.timestamp),
              value: d[metrics[key].name],
            })),
            min: Math.min(...values),
            max: Math.max(...values),
          }
        })
        sensorData.value = metricData
        lastFetchTime.value = Date.now()
      } catch (err) {
        console.error('Error fetching sensor data', err)
      } finally {
        isFetching.value = false
      }
    }
    return sensorData.value
  }

  // Dashboard data
  const dataDashboard = ref(false)
  const dataDashboardValues = ref({
    time: [0, 24],
    temperature: [],
    heat_index: [],
    relative_humidity: [],
    pm25: [],
    pm10: [],
    dateRange: [],
    dateRangeValues: [],
  })

  const updateDataDashboardValues = (dataType, data) => {
    dataDashboardValues.value[dataType] = data
  }

  const dateRangeUpdate = ref(null)

  const updateDateRangeUpdate = (date) => {
    dateRangeUpdate.value = date
  }

  // Solutions related state and functions
  const masterSolutions = ref([])
  const selectedSolution = ref({})
  const parsedSolutions = ref([])
  const solutionsObject = ref({})

  const loadMasterSolutions = async () => {
    const response = await fetch('/master_solutions.csv')
    const text = await response.text()
    const data = d3.csvParse(text, (d) => {
      const newD = {}
      Object.keys(d).forEach((key) => {
        newD[key] = +d[key]
      })
      return newD
    })
    masterSolutions.value = data
  }

  const setSelectedSolution = (solution) => {
    selectedSolution.value = solution
  }

  const updateParsedSolutions = (solutions) => {
    parsedSolutions.value = solutions
  }

  const updateSolutionsObject = (solutions) => {
    solutionsObject.value = solutions
  }

  // Site related state
  const selectedSite = ref('')
  const selectedSiteProps = ref({})
  const development = ref('')

  const updateSelectedSite = (site) => {
    selectedSite.value = site
  }

  const updateSelectedSiteProps = (props) => {
    selectedSiteProps.value = props
  }

  // Popup visibility
  const popUpVisibility = ref({
    pcoords: false,
    dashboard: false,
    about: false,
  })

  // Computed properties
  const selectedHubs = computed(() =>
    Object.keys(existingHubs.value).filter(
      (hub) => existingHubs.value[hub] == true
    )
  )

  const selectedDatasets = computed(() => {
    if (Object.keys(existingDatasets.value).length === 0) return []
    return Object.keys(existingDatasets.value).filter(
      (dataset) => existingDatasets.value[dataset] === true
    )
  })

  const hubsList = computed(() => Object.keys(existingHubs.value))

  const updatedMaxMinVals = computed(() => {
    const vals = {}
    if (masterSolutions.value.length === 0) return vals
    Object.keys(masterSolutions.value[0]).forEach(
      (key) =>
        (vals[key] = {
          max: Math.max(...masterSolutions.value.map((o) => o[key])),
          min: Math.min(...masterSolutions.value.map((o) => o[key])),
        })
    )
    return vals
  })

  const feasibleSites = computed(() => {
    const MIN_HUB_AREA = 2 // acres
    return parsedSolutions.value.filter(
      (site) => site.AREA_BUILD >= MIN_HUB_AREA && site.HAS_ECO_HUB === '0.0'
    )
  })

  const builtSites = computed(() =>
    parsedSolutions.value.filter((site) => site.BUILT !== '0')
  )

  // Dashboard data loading (mock function)
  const dashboardData = ref(null)
  const loadDashboardData = async () => {
    if (!dashboardData.value) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      dashboardData.value = {
        /* loaded data */
      }
    }
    return dashboardData.value
  }

  return {
    // Map related
    mapType,
    mapCenter,
    setMapType,
    updateMapCenter,

    // Sensor related
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

    // Filter related
    showFilter,
    toggleFilter,

    // Dashboard related
    showDashboard,
    toggleDashboard,
    setPopUpVisibility,

    // Eco-Hubs and Datasets
    existingHubs,
    existingDatasets,
    updateExistingHubs,
    updateExistingDatasets,
    toggleDataset,
    toggleHub,

    // Sensor data
    sensorData,
    loadSensorData,

    // Dashboard data
    dataDashboard,
    dataDashboardValues,
    updateDataDashboardValues,
    dateRangeUpdate,
    updateDateRangeUpdate,

    // Solutions related
    masterSolutions,
    selectedSolution,
    parsedSolutions,
    solutionsObject,
    loadMasterSolutions,
    setSelectedSolution,
    updateParsedSolutions,
    updateSolutionsObject,

    // Site related
    selectedSite,
    selectedSiteProps,
    development,
    updateSelectedSite,
    updateSelectedSiteProps,

    // Popup visibility
    popUpVisibility,

    // Computed properties
    selectedHubs,
    selectedDatasets,
    hubsList,
    updatedMaxMinVals,
    feasibleSites,
    builtSites,

    // Dashboard data loading
    loadDashboardData,
  }
})
