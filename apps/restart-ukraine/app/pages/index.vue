<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@base/stores/user'
import { useMapStore } from '@base/stores/map'
import { useAllFeatureStore } from '@base/stores/all-features'
import { useFeatureStore } from '@base/stores/features'
import { getAuth } from 'firebase/auth'
import type { MapType } from '@base/stores/types/store'

// Map store
const userStore = useUserStore()
const mapStore = useMapStore()
const allFeatureStore = useAllFeatureStore()
const featureStore = useFeatureStore()
const auth = getAuth()
const { setMapType } = mapStore
const currentMapType = ref('vector')
const isLoading = ref(true)

const leftItems = ref([
  {
    label: 'Drawing Participation',
    color: 'black',
    to: '/about/',
  },
  {
    label: 'Гуртомá',
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

const isMapBlurred = computed(() => userStore.showRegistration)

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

function handleShowRegistration() {
  showOnboarding.value = false
  userStore.showRegistration = true
}

function handleCloseRegistration() {
  userStore.showRegistration = false
}

// Initialize app
async function initializeApp() {
  try {
    // Simulate loading time for map initialization
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if user is logged in on app start
    if (!userStore.currentUser) {
      // If no user, show onboarding first
      showOnboarding.value = true
    } else {
      // If user is logged in, don't show any modals
      showOnboarding.value = false
      userStore.showRegistration = false
      
      // Load current user's features for editing
      const currentUser = auth.currentUser
      if (currentUser?.uid) {
        await allFeatureStore.fetchFeaturesForUser(currentUser.uid)
        // Copy to feature store for the main map
        featureStore.features.splice(0, featureStore.features.length, ...allFeatureStore.allFeatures)
      }
    }
    
    isLoading.value = false
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

// React to auth/user changes: clear or reload features
watch(
  () => userStore.currentUser,
  async (uid) => {
    if (!uid) {
      // user logged out: clear editable features
      featureStore.features.splice(0, featureStore.features.length)
      return
    }
    // user logged in/switched: fetch only their features
    await allFeatureStore.fetchFeaturesForUser(uid as string)
    featureStore.features.splice(0, featureStore.features.length, ...allFeatureStore.allFeatures)
  },
)
</script>

<template>
  <div class="relative">
    <!-- Loading Screen -->
    <LoadingScreen v-if="isLoading" />

    <!-- Main Content -->
    <div v-show="!isLoading">
      <SideBar class="z-30" />
      <BackgroundMap
        :class="{ 'filter blur-md': isMapBlurred }"
        :show-all-plus-icons="true"
        :show-comment-icons="false"
      />
      <GeneralizedHeader
        class="z-20"
        :left-items="leftItems"
        :right-items="rightItems"
        logo-src="/restart-logo-icon.svg"
        logo-alt="Restart Agency Logo"
        logo-link="https://www.restartfuture.org/"
      />
      <GeneralizedFooter class="z-20" />
      <OnboardingModal
        :is-visible="showOnboarding"
        @show-registration="handleShowRegistration"
      />
      <RegistrationModal
        :is-visible="userStore.showRegistration"
        @close="handleCloseRegistration"
      />
      <div
        v-if="isMapBlurred"
        class="absolute inset-0 bg-black bg-opacity-50 z-40"
        @click.self="userStore.showRegistration = true"
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