<script setup>
import { ref } from 'vue'

const tabs = ['Load Files', 'Load Map using URL']
const activeTab = ref(tabs[0])

function selectTab(tab) {
  activeTab.value = tab
}

/** Keep track of files for demonstration. */
const droppedFiles = ref([])

/** Reference to our hidden file input. */
const fileInput = ref(null)

/** Let user pick files from their filesystem. */
function browseFiles() {
  fileInput.value?.click()
}

/** Handle files selected through the input. */
function onFileSelect(event) {
  const { files } = event.target
  if (files) {
    handleFiles(files)
    // Reset so user can select the same file again if needed
    event.target.value = ''
  }
}

/**
 * Track whether user is currently dragging files over
 * so we can style the drop zone.
 */
const isDraggingOver = ref(false)

/**
 * Track whether we are “loading” or processing files
 * (optional, if you want a spinner).
 */
const isLoading = ref(false)

/** Optional styling/logic when dragging files over the box. */
function onDragOver(event) {
  event.preventDefault()
  if (!isDraggingOver.value) {
    isDraggingOver.value = true
  }
}

/** Remove highlight when drag leaves the box. */
function onDragLeave(event) {
  event.preventDefault()
  isDraggingOver.value = false
}

/** Handle file drop. */
function onDrop(event) {
  event.preventDefault()
  isDraggingOver.value = false

  if (event.dataTransfer?.files) {
    handleFiles(event.dataTransfer.files)
  }
}

function parseGeoJSON(file) {
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const geojsonData = JSON.parse(event.target.result)
      console.log('Parsed GeoJSON:', geojsonData)
      // Optionally: process or store geojsonData in your state
      // For example: geoJSONData.value = geojsonData;
    }
    catch (err) {
      console.error('Failed to parse GeoJSON:', err)
    }
  }
  reader.readAsText(file)
  droppedFiles.value.push(file)
}

/** Process the dropped or selected files. */
function handleFiles(fileList) {
  // Show spinner (simulate some loading)
  isLoading.value = true

  // Convert to an array and iterate over each file.
  Array.from(fileList).forEach((file) => {
    // Check if the file type indicates GeoJSON or the extension is .geojson
    if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.geojson')) {
      parseGeoJSON(file)
    }
    else {
      // Handle other file types (e.g. CSV, JSON, etc.)
      droppedFiles.value.push(file)
    }
  })

  console.log('Files received:', droppedFiles.value)

  // Simulate a small delay to show the loading spinner
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
}
</script>

<template>
  <Ucard
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
           w-[600px] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden
           bg-white p-4 rounded-md"
  >
    <!-- Remove any inner max-width or width classes that could conflict -->
    <div class="p-4 font-sans">
      <h1 class="text-2xl pb-3">
        Add Data to Map
      </h1>
      <!-- Tabs -->
      <ul class="flex space-x-4 border-b border-gray-200 mb-4">
        <li v-for="tab in tabs" :key="tab">
          <button
            class="px-4 py-2"
            :class="activeTab === tab
              ? 'border-b-2 border-blue-600 text-blue-700 font-semibold'
              : 'text-gray-600 hover:text-gray-800'"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </button>
        </li>
      </ul>

      <!-- Use v-show so inactive tab content stays in the DOM -->
      <div v-show="activeTab === 'Load Files'">
        <!-- Tab Content: Load Files -->
        <div class="text-center">
          <h3 class="text-xl font-semibold">
            Upload CSV, JSON, GeoJSON, Arrow, Parquet or saved map JSON
          </h3>
          <p class="text-sm text-gray-500">
            Read more about supported file formats.
          </p>
        </div>

        <!-- Drag & Drop Box -->
        <div
          class="relative mt-4 h-[280px] p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 flex flex-col items-center justify-center"
          :class="isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <transition name="fade">
            <div
              v-if="isLoading"
              class="absolute inset-0 bg-white bg-opacity-70 flex flex-col justify-center items-center"
            >
              <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500 mb-2" />
            </div>
          </transition>

          <div class="flex space-x-2 mb-4 text-gray-700 pointer-events-none">
            <span class="px-2 py-1 bg-gray-100 rounded">CSV</span>
            <span class="px-2 py-1 bg-gray-100 rounded">JSON</span>
            <span class="px-2 py-1 bg-gray-100 rounded">GeoJSON</span>
            <span class="px-2 py-1 bg-gray-100 rounded">Arrow</span>
            <span class="px-2 py-1 bg-gray-100 rounded">Parquet</span>
          </div>

          <p class="text-gray-700 pointer-events-none">
            Drag & Drop Your File(s) Here
          </p>
          <p class="text-gray-500 pointer-events-none">
            or
            <button class="underline text-blue-600 pointer-events-auto" @click="browseFiles">
              browse your files
            </button>
          </p>

          <!-- Hidden File Input -->
          <input
            ref="fileInput"
            type="file"
            multiple
            class="hidden"
            @change="onFileSelect"
          >
        </div>
        <!-- Show list of dropped files, if any -->
        <div v-if="droppedFiles.length" class="mt-4">
          <h4 class="text-sm font-semibold mb-2">
            Processed Files:
          </h4>
          <ul class="list-disc list-inside text-sm text-gray-700">
            <li v-for="(file, index) in droppedFiles" :key="index">
              {{ file.name }}
            </li>
          </ul>
        </div>
      </div>

      <div v-show="activeTab === 'Load Map using URL'" class="text-center">
        <p>URL content...</p>
      </div>

      <!-- Add any additional tab content here, using v-show -->
    </div>
  </Ucard>
</template>

<style scoped>
/* A simple fade transition for the spinner overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
