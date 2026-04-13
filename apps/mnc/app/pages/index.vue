<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@base/stores/user'
import { useMapStore } from '@base/stores/map'
import type { MapType } from '@base/stores/types/store'
import { useDb } from '../stores/db'

// Map store
const userStore = useUserStore()
const mapStore = useMapStore()
const dbStore = useDb()
const { setMapType } = mapStore
const currentMapType = ref('vector')
const isLoading = ref(true)
const headerPrimaryAccentColor = '#4FA19D'

const leftItems = ref([
  {
    label: 'Mobile Networked Creativity',
    color: 'black',
    to: '/about/',
  },
])

const rightItems = ref([
  {
    icon: 'i-heroicons-arrow-down-tray-20-solid',
    onClick: () => (showDownloadModal.value = true),
  },
  {
    icon: computed(() =>
      currentMapType.value === 'vector'
        ? 'i-heroicons:map'
        : 'i-heroicons:globe-americas-20-solid',
    ),
    onClick: () => {
      currentMapType.value
        = currentMapType.value === 'vector' ? 'satellite' : 'vector' 
      setMapType(currentMapType.value as MapType)
    },
  },
])

const showDownloadModal = ref(false)
const showOnboarding = ref(true)

async function handleDownload(options: {
  dataType: string
  dateRange: [Date | null, Date | null]
  region: string[]
  format: string
}) {
  try {
    const { dataType, dateRange, region, format } = options

    // Here you would implement the actual API call or data processing
    console.log('Downloading data with options:', {
      dataType,
      dateRange,
      region,
      format,
    })

    // Example download implementation
    const data = {
      // Your data here
    }

    // Create and trigger download
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(data) : convertToCSV(data)],
      { type: format === 'json' ? 'application/json' : 'text/csv' },
    )

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ukraine-data.${format}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    console.error('Download failed:', error)
  }
}

// Add this helper function for CSV conversion
function convertToCSV(data: any) {
  // Implement CSV conversion logic here
  return 'data,in,csv,format'
}
function handleCloseOnboarding() {
  showOnboarding.value = false
}
// Initialize app
async function initializeApp() {
  try {
    // Simulate loading time for map initialization
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
    
    // Load data AFTER map is ready
    setTimeout(async () => {
      try {
        await dbStore.loadDataIntoFeatures()
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }, 500)
  }
  catch (error) {
    console.error('Error initializing app:', error)
    isLoading.value = false
  }
}

// Initialize on mount
onMounted(() => {
  initializeApp()
})
</script>

<template>
  <div class="relative">
    <!-- Loading Screen -->
    <LoadingScreen v-if="isLoading" />

    <!-- Main Content -->
    <div v-show="!isLoading">
      <BackgroundMap
        :class="{ 'filter blur-md': showOnboarding }"
        :show-all-plus-icons="true"
        :show-comment-icons="false"
      />
      <GeneralizedHeader
        class="z-20"
        :left-items="leftItems"
        :right-items="rightItems"
        :primary-accent-color="headerPrimaryAccentColor"
      />
      <GeneralizedFooter class="z-20" />
      <OnboardingModal
        :is-visible="showOnboarding"
        @close="handleCloseOnboarding"
      />
      <div
        class="absolute inset-0 bg-black bg-opacity-50 z-40"
        :class="{ 'hidden': !showOnboarding }"
      ></div>
      <Teleport to="body">
        <!-- <DownloadModalHurtoma
          v-model="showDownloadModal"
          @download="handleDownload"
        /> -->
        <CommingSoon
          v-model="showDownloadModal"
          @download="handleDownload"
         />
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.blur-md {
  filter: blur(8px);
}
</style>
