import { registerComponent } from '../../../../base/app/utils/registry'
import AnalysisLayers from '../components/AnalysisLayers.vue'
import AnalysisPanel from '../components/AnalysisPanel.vue'
import LoadingScreen from '../components/LoadingScreen.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that JSON specs may reference.
export default defineNuxtPlugin(() => {
  registerComponent('LoadingScreen', LoadingScreen)
  registerComponent('AnalysisPanel', AnalysisPanel)
  registerComponent('AnalysisLayers', AnalysisLayers)
  registerHandlers()
})
