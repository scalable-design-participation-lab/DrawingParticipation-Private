<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@base/stores/user'
import { useMapStore } from '@base/stores/map'
import type { MapType, Feature } from '@base/stores/types/store'
import { useDb } from '../stores/db'
import { useFilterStore } from '../stores/filter'
import { useSolutionsStore } from '../stores/solutions'
import { useAuthStore } from '../stores/auth'
import { useIsMobile } from '../composables/useIsMobile'

// Map store
const userStore = useUserStore()
const mapStore = useMapStore()
const dbStore = useDb()
const filterStore = useFilterStore()
const solutionsStore = useSolutionsStore()
const authStore = useAuthStore()
const { setMapType } = mapStore
const currentMapType = ref('vector')
const isLoading = ref(true)
const headerPrimaryAccentColor = '#4FA19D'

// Mobile state
const { isMobile } = useIsMobile()
type MobileView = 'map' | 'list' | 'info' | 'more'
const mobileView = ref<MobileView>('map')
const selectedMobileFeature = ref<Feature | null>(null)
const projectCardState = ref<'expanded' | 'full'>('expanded')

// Mobile "Join Our Research" contribute flow (launched from the "More" nav).
const pickingContributeLocation = ref(false)
const contributeCoordinate = ref<[number, number] | null>(null)

function closeContribute() {
  mobileView.value = 'map'
  pickingContributeLocation.value = false
}

// The flow asks us to hide it so the user can tap the map for a location pin.
function startContributePick() {
  pickingContributeLocation.value = true
}

// A map tap during picking: store the coordinate and restore the flow.
function onContributePicked(coordinate: [number, number]) {
  contributeCoordinate.value = coordinate
  pickingContributeLocation.value = false
}

function onContributeSubmit(payload: unknown) {
  // Front-end-only shell for now — persistence is deferred until the
  // submission content model is finalized.
  console.warn('[contribute] submission payload (not persisted yet):', payload)
}

function selectMobileFeature(feature: Feature) {
  selectedMobileFeature.value = feature
  mobileView.value = 'map'
  projectCardState.value = 'expanded'
}

function closeMobileProject() {
  selectedMobileFeature.value = null
}

// The title links out to the main MNC website (mobilecreativity.net), which
// also carries the team page — so the in-app "About" is no longer needed.
const leftItems = ref([
  {
    label: 'Mobile Networked Creativity',
    color: 'black',
    to: 'https://mobilecreativity.net',
  },
])

// Persistent language switcher (English / Portuguese) in the header.
const { locale, setLocale } = useI18n()
function toggleLocale() {
  setLocale(locale.value === 'en' ? 'pt' : 'en')
}

const rightItems = ref([
  {
    label: computed(() => (locale.value === 'en' ? 'PT' : 'EN')),
    onClick: toggleLocale,
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

function handleCloseOnboarding() {
  showOnboarding.value = false
}
// Initialize app
async function initializeApp() {
  try {
    // Brief splash while the map mounts (it lives behind v-show, so it is
    // already in the DOM — no need to stall for seconds).
    await new Promise(resolve => setTimeout(resolve, 400))
    isLoading.value = false

    // Load case-study data, then user-submitted solutions (best-effort).
    await dbStore.loadDataIntoFeatures()
    await solutionsStore.fetchSolutions()
  }
  catch (error) {
    console.error('Error initializing app:', error)
    isLoading.value = false
  }
}

// Initialize on mount
onMounted(() => {
  authStore.init()
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
        :picking-location="pickingContributeLocation"
        @select-feature="selectMobileFeature"
        @pick-location="onContributePicked"
      />
      <MobileHeader
        v-if="isMobile"
        :color="headerPrimaryAccentColor"
      />
      <GeneralizedHeader
        v-else
        class="z-20"
        :left-items="leftItems"
        :right-items="rightItems"
        :primary-accent-color="headerPrimaryAccentColor"
        :show-icon="false"
        :show-menu="false"
        logo-src="/mnc-logo.svg"
        logo-link="https://mobilecreativity.net"
        logo-alt="Mobile Networked Creativity"
      />

      <!-- Desktop only -->
      <ThemeFilterBar v-if="!isMobile" />
      <BottomBar v-if="!isMobile" />
      <!-- Help: re-open the intro/onboarding for a quick refresher -->
      <button
        v-if="!isMobile"
        type="button"
        :aria-label="$t('nav.help')"
        class="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-zinc-900 text-lg font-semibold text-gray-500 dark:text-gray-300 shadow-lg border border-gray-200 dark:border-white/10 transition-transform hover:scale-105"
        @click="showOnboarding = true"
      >
        ?
      </button>
      <FilteredSelectionSidebar v-if="!isMobile && filterStore.isPanelOpen" />
      <ProjectListPanel v-if="!isMobile && filterStore.isListOpen" />

      <!-- Mobile only -->
      <template v-if="isMobile">
        <MobileProximityList
          v-if="mobileView === 'list'"
          @select-feature="selectMobileFeature"
        />
        <MobileInfoPopup
          v-if="selectedMobileFeature"
          :feature="selectedMobileFeature"
          :state="projectCardState"
          @update:state="projectCardState = $event"
          @close="closeMobileProject"
        />
        <MobileBottomNav
          :active-view="mobileView"
          :project-selected="!!selectedMobileFeature"
          @update:active-view="mobileView = $event"
          @close-project="closeMobileProject"
        />

        <MobileContributeFlow
          v-if="mobileView === 'more'"
          v-show="!pickingContributeLocation"
          :picked-coordinate="contributeCoordinate"
          @pick-location="startContributePick"
          @close="closeContribute"
          @submit="onContributeSubmit"
        />

        <!-- "Info" tab: reuse the intro as an about/help panel -->
        <OnboardingModal
          v-if="mobileView === 'info'"
          :is-visible="true"
          @close="mobileView = 'map'"
        />
      </template>

      <!-- Moderator sign-in + entry review (visible to everyone; only admins
           get the review panel after signing in). -->
      <AdminBar />

      <OnboardingModal
        :is-visible="showOnboarding"
        @close="handleCloseOnboarding"
      />
      <div
        class="absolute inset-0 bg-black bg-opacity-50 z-40"
        :class="{ 'hidden': !showOnboarding }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.blur-md {
  filter: blur(8px);
}
</style>
