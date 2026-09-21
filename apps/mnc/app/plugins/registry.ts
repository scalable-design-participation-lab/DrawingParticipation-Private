import { registerComponent } from '../../../../base/app/utils/registry'
import AdminAccounts from '../components/AdminAccounts.vue'
import BottomBar from '../components/BottomBar.vue'
import EntryDetail from '../components/EntryDetail.vue'
import FilteredSelectionSidebar from '../components/FilteredSelectionSidebar.vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
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
export default defineNuxtPlugin((nuxtApp) => {
  for (const [name, component] of Object.entries({
    MncMap,
    ThemeFilterBar,
    BottomBar,
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
    LocaleSwitcher,
  })) {
    registerComponent(name, component)
  }
  const i18n = (nuxtApp as unknown as { $i18n?: { setLocale: (code: string) => void } }).$i18n
  registerHandlers(code => i18n?.setLocale(code))
})
