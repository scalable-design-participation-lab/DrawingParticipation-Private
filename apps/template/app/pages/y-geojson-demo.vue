<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { YGeoJSON } from 'y-geojson'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import type { Feature } from 'geojson'

// Y-GeoJSON integration
const ygeojson = ref(YGeoJSON())
const provider = ref<WebsocketProvider | null>(null)
const status = ref('Disconnected')
const mapRef = ref(null)
const mapInstance = ref(null)
const vectorSource = ref(null)
const vectorLayer = ref(null)
const drawEnabled = ref(false)
const drawInteraction = ref(null)
const syncing = ref(false)

// UI state
const showControls = ref(true)
const roomName = ref('demo-room')
const isConnected = ref(false)
const connectedUsers = ref(0)
const featureCount = ref(0)

// Format for display purposes
function formatGeoJSON(obj: any) {
  return JSON.stringify(obj, null, 2)
}

// Connect to the y-websocket provider
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
    const states = Array.from(provider.value!.awareness.getStates().values())
    connectedUsers.value = states.length
  })

  // Subscribe to feature changes
  ygeojson.value.onFeatureChange((changes) => {
    console.log('Feature changes detected:', changes)
    if (!syncing.value) {
      syncMapWithYjs()
    }
    countFeatures()
  })
}

// Synchronize map with y-geojson state
function syncMapWithYjs() {
  if (!mapInstance.value || !vectorSource.value)
    return

  syncing.value = true

  try {
    // Clear existing features
    vectorSource.value.clear()

    // Get all features from y-geojson
    const features = ygeojson.value.getFeatures()

    // Convert GeoJSON features to OpenLayers features
    Object.values(features).forEach((feature: Feature) => {
      if (feature.geometry) {
        const olFeature = new window.ol.Feature({
          geometry: new window.ol.format.GeoJSON().readGeometry(
            feature.geometry,
            { featureProjection: 'EPSG:3857' },
          ),
        })

        // Store the original feature ID for later reference
        olFeature.set('id', feature.id)

        // Add custom styling based on properties if they exist
        if (feature.properties) {
          if (feature.properties.color) {
            olFeature.setStyle(
              new window.ol.style.Style({
                fill: new window.ol.style.Fill({
                  color: `${feature.properties.color}80`, // Add transparency
                }),
                stroke: new window.ol.style.Stroke({
                  color: feature.properties.color,
                  width: 2,
                }),
                image: new window.ol.style.Circle({
                  radius: 7,
                  fill: new window.ol.style.Fill({
                    color: feature.properties.color,
                  }),
                }),
              }),
            )
          }
        }

        vectorSource.value.addFeature(olFeature)
      }
    })

    countFeatures()
  }
  finally {
    syncing.value = false
  }
}

// Count features in the current collection
function countFeatures() {
  const features = ygeojson.value.getFeatures()
  featureCount.value = Object.keys(features).length
}

// Add a random point to the map
function addRandomPoint() {
  // Generate a random coordinate within the current map view
  const extent = mapInstance.value.getView().calculateExtent(mapInstance.value.getSize())
  const x = Math.random() * (extent[2] - extent[0]) + extent[0]
  const y = Math.random() * (extent[3] - extent[1]) + extent[1]

  // Create a GeoJSON point feature
  const point = {
    type: 'Feature',
    id: `point-${Date.now()}`,
    geometry: {
      type: 'Point',
      coordinates: [x, y],
    },
    properties: {
      name: `Point ${Date.now()}`,
      color: getRandomColor(),
      timestamp: new Date().toISOString(),
    },
  }

  // Add the feature to y-geojson
  ygeojson.value.addFeature(point as any)
}

// Add a random polygon to the map
function addRandomPolygon() {
  // Generate a random coordinate within the current map view
  const extent = mapInstance.value.getView().calculateExtent(mapInstance.value.getSize())
  const centerX = Math.random() * (extent[2] - extent[0]) + extent[0]
  const centerY = Math.random() * (extent[3] - extent[1]) + extent[1]

  // Create a polygon around this center
  const radius = Math.random() * 5000 + 1000
  const sides = Math.floor(Math.random() * 4) + 3 // 3 to 6 sides
  const coords = []

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    coords.push([x, y])
  }

  // Close the polygon
  coords.push(coords[0])

  // Create a GeoJSON polygon feature
  const polygon = {
    type: 'Feature',
    id: `polygon-${Date.now()}`,
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {
      name: `Polygon ${Date.now()}`,
      color: getRandomColor(),
      timestamp: new Date().toISOString(),
    },
  }

  // Add the feature to y-geojson
  ygeojson.value.addFeature(polygon as any)
}

// Get a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// Toggle drawing mode
function toggleDrawing() {
  if (!drawEnabled.value) {
    enableDrawing()
  }
  else {
    disableDrawing()
  }
}

// Enable drawing interaction
function enableDrawing() {
  if (!mapInstance.value)
    return

  drawEnabled.value = true

  // Create draw interaction
  drawInteraction.value = new window.ol.interaction.Draw({
    source: vectorSource.value,
    type: 'Polygon',
  })

  // Add the interaction to the map
  mapInstance.value.addInteraction(drawInteraction.value)

  // Listen for drawing end to add the feature to y-geojson
  drawInteraction.value.on('drawend', (event) => {
    const olFeature = event.feature
    const geom = olFeature.getGeometry()
    const geojsonFormat = new window.ol.format.GeoJSON()

    // Convert OpenLayers geometry to GeoJSON
    const geojsonGeom = geojsonFormat.writeGeometryObject(geom, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326',
    })

    // Create a GeoJSON feature
    const feature = {
      type: 'Feature',
      id: `drawn-${Date.now()}`,
      geometry: geojsonGeom,
      properties: {
        name: `Drawn ${Date.now()}`,
        color: getRandomColor(),
        timestamp: new Date().toISOString(),
      },
    }

    // Add the feature to y-geojson
    ygeojson.value.addFeature(feature as any)
  })
}

// Disable drawing interaction
function disableDrawing() {
  if (!mapInstance.value || !drawInteraction.value)
    return

  drawEnabled.value = false
  mapInstance.value.removeInteraction(drawInteraction.value)
  drawInteraction.value = null
}

// Handle map click to select and delete features
function handleMapClick(event) {
  if (drawEnabled.value)
    return

  mapInstance.value.forEachFeatureAtPixel(event.pixel, (feature) => {
    const featureId = feature.get('id')

    if (confirm(`Delete feature ${featureId}?`)) {
      ygeojson.value.deleteFeatureById(featureId)
    }

    return true // Stop at first feature
  })
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

// Cleanup on component unmount
onUnmounted(() => {
  disconnect()
})

// Initialize the map and connections
onMounted(() => {
  if (mapRef.value) {
    nextTick(() => {
      mapInstance.value = mapRef.value.mapInstance

      // Wait for the map to be fully initialized
      setTimeout(() => {
        // Create vector source and layer
        vectorSource.value = new window.ol.source.Vector()
        vectorLayer.value = new window.ol.layer.Vector({
          source: vectorSource.value,
          style: new window.ol.style.Style({
            fill: new window.ol.style.Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new window.ol.style.Stroke({
              color: '#ffcc33',
              width: 2,
            }),
            image: new window.ol.style.Circle({
              radius: 7,
              fill: new window.ol.style.Fill({
                color: '#ffcc33',
              }),
            }),
          }),
        })

        // Add the vector layer to the map
        mapInstance.value.addLayer(vectorLayer.value)

        // Add click handler
        mapInstance.value.on('click', handleMapClick)
      }, 500)
    })
  }
})
</script>

<template>
  <div class="relative w-full h-screen">
    <!-- Map Component -->
    <GeneralizedBackgroundMap ref="mapRef" :min-zoom="0">
      <template #layers>
        <!-- Layers added programmatically -->
      </template>
    </GeneralizedBackgroundMap>

    <!-- Controls Panel -->
    <div class="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs z-10 overflow-auto max-h-[80vh]">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold">
          Y-GeoJSON Demo
        </h2>
        <button class="text-sm p-1" @click="showControls = !showControls">
          {{ showControls ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div v-if="showControls">
        <div class="mb-4">
          <div class="flex items-center mb-2">
            <span class="font-medium mr-2">Status:</span>
            <span
              class="text-sm" :class="{
                'text-green-600': status === 'connected',
                'text-red-600': status === 'disconnected',
                'text-yellow-600': status === 'connecting',
              }"
            >{{ status }}</span>
          </div>

          <div class="flex items-center mb-2">
            <span class="font-medium mr-2">Room:</span>
            <input
              v-model="roomName" class="border rounded py-1 px-2 text-sm flex-1"
              :disabled="isConnected"
            >
          </div>

          <div class="flex space-x-2 mb-2">
            <button
              class="bg-blue-500 text-white px-3 py-1 rounded text-sm" :disabled="isConnected"
              @click="connect"
            >
              Connect
            </button>
            <button
              class="bg-red-500 text-white px-3 py-1 rounded text-sm" :disabled="!isConnected"
              @click="disconnect"
            >
              Disconnect
            </button>
          </div>

          <div class="text-sm mb-2">
            <div>Connected users: {{ connectedUsers }}</div>
            <div>Features: {{ featureCount }}</div>
          </div>
        </div>

        <div class="mb-4">
          <div class="font-medium mb-2">
            Actions
          </div>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <button
              class="bg-green-500 text-white px-3 py-1 rounded text-sm" :disabled="!isConnected"
              @click="addRandomPoint"
            >
              Add Point
            </button>
            <button
              class="bg-purple-500 text-white px-3 py-1 rounded text-sm" :disabled="!isConnected"
              @click="addRandomPolygon"
            >
              Add Polygon
            </button>
          </div>

          <div class="flex mb-2">
            <button
              :class="drawEnabled ? 'bg-orange-500' : 'bg-green-500'"
              class="w-full text-white px-3 py-1 rounded text-sm"
              :disabled="!isConnected"
              @click="toggleDrawing"
            >
              {{ drawEnabled ? 'Cancel Drawing' : 'Draw Polygon' }}
            </button>
          </div>

          <div class="flex mb-2">
            <button
              class="bg-gray-500 text-white px-3 py-1 rounded text-sm flex-1 mr-1" :disabled="!isConnected || !ygeojson.canUndo()"
              @click="ygeojson.undo()"
            >
              Undo
            </button>
            <button
              class="bg-gray-500 text-white px-3 py-1 rounded text-sm flex-1 ml-1" :disabled="!isConnected || !ygeojson.canRedo()"
              @click="ygeojson.redo()"
            >
              Redo
            </button>
          </div>
        </div>

        <div class="text-xs text-gray-600 dark:text-gray-400">
          <p>Click on a feature to delete it.</p>
          <p>Changes are synced in real-time with other users in the same room.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles */
</style>
