<template>
  <div v-if="isLoading" class="flex justify-center items-center h-screen">
    Loading...
  </div>
  <div v-else class="flex flex-col min-h-screen">
    <GeneralizedHeader
      class="z-20"
      :left-items="leftItems"
      :right-items="rightItems"
      logo-src="/arboretum_logo.svg"
      logo-alt="Northeastern University Arboretum Logo"
      :show-icon="true"
    />

    <main class="flex-grow relative overflow-hidden pt-16">
      <MapDashboard class="absolute inset-0" :center-on="selectedMapCenter" />
      <GenericFilterSidebar
        v-if="showFilter && !showDashboard"
        :is-visible="showFilter && !showDashboard"
        title="Filters"
        :filter-sections="filterSections"
        class="fixed top-[calc(4rem+6vh)] right-5 z-[1001] w-[calc(100%-2.5rem)] sm:w-[240px] md:w-[300px] lg:w-[360px] h-[calc(100vh-8rem-8vh)] max-h-[800px] overflow-auto"
        @close="closeFilter"
        @reset="resetAllFilters"
        @filter-change="handleFilterChange"
      />
      <Dashboard
        v-if="showDashboard"
        class="fixed top-[calc(4rem+2vh)] left-1/2 transform -translate-x-1/2 z-20 w-[90%] h-[calc(100vh-8rem-4vh)] overflow-hidden bg-transparent"
      />
      <div class="absolute left-5 top-1/2 transform -translate-y-1/2 z-20">
        <GenericToolbar :tools="sensorTools" @tool-click="handleToolClick" />
      </div>
      <SensorDetail
        v-if="showSensorDetail"
        class="fixed top-[calc(4rem+2vh)] left-1/2 transform -translate-x-1/2 z-20 w-[50%] h-[calc(100vh-8rem-4vh)] overflow-hidden"
      />

      <div
        v-if="showDashboard || showSensorDetail"
        class="fixed inset-0 bg-black bg-opacity-50 z-10"
        @click="closeOverlay"
      ></div>

      <LocationSelectorModal
        v-if="showLocationSelector"
        :locations="listOfLocations"
        @select="handleLocationSelect"
        @close="showLocationSelector = false"
      />
    </main>
    <GeneralizedFooter class="z-20" />
    <Teleport to="body">
      <DownloadPopup
        v-if="showDownloadPopup"
        :filter-sections="downloadFilterSections"
        @close="showDownloadPopup = false"
        @download="handleDownloadData"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { useFilterStore } from '@/stores/filter'
import { useMapStore } from '@/stores/map'
import { useSensorDetailStore } from '@/stores/sensorDetail'
import { useDatasetStore } from '@/stores/datasets'
import { sub } from 'date-fns'

// Dashboard store
const dashboardStore = useDashboardStore()
const { showDashboard } = storeToRefs(dashboardStore)
const { toggleDashboard, updateDataDashboardValues, updateDateRangeUpdate } =
  dashboardStore

// Filter store
const filterStore = useFilterStore()
const { showFilter } = storeToRefs(filterStore)
const { toggleFilter } = filterStore

// Map store
const mapStore = useMapStore()
const { setMapType } = mapStore
const currentMapType = ref('satellite')

// Sensor Detail store
const sensorDetailStore = useSensorDetailStore()
const { showSensorDetail, availableLocations } = storeToRefs(sensorDetailStore)
const { clusterDetailsWithLabels } = sensorDetailStore

// Dataset store
const datasetStore = useDatasetStore()
const { existingDatasets } = storeToRefs(datasetStore)
const { updateExistingHubs, updateExistingDatasets } = datasetStore

// Sensor Data store

const isLoading = ref(false)
const selected = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })
const showDownloadPopup = ref(false)
const selectedDownloadFilters = ref({})

// Routing
const router = useRouter()
const goHome = () => router.push('/')

function updateDateRange(newRange) {
  selected.value = newRange
  updateDataDashboardValues('dateRange', [newRange.start, newRange.end])
  updateDateRangeUpdate(new Date())
}
const selectedMapCenter = ref<[number, number] | null>(null)
const showLocationSelector = ref(false)

const listOfLocations = computed(() =>
  Object.keys(sensorDetailStore.clusterDetailsWithLabels).map((key) => {
    const cluster = sensorDetailStore.clusterDetailsWithLabels[key]
    return {
      label: cluster.label || `Cluster ${cluster.id}`,
      value: cluster.id,
      location: cluster.centroidCoords,
    }
  })
)

const filterSections = computed(() => [
  {
    name: 'location',
    label: 'Location Selection',
    icon: 'i-heroicons-map-pin',
    component: 'GenericCheckboxGroup',
    props: {
      items: availableLocations.value.map((location) => ({
        label: location,
        value: location,
      })),
      modelValue: Object.fromEntries(
        availableLocations.value.map((location) => [location, true])
      ),
    },
  },
  {
    name: 'datasets',
    label: 'Data Selection',
    icon: 'i-heroicons-chart-bar',
    component: 'GenericCheckboxGroup',
    props: {
      items: Object.keys(existingDatasets.value).map((dataset) => ({
        label: dataset,
        value: dataset,
      })),
      modelValue: existingDatasets.value,
    },
  },
  {
    name: 'datetime',
    label: 'Date & Time',
    icon: 'i-heroicons-calendar',
    component: 'GenericDateRangePicker',
    props: {
      modelValue: selected.value,
    },
  },
])

const downloadFilterSections = computed(() => [
  {
    name: 'location',
    label: 'Location Selection',
    icon: 'i-heroicons-map-pin',
    component: 'GenericCheckboxGroup',
    props: {
      items: availableLocations.value.map((location) => ({
        label: location,
        value: location,
      })),
      modelValue: Object.fromEntries(
        availableLocations.value.map((location) => [location, true])
      ),
    },
  },
  {
    name: 'datasets',
    label: 'Data Selection',
    icon: 'i-heroicons-chart-bar',
    component: 'GenericCheckboxGroup',
    props: {
      items: [
        { label: 'Temperature', value: 'temperature' },
        { label: 'Relative Humidity', value: 'relative_humidity' },
        { label: 'VOC', value: 'voc' },
        { label: 'NOx', value: 'nox' },
        { label: 'PM1', value: 'pm1' },
        { label: 'PM25', value: 'pm25' },
        { label: 'PM4', value: 'pm4' },
        { label: 'PM10', value: 'pm10' },
      ],
      modelValue: {
        temperature: true,
        relative_humidity: true,
        voc: true,
        nox: true,
        pm1: true,
        pm25: true,
        pm4: true,
        pm10: true,
      },
    },
  },
  {
    name: 'datetime',
    label: 'Date & Time',
    icon: 'i-heroicons-calendar',
    component: 'GenericDateRangePicker',
    props: {
      modelValue: selected.value,
    },
  },
])

const handleFilterChange = (filterData) => {
  const { name, value } = filterData
  switch (name) {
    case 'location':
      updateExistingHubs(value)
      const selectedLocations = Object.entries(value)
        .filter(([_, isSelected]) => isSelected)
        .map(([location]) => location)

      sensorDetailStore.updateFilteredLocations(selectedLocations)
      break
    case 'datasets':
      updateExistingDatasets(value)
      break
    case 'datetime':
      if (value.isAllTime) {
        updateDateRange({ start: null, end: null })
      } else {
        updateDateRange(value)
      }
      break
  }
  updateDateRangeUpdate(new Date())
}
function handleLocationSelect(coords: [number, number]) {
  showLocationSelector.value = false
  selectedMapCenter.value = coords
  showSensorDetail.value = false
}

const resetAllFilters = () => {
  const resetValue = (obj) =>
    Object.fromEntries(Object.keys(obj).map((key) => [key, true]))

  const resetLocations = Object.fromEntries(
    availableLocations.value.map((location) => [location, true])
  )
  updateExistingHubs(resetLocations)

  sensorDetailStore.updateFilteredLocations(availableLocations.value)

  updateExistingDatasets(resetValue(existingDatasets.value))
  updateDataDashboardValues('dateRange', [])
  updateDateRangeUpdate(new Date())
}

const sensorTools = [
  { icon: 'i-heroicons-solid:home', tooltip: 'Home', action: goHome },
  { icon: 'i-heroicons-solid:filter', tooltip: 'Filter', action: toggleFilter },
  {
    icon: 'i-heroicons-solid:squares-2x2',
    tooltip: 'Dashboard',
    action: toggleDashboard,
  },
  {
    icon: 'i-heroicons-solid-map-pin',
    tooltip: 'Jump to Location',
    action: () => {
      showLocationSelector.value = true
    },
  },
]

const handleToolClick = (index: number) => {}

const closeFilter = () => {
  toggleFilter()
}

const handleDownloadData = async ({ filters, format }) => {
  try {
    const response = await $fetch('/api/download-sensor-data', {
      method: 'POST',
      body: {
        datasets: filters.datasets,
        dateRange: filters.datetime,
        location: filters.location,
        format: format,
      },
    })

    if (response) {
      // Handle download logic
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(response) : response],
        {
          type: format === 'json' ? 'application/json' : 'text/csv',
        }
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sensor_data.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  } catch (error) {
    console.error('Error downloading data:', error)
    alert(`Download failed: ${error.message || 'Unknown error'}`)
  }

  showDownloadPopup.value = false
}

const leftItems = ref([
  {
    label: 'Open Sensing',
    variant: 'solid',
    color: 'black',
    onClick: () => toggleDashboard(),
  },
  {
    label: 'Northeastern University',
    variant: 'solid',
    color: 'black',
  },
])

const rightItems = ref([
  {
    label: computed(() =>
      currentMapType.value === 'light' ? 'Satellite Map' : 'Vector Map'
    ),
    icon: computed(() =>
      currentMapType.value === 'light'
        ? 'i-heroicons:globe-americas-20-solid'
        : 'i-heroicons:map'
    ),
    onClick: () => {
      currentMapType.value =
        currentMapType.value === 'light' ? 'satellite' : 'light'
      setMapType(currentMapType.value)
    },
  },
  {
    label: 'Download',
    icon: 'i-heroicons-arrow-down-tray-20-solid',
    color: 'gray',
    onClick: () => (showDownloadPopup.value = true),
  },
])

const closeOverlay = () => {
  if (showDashboard.value) {
    toggleDashboard(false)
  }
  if (showSensorDetail.value) {
    sensorDetailStore.toggleSensorDetail(false)
  }
}

watch(showDashboard, (newValue) => {
  if (newValue && showFilter.value) {
    toggleFilter()
  }
})

watch(showFilter, (newValue) => {
  if (newValue && showDashboard.value) {
    toggleDashboard()
  }
})

onMounted(async () => {
  await sensorDetailStore.loadSensors()

  const processed = sensorDetailStore.processedDBSCANClusters
  sensorDetailStore.clusterDetailsWithLabels = {}

  for (const id in processed) {
    const cluster = processed[id]
    sensorDetailStore.clusterDetailsWithLabels[cluster.id] = {
      ...cluster,
      label: 'Loading...',
      isLoadingLabel: true,
    }

    sensorDetailStore.fetchAndSetLabelForCluster(
      cluster.id,
      cluster.centroidCoords
    )
  }
  showLocationSelector.value = true
})
</script>

<style scoped>
.top-\[calc\(4rem\+2vh\)\] {
  top: calc(4rem + 2vh);
}

.h-\[calc\(100vh-8rem-4vh\)\] {
  height: calc(100vh - 8rem - 4vh);
}
</style>
