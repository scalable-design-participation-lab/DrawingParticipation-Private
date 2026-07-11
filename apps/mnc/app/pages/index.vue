<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@base/stores/user'
import { useMapStore } from '@base/stores/map'
import type { MapType, Feature } from '@base/stores/types/store'
import { useDb } from '../stores/db'
import { useFilterStore } from '../stores/filter'
import { useSolutionsStore } from '../stores/solutions'
import { useContributionsStore } from '../stores/contributions'
import { useAuthStore } from '../stores/auth'
import { useIsMobile } from '../composables/useIsMobile'

// Map store
const userStore = useUserStore()
const mapStore = useMapStore()
const dbStore = useDb()
const filterStore = useFilterStore()
const solutionsStore = useSolutionsStore()
const contributionsStore = useContributionsStore()
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

// "Join Our Research" contribute flow. On mobile it's the "More" nav view; on
// desktop it opens from the ➕ toolbar button (showContribute).
const pickingContributeLocation = ref(false)
const contributeCoordinate = ref<[number, number] | null>(null)
const showContribute = ref(false)

function closeContribute() {
  mobileView.value = 'map'
  pickingContributeLocation.value = false
}

function closeDesktopContribute() {
  showContribute.value = false
  pickingContributeLocation.value = false
  contributeCoordinate.value = null
}

// Desktop: a tap on the empty map opens the contribute wizard, pre-seeded with
// the tapped point as the entry's location/pin.
function onMapAddEntry(coordinate: [number, number]) {
  contributeCoordinate.value = coordinate
  showContribute.value = true
}

// The desktop ➕ toggles the wizard (so it can show a "selected" state).
function toggleContribute() {
  if (showContribute.value)
    closeDesktopContribute()
  else
    showContribute.value = true
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

// The "Join Our Research" wizard submits a new map entry. Persist it exactly
// like a desktop add: a pending userSolutions pin + its media, plus the private
// contact info. Best-effort — the wizard already shows its thank-you screen.
async function onContributeSubmit(payload: any) {
  if (!payload?.coordinate)
    return
  try {
    const stringId = await solutionsStore.addSolution({
      title: payload.title,
      primaryTag: payload.primaryTag,
      location: payload.location,
      coordinate: payload.coordinate,
      shortDesc: (payload.example || '').slice(0, 140),
      description: payload.example || '',
      mncConnection: payload.why || '',
      date: payload.date || '',
    })

    // Attach every uploaded file (across the wizard's steps) to the new entry,
    // through the same pending-contributions pipeline a desktop add uses.
    const f = payload.files || {}
    const allFiles: File[] = [...(f.example || []), ...(f.why || []), ...(f.media || []), ...(f.additional || [])]
    if (allFiles.length && stringId) {
      const media = []
      for (const file of allFiles)
        media.push(await contributionsStore.uploadFile(stringId, file))
      if (media.length)
        await contributionsStore.addContribution(stringId, { comment: '', media })
    }

    // Personal contact info goes to the admin-only collection, never the pin.
    await solutionsStore.addEntryContact(stringId, {
      connectInfo: payload.connectInfo ?? null,
      fullName: payload.fullName || '',
      email: payload.email || '',
      country: payload.country || '',
      city: payload.city || '',
    })
  }
  catch (e) {
    console.warn('Could not persist entry from the research flow:', e)
  }
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
        @add-entry-at="onMapAddEntry"
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

      <!-- Desktop only. Hidden while the contribute wizard is open so its
           step-1 (click-through, map visible) doesn't overlap the top filter
           bar or the bottom toolbar. -->
      <ThemeFilterBar v-if="!isMobile && !showContribute" />
      <BottomBar
        v-if="!isMobile"
        :adding="showContribute"
        @contribute="toggleContribute"
        @info="showOnboarding = true"
      />

      <!-- "Join Our Research" wizard on desktop (same flow as mobile's "More"
           tab), opened from the ➕ toolbar button. -->
      <MobileContributeFlow
        v-if="!isMobile && showContribute"
        v-show="!pickingContributeLocation"
        :picked-coordinate="contributeCoordinate"
        @pick-location="startContributePick"
        @close="closeDesktopContribute"
        @submit="onContributeSubmit"
      />
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
           get the review panel after signing in). On mobile the bottom zone is
           shared with the nav pill and the list/contribute/info flows, so the
           moderator controls only appear in the map view (moderation is map-
           centric — it flies to pins) to avoid stacking buttons on top of each
           other. Always present on desktop. -->
      <AdminBar v-if="!isMobile || mobileView === 'map'" />

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
