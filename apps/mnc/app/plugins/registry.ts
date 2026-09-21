import { registerComponent } from '../../../../base/app/utils/registry'
import EntryDetail from '../components/EntryDetail.vue'
import MobileContributeFlow from '../components/Mobile/MobileContributeFlow.vue'
import MobileInfoPopup from '../components/Mobile/MobileInfoPopup.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that the JSON specs may reference.
export default defineNuxtPlugin(() => {
  for (const [name, component] of Object.entries({
    MobileContributeFlow,
    MobileInfoPopup,
    EntryDetail,
  })) {
    registerComponent(name, component)
  }
  registerHandlers()
})
