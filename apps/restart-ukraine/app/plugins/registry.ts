import { registerComponent } from '../../../../base/app/utils/registry'
import AnalysisLayers from '../components/AnalysisLayers.vue'
import AnalysisPanel from '../components/AnalysisPanel.vue'
import BackgroundMap from '../components/BackgroundMap.vue'
import LoadingScreen from '../components/LoadingScreen.vue'
import RegistrationModal from '../components/RegistrationModal.vue'
import SideBar from '../components/SideBar.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that JSON specs may reference.
export default defineNuxtPlugin(() => {
  registerComponent('RuMap', BackgroundMap)
  registerComponent('SideBar', SideBar)
  registerComponent('LoadingScreen', LoadingScreen)
  registerComponent('RegistrationModal', RegistrationModal)
  registerComponent('AnalysisPanel', AnalysisPanel)
  registerComponent('AnalysisLayers', AnalysisLayers)
  registerHandlers()
})
