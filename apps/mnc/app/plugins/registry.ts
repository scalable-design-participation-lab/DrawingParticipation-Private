import { registerComponent } from '../../../../base/app/utils/registry'
import AdminAccounts from '../components/AdminAccounts.vue'
import EntryDetail from '../components/EntryDetail.vue'
import FilteredSelectionSidebar from '../components/FilteredSelectionSidebar.vue'
import MncMap from '../components/MncMap.vue'
import MobileBottomNav from '../components/Mobile/MobileBottomNav.vue'
import MobileContributeFlow from '../components/Mobile/MobileContributeFlow.vue'
import MobileHeader from '../components/Mobile/MobileHeader.vue'
import MobileInfoPopup from '../components/Mobile/MobileInfoPopup.vue'
import MobileProximityList from '../components/Mobile/MobileProximityList.vue'
import ModerationPanel from '../components/ModerationPanel.vue'
import OnboardingModal from '../components/OnboardingModal.vue'
import ProjectListPanel from '../components/ProjectListPanel.vue'
import ThemeFilterBar from '../components/ThemeFilterBar.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that the JSON specs may reference.
export default defineNuxtPlugin(() => {
  for (const [name, component] of Object.entries({
    MncMap,
    ThemeFilterBar,
    FilteredSelectionSidebar,
    ProjectListPanel,
    MobileProximityList,
    MobileHeader,
    MobileBottomNav,
    MobileContributeFlow,
    MobileInfoPopup,
    EntryDetail,
    ModerationPanel,
    AdminAccounts,
    OnboardingModal,
  })) {
    registerComponent(name, component)
  }
  registerHandlers()
})
