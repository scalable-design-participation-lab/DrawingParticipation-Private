<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { YGeoJSON } from 'y-geojson'
import { WebsocketProvider } from 'y-websocket'
import type { Feature } from 'geojson'

// Import OpenLayers format
import { GeoJSON as OlGeoJSON } from 'ol/format'

// Y-GeoJSON integration
const ygeojson = ref(YGeoJSON())
const provider = ref<WebsocketProvider | null>(null)
const status = ref('Disconnected')
const mapRef = ref(null)
const mapInstance = ref(null)
const syncing = ref(false)
const roomName = ref('collaborative-room')
const isConnected = ref(false)
const connectedUsers = ref(0)

// Computed list of features for rendering
const features = ref<Feature[]>([])

// Map layers and sources
const vectorSource = ref(null)
const heatmapSource = ref(null)
const clusteredSource = ref(null)
const clusterSource = ref(null)

// UI state and options
const layerType = ref('vector') // 'vector', 'heatmap', 'clustered'
const showControls = ref(true)
const featureCount = ref(0)
const userColor = ref(getRandomColor())

// Import and compute settings for different layer types
const heatmapSettings = reactive({
  radius: 15,
  blur: 20,
  opacity: 0.8,
  visible: true,
  gradient: [
    'rgba(0,0,255,0)', // Blue (start with transparency)
    'rgba(0,0,255,1)', // Blue
    'rgba(0,255,255,1)', // Cyan
    'rgba(0,255,0,1)', // Green
    'rgba(255,255,0,1)', // Yellow
    'rgba(255,0,0,1)', // Red
  ],
})

const clusterSettings = reactive({
  distance: 40,
  minDistance: 20,
  threshold: 2,
  animationDuration: 300,
  visible: true,
})

// Drawing tools
const drawEnabled = ref(false)
const drawType = ref('Point') // 'Point', 'LineString', 'Polygon'
const drawInteraction = ref(null)

// Feature metadata
const selectedFeature = ref<Feature | null>(null)
const showFeatureModal = ref(false)
const featureProperties = reactive({
  name: '',
  description: '',
  color: '#ff0000',
  timestamp: new Date().toISOString(),
})

// Synchronize map with y-geojson state
function syncMapWithYjs() {
  if (!isConnected.value)
    return

  syncing.value = true

  try {
    // Get all features from y-geojson
    const yFeatures = ygeojson.value.getFeatures()

    // Update the features ref for rendering
    features.value = Object.values(yFeatures)

    countFeatures()
  }
  finally {
    syncing.value = false
  }
}

// Toggle drawing mode
function _toggleDrawing() {
  if (!drawEnabled.value) {
    enableDrawing(drawType.value)
  }
  else {
    disableDrawing()
  }
}

// Enable drawing interaction
function enableDrawing(type: string) {
  drawEnabled.value = true
  drawType.value = type

  // With Vue3-OpenLayers, drawing is handled declaratively in the template
  // We just need to set the state variables
}

// Disable drawing interaction
function disableDrawing() {
  drawEnabled.value = false
  // With Vue3-OpenLayers, drawing is handled declaratively in the template
}

// Handle map click to select features
function handleMapClick(event) {
  if (drawEnabled.value)
    return

  // Clear previous selection
  selectedFeature.value = null
  showFeatureModal.value = false

  // Check if a feature was clicked
  const feature = mapInstance.value.forEachFeatureAtPixel(event.pixel, feature => feature)

  if (feature) {
    const featureId = feature.get('id')
    if (featureId) {
      // Get the original GeoJSON feature from y-geojson
      const geoJsonFeature = ygeojson.value.getFeatureById(featureId)
      if (geoJsonFeature) {
        selectedFeature.value = geoJsonFeature

        // Populate properties form for editing
        if (geoJsonFeature.properties) {
          featureProperties.name = geoJsonFeature.properties.name || ''
          featureProperties.description = geoJsonFeature.properties.description || ''
          featureProperties.color = geoJsonFeature.properties.color || '#ff0000'
          featureProperties.timestamp = geoJsonFeature.properties.timestamp || new Date().toISOString()
        }

        showFeatureModal.value = true
      }
    }
  }
}

// Update feature properties
function updateFeatureProperties() {
  if (!selectedFeature.value)
    return

  const featureId = selectedFeature.value.id
  if (!featureId)
    return

  // Update properties in y-geojson
  ygeojson.value.updateFeatureProperties(featureId.toString(), {
    name: featureProperties.name,
    description: featureProperties.description,
    color: featureProperties.color,
    timestamp: featureProperties.timestamp,
    lastModified: new Date().toISOString(),
  })

  // Close modal
  showFeatureModal.value = false
}

// Delete the selected feature
function deleteSelectedFeature() {
  if (!selectedFeature.value)
    return

  const featureId = selectedFeature.value.id
  if (!featureId)
    return

  // Delete from y-geojson
  ygeojson.value.deleteFeatureById(featureId.toString())

  // Close modal
  showFeatureModal.value = false
  selectedFeature.value = null
}

// Import GeoJSON data
function _importGeoJSON(data: string) {
  try {
    const result = ygeojson.value.loadGeojson(data, 'skip')
    if (result.ok) {
      console.log('GeoJSON imported successfully:', result.result)
      syncMapWithYjs()
    }
    else {
      console.error('Error importing GeoJSON:', result.message)
    }
  }
  catch (error) {
    console.error('Error parsing GeoJSON:', error)
  }
}

// Export GeoJSON data
function _exportGeoJSON() {
  // Function is no longer needed
}

// Connection and initialization methods
function connect() {
  if (provider.value) {
    provider.value.disconnect()
  }

  status.value = 'Connecting...'

  provider.value = new WebsocketProvider(
    'ws://localhost:8787',
    roomName.value,
    ygeojson.value.doc,
  )

  provider.value.on('status', (event: any) => {
    status.value = event.status
    if (event.status === 'connected') {
      isConnected.value = true
      syncMapWithYjs()
    }
    else {
      isConnected.value = false
    }
  })

  provider.value.awareness.on('change', () => {
    if (provider.value) {
      const states = Array.from(provider.value.awareness.getStates().values())
      connectedUsers.value = states.length
    }
  })

  // Subscribe to feature changes
  ygeojson.value.onFeatureChange((changes) => {
    console.log('Feature changes detected:', changes)
    if (!syncing.value) {
      syncMapWithYjs()
    }
    countFeatures()
  })

  // Set user metadata
  if (provider.value) {
    provider.value.awareness.setLocalStateField('user', {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: userColor.value,
      active: true,
    })
  }
}

// Disconnect from the provider
function disconnect() {
  if (provider.value) {
    provider.value.disconnect()
    provider.value = null
    status.value = 'Disconnected'
    isConnected.value = false
  }
}

// Utility functions
function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

function countFeatures() {
  const features = ygeojson.value.getFeatures()
  featureCount.value = Object.keys(features).length
}

// Cleanup on component unmount
onUnmounted(() => {
  disconnect()
  if (drawInteraction.value && mapInstance.value) {
    mapInstance.value.removeInteraction(drawInteraction.value)
  }
})

// Initialize map and layers
onMounted(() => {
  // Initialize once the DOM is ready
  nextTick(() => {
    if (mapRef.value) {
      mapInstance.value = mapRef.value.mapInstance

      // Wait for the map to be fully initialized
      setTimeout(() => {
        syncMapWithYjs()

        // Add click handler for feature selection
        if (mapInstance.value) {
          mapInstance.value.on('click', handleMapClick)
        }
      }, 500)
    }
  })
})

// Initialize map layers
function _initializeLayers() {
  // Function is no longer needed
}

// Cluster style function for rendering clusters
function clusterStyleFunction(feature) {
  const size = feature.get('features').length

  if (size > 1) {
    // Return a style configuration object for clusters
    return {
      image: {
        circle: {
          radius: 10 + Math.min(size, 20),
          fill: { color: 'rgba(255, 153, 0, 0.8)' },
          stroke: { color: '#fff', width: 2 },
        },
      },
      text: {
        text: size.toString(),
        fill: { color: '#fff' },
        font: 'bold 12px Arial',
      },
    }
  }
  else {
    // For single features
    const originalFeature = feature.get('features')[0]
    const color = originalFeature.get('color') || '#3388ff'

    return {
      image: {
        circle: {
          radius: 7,
          fill: { color },
          stroke: { color: '#fff', width: 2 },
        },
      },
    }
  }
}

// Handle draw end event
function handleDrawEnd(event) {
  const olFeature = event.feature
  const geom = olFeature.getGeometry()

  // Convert OpenLayers geometry to GeoJSON
  const format = new OlGeoJSON()
  const geojsonGeom = format.writeGeometryObject(geom, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
  })

  // Create a GeoJSON feature with properties
  const feature = {
    type: 'Feature',
    id: `drawn-${Date.now()}`,
    geometry: geojsonGeom,
    properties: {
      name: `${drawType.value} ${Date.now()}`,
      description: '',
      color: userColor.value,
      creator: provider.value?.awareness.getLocalState()?.user?.name || 'Anonymous',
      timestamp: new Date().toISOString(),
      weight: 1,
    },
  }

  // Add the feature to y-geojson
  ygeojson.value.addFeature(feature as any)

  // Optionally disable drawing after creating a feature
  if (drawType.value === 'Point') {
    disableDrawing()
  }
}
</script>

<template>
  <div class="relative w-full h-screen">
    <!-- Map Component -->
    <ol-map
      ref="mapRef"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      class="w-full h-screen"
    >
      <ol-view
        :center="[0, 0]"
        :rotation="0"
        :zoom="2"
        projection="EPSG:3857"
      />

      <!-- Base Layer -->
      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <!-- Vector Layer -->
      <ol-vector-layer
        v-if="vectorSource && isConnected"
        :visible="layerType === 'vector'"
        :z-index="1"
      >
        <ol-source-vector ref="vectorSource">
          <ol-feature v-for="feature in features" :key="feature.id">
            <ol-geom-point
              v-if="feature.geometry && feature.geometry.type === 'Point'"
              :coordinates="feature.geometry.coordinates"
            />
            <ol-geom-line-string
              v-else-if="feature.geometry && feature.geometry.type === 'LineString'"
              :coordinates="feature.geometry.coordinates"
            />
            <ol-geom-polygon
              v-else-if="feature.geometry && feature.geometry.type === 'Polygon'"
              :coordinates="feature.geometry.coordinates"
            />

            <ol-style>
              <ol-style-fill
                v-if="feature.properties && feature.properties.color"
                :color="`${feature.properties.color}80`"
              />
              <ol-style-stroke
                v-if="feature.properties && feature.properties.color"
                :color="feature.properties.color"
                :width="2"
              />
              <ol-style-circle
                v-if="feature.geometry && feature.geometry.type === 'Point'"
                :radius="7"
              >
                <ol-style-fill
                  :color="feature.properties?.color || '#3388ff'"
                />
              </ol-style-circle>
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Heatmap Layer -->
      <ol-heatmap-layer
        v-if="heatmapSource && isConnected"
        :visible="layerType === 'heatmap'"
        :blur="heatmapSettings.blur"
        :radius="heatmapSettings.radius"
        :opacity="heatmapSettings.opacity"
        :gradient="heatmapSettings.gradient"
        :z-index="2"
      >
        <ol-source-vector ref="heatmapSource" />
      </ol-heatmap-layer>

      <!-- Clustered Layer -->
      <ol-vector-layer
        v-if="clusteredSource && isConnected"
        :visible="layerType === 'clustered'"
        :z-index="3"
      >
        <ol-source-cluster
          ref="clusterSource"
          :distance="clusterSettings.distance"
          :min-distance="clusterSettings.minDistance"
        >
          <ol-source-vector ref="clusteredSource" />
        </ol-source-cluster>

        <ol-style :override-style-function="clusterStyleFunction">
          <ol-style-circle :radius="10">
            <ol-style-fill color="rgba(255, 153, 0, 0.8)" />
            <ol-style-stroke color="#fff" :width="2" />
          </ol-style-circle>
          <ol-style-text>
            <ol-style-fill color="#fff" />
          </ol-style-text>
        </ol-style>
      </ol-vector-layer>

      <!-- Drawing Interactions -->
      <ol-interaction-draw
        v-if="drawEnabled"
        :type="drawType"
        @drawend="handleDrawEnd"
      />
    </ol-map>

    <!-- Controls Panel -->
    <div class="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md z-10 overflow-auto max-h-[80vh]">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold">
          Y-GeoJSON Advanced Demo
        </h2>
        <button class="text-sm p-1" @click="showControls = !showControls">
          {{ showControls ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div v-if="showControls">
        <!-- Connection Controls -->
        <div class="mb-4 p-3 border rounded">
          <h3 class="font-medium mb-2 text-sm uppercase">
            Connection
          </h3>

          <div class="flex items-center mb-2">
            <span class="font-medium mr-2 text-sm">Status:</span>
            <span
              class="text-sm" :class="{
                'text-green-600': status === 'connected',
                'text-red-600': status === 'disconnected',
                'text-yellow-600': status === 'connecting',
              }"
            >{{ status }}</span>
          </div>

          <div class="flex items-center mb-2">
            <span class="font-medium mr-2 text-sm">Room:</span>
            <UInput
              v-model="roomName"
              class="border rounded py-1 px-2 text-sm flex-1"
              :disabled="isConnected"
            />
          </div>

          <div class="flex space-x-2 mb-2">
            <UButton
              color="blue"
              variant="solid"
              class="flex-1"
              :disabled="isConnected"
              data-test="connect-button"
              @click="connect"
            >
              Connect
            </UButton>
            <UButton
              color="red"
              variant="solid"
              class="flex-1"
              :disabled="!isConnected"
              data-test="disconnect-button"
              @click="disconnect"
            >
              Disconnect
            </UButton>
          </div>

          <div class="text-sm">
            <div>Connected users: {{ connectedUsers }}</div>
            <div>Features: {{ featureCount }}</div>
          </div>
        </div>

        <!-- Layer Controls -->
        <div class="mb-4 p-3 border rounded">
          <h3 class="font-medium mb-2 text-sm uppercase">
            Layer Type
          </h3>

          <div class="flex space-x-2 mb-2">
            <UButton
              color="blue"
              variant="solid"
              class="flex-1"
              :class="{ 'bg-opacity-100': layerType === 'vector', 'bg-opacity-70': layerType !== 'vector' }"
              :disabled="!isConnected"
              @click="layerType = 'vector'"
            >
              Vector
            </UButton>
            <UButton
              color="orange"
              variant="solid"
              class="flex-1"
              :class="{ 'bg-opacity-100': layerType === 'heatmap', 'bg-opacity-70': layerType !== 'heatmap' }"
              :disabled="!isConnected"
              @click="layerType = 'heatmap'"
            >
              Heatmap
            </UButton>
            <UButton
              color="green"
              variant="solid"
              class="flex-1"
              :class="{ 'bg-opacity-100': layerType === 'clustered', 'bg-opacity-70': layerType !== 'clustered' }"
              :disabled="!isConnected"
              @click="layerType = 'clustered'"
            >
              Clustered
            </UButton>
          </div>
        </div>

        <!-- Drawing Tools -->
        <div class="mb-4 p-3 border rounded">
          <h3 class="font-medium mb-2 text-sm uppercase">
            Drawing Tools
          </h3>

          <div class="grid grid-cols-3 gap-2 mb-2">
            <UButton
              color="purple"
              :variant="drawEnabled && drawType === 'Point' ? 'solid' : 'soft'"
              :disabled="!isConnected"
              @click="enableDrawing('Point')"
            >
              Point
            </UButton>
            <UButton
              color="purple"
              :variant="drawEnabled && drawType === 'LineString' ? 'solid' : 'soft'"
              :disabled="!isConnected"
              @click="enableDrawing('LineString')"
            >
              Line
            </UButton>
            <UButton
              color="purple"
              :variant="drawEnabled && drawType === 'Polygon' ? 'solid' : 'soft'"
              :disabled="!isConnected"
              @click="enableDrawing('Polygon')"
            >
              Polygon
            </UButton>
          </div>

          <div v-if="drawEnabled" class="flex mb-2">
            <UButton
              color="red"
              variant="solid"
              class="w-full"
              @click="disableDrawing"
            >
              Cancel Drawing
            </UButton>
          </div>
        </div>

        <!-- History Controls -->
        <div class="mb-4 p-3 border rounded">
          <h3 class="font-medium mb-2 text-sm uppercase">
            History
          </h3>

          <div class="flex space-x-2">
            <UButton
              color="gray"
              variant="solid"
              class="flex-1"
              :disabled="!isConnected || !ygeojson.canUndo()"
              @click="ygeojson.undo()"
            >
              Undo
            </UButton>
            <UButton
              color="gray"
              variant="solid"
              class="flex-1"
              :disabled="!isConnected || !ygeojson.canRedo()"
              @click="ygeojson.redo()"
            >
              Redo
            </UButton>
          </div>
        </div>

        <!-- Feature Properties -->
        <div v-if="showFeatureModal" class="mt-4 p-3 border rounded bg-gray-100 dark:bg-gray-700">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium text-sm uppercase">
              Feature Properties
            </h3>
            <button class="text-sm p-1" @click="showFeatureModal = false">
              ×
            </button>
          </div>

          <div class="mb-2">
            <label class="block text-sm font-medium mb-1">Name</label>
            <input v-model="featureProperties.name" class="w-full border rounded py-1 px-2 text-sm">
          </div>

          <div class="mb-2">
            <label class="block text-sm font-medium mb-1">Description</label>
            <UTextarea v-model="featureProperties.description" class="w-full border rounded py-1 px-2 text-sm" :rows="2" />
          </div>

          <div class="mb-2">
            <label class="block text-sm font-medium mb-1">Color</label>
            <UInput v-model="featureProperties.color" type="color" class="w-full border rounded py-1 px-2 text-sm" />
          </div>

          <div class="flex space-x-2 mt-3">
            <UButton
              color="blue"
              variant="solid"
              class="flex-1"
              @click="updateFeatureProperties"
            >
              Update
            </UButton>
            <UButton
              color="red"
              variant="solid"
              class="flex-1"
              @click="deleteSelectedFeature"
            >
              Delete
            </UButton>
          </div>
        </div>

        <div class="text-xs text-gray-600 dark:text-gray-400 mt-4">
          <p>Click on features to edit their properties.</p>
          <p>Changes are synced in real-time with other users.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input:focus,
textarea:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>
