<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { YGeoJSON } from 'y-geojson'
import { WebsocketProvider } from 'y-websocket'
import type { Feature } from 'geojson'
import { GeoJSON as OlGeoJSON } from 'ol/format'

// Y-GeoJSON integration
const ygeojson = ref(YGeoJSON())
const provider = ref<WebsocketProvider | null>(null)
const status = ref('Disconnected')
const isConnected = ref(false)
const roomName = ref('drawing-demo-room')
const connectedUsers = ref(0)
const userColor = ref(getRandomColor())

// OpenLayers map reference
const mapRef = ref(null)
const mapInstance = ref(null)

// Drawing controls
const drawEnable = ref(true)
const drawType = ref('Polygon')
const features = ref<Feature[]>([])
const featureCount = ref(0)

// Connection controls
const showConnectionPanel = ref(true)

// Function to generate random color for user
function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// Connect to YJS WebSocket provider
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
    syncMapWithYjs()
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

// Synchronize map with y-geojson state
function syncMapWithYjs() {
  if (!isConnected.value)
    return

  try {
    // Get all features from y-geojson
    const yFeatures = ygeojson.value.getFeatures()

    // Update the features ref for rendering
    features.value = Object.values(yFeatures)
  }
  catch (error) {
    console.error('Error syncing with Yjs:', error)
  }
}

// Count features in the current geojson
function countFeatures() {
  const features = ygeojson.value.getFeatures()
  featureCount.value = Object.keys(features).length
}

// Handle drawing start
function drawstart(event) {
  console.log('Drawing started:', event)
}

// Handle drawing end to add features to y-geojson
function drawend(event) {
  console.log('Drawing ended:', event)

  if (!isConnected.value) {
    console.warn('Not connected to Yjs server. Feature will not be shared.')
    return
  }

  const olFeature = event.feature
  const geom = olFeature.getGeometry()

  // Convert OpenLayers geometry to GeoJSON
  const format = new OlGeoJSON()
  const geojsonGeom = format.writeGeometryObject(geom, {
    featureProjection: 'EPSG:4326',
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
    },
  }

  // Add the feature to y-geojson
  ygeojson.value.addFeature(feature as any)
}

// Initialize map on mount
onMounted(() => {
  nextTick(() => {
    if (mapRef.value) {
      mapInstance.value = mapRef.value.mapInstance

      // Connect automatically if not connected
      if (!isConnected.value) {
        connect()
      }
    }
  })
})

// Cleanup on unmount
onUnmounted(() => {
  disconnect()
})
</script>

<template>
  <div class="relative w-full h-screen">
    <ol-map
      ref="mapRef"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      class="w-full h-screen"
    >
      <ol-view
        :center="[0, 0]"
        :zoom="2"
        projection="EPSG:4326"
      />

      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <ol-vector-layer>
        <ol-source-vector>
          <!-- Render existing features from y-geojson -->
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
              <ol-style-stroke :color="feature.properties?.color || 'blue'" :width="2" />
              <ol-style-fill :color="`${feature.properties?.color || 'blue'}40`" />
              <ol-style-circle
                v-if="feature.geometry && feature.geometry.type === 'Point'"
                :radius="7"
              >
                <ol-style-fill :color="feature.properties?.color || 'blue'" />
                <ol-style-stroke color="white" :width="2" />
              </ol-style-circle>
            </ol-style>
          </ol-feature>

          <!-- Drawing interaction -->
          <ol-interaction-draw
            v-if="drawEnable && isConnected"
            :type="drawType"
            @drawend="drawend"
            @drawstart="drawstart"
          >
            <ol-style>
              <ol-style-stroke :color="userColor" :width="2" />
              <ol-style-fill :color="`${userColor}40`" />
              <ol-style-circle :radius="5">
                <ol-style-fill :color="userColor" />
                <ol-style-stroke color="white" :width="2" />
              </ol-style-circle>
            </ol-style>
          </ol-interaction-draw>
        </ol-source-vector>
      </ol-vector-layer>
    </ol-map>

    <!-- Main Controls Panel -->
    <div class="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md z-10 overflow-auto max-h-[80vh]">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold">
          Y-GeoJSON Demo
        </h2>
        <button class="text-sm p-1" @click="showConnectionPanel = !showConnectionPanel">
          {{ showConnectionPanel ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div v-if="showConnectionPanel">
        <!-- Connection Controls -->
        <div class="mb-4 p-3 border rounded">
          <h3 class="font-medium mb-2 text-sm uppercase">
            Connection
          </h3>

          <div class="flex items-center mb-2">
            <span class="font-medium mr-2 text-sm">Status:</span>
            <span
              class="text-sm"
              :class="{
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
              @click="connect"
            >
              Connect
            </UButton>
            <UButton
              color="red"
              variant="solid"
              class="flex-1"
              :disabled="!isConnected"
              @click="disconnect"
            >
              Disconnect
            </UButton>
          </div>

          <div class="text-sm">
            <div>Connected users: {{ connectedUsers }}</div>
            <div>Features: {{ featureCount }}</div>
            <div>Your color: <span class="inline-block w-4 h-4 rounded-full" :style="{ backgroundColor: userColor }" /></div>
          </div>
        </div>

        <!-- Drawing Controls -->
        <div class="mb-4 p-3 border rounded">
          <h3 class="font-medium mb-2 text-sm uppercase">
            Drawing Tools
          </h3>

          <UFormGroup label="Draw Mode Enabled">
            <UCheckbox v-model="drawEnable" :disabled="!isConnected" />
          </UFormGroup>
          <UFormGroup label="Geometry Type">
            <USelect
              v-model="drawType"
              :options="[
                { label: 'Point', value: 'Point' },
                { label: 'LineString', value: 'LineString' },
                { label: 'Polygon', value: 'Polygon' },
              ]"
              :disabled="!isConnected"
            />
          </UFormGroup>
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

        <div class="text-xs text-gray-600 dark:text-gray-400 mt-4">
          <p>Draw shapes on the map to share them in real-time.</p>
          <p>All changes are synchronized with other connected users.</p>
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
