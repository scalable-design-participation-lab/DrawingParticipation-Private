import { registerComponent } from '../../../../base/app/utils/registry'
import AnalysisLayers from '../components/AnalysisLayers.vue'
import AnalysisPanel from '../components/AnalysisPanel.vue'
import BackgroundMap from '../components/BackgroundMap.vue'
import CommingSoon from '../components/CommingSoon.vue'
import LoadingScreen from '../components/LoadingScreen.vue'
import MapIntroModal from '../components/MapIntroModal.vue'
import MenuModal from '../components/MenuModal.vue'
import OnboardingModal from '../components/OnboardingModal.vue'
import RegistrationModal from '../components/RegistrationModal.vue'
import SideBar from '../components/SideBar.vue'
import SupportModal from '../components/SupportModal.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that JSON specs may reference.
export default defineNuxtPlugin(() => {
  registerComponent('RuMap', BackgroundMap)
  registerComponent('SideBar', SideBar)
  registerComponent('LoadingScreen', LoadingScreen)
  registerComponent('OnboardingModal', OnboardingModal)
  registerComponent('RegistrationModal', RegistrationModal)
  registerComponent('AnalysisPanel', AnalysisPanel)
  registerComponent('AnalysisLayers', AnalysisLayers)
  registerComponent('MenuModal', MenuModal)
  registerComponent('MapIntroModal', MapIntroModal)
  registerComponent('SupportModal', SupportModal)
  registerComponent('ComingSoonModal', CommingSoon)
  registerHandlers()
})
