import { registerComponent } from '../../../../base/app/utils/registry'
import AdminAccounts from '../components/AdminAccounts.vue'
import EntryDetail from '../components/EntryDetail.vue'
import FilteredSelectionSidebar from '../components/FilteredSelectionSidebar.vue'
import MncMap from '../components/MncMap.vue'
import MobileContributeFlow from '../components/Mobile/MobileContributeFlow.vue'
import MobileInfoPopup from '../components/Mobile/MobileInfoPopup.vue'
import ModerationPanel from '../components/ModerationPanel.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that the JSON specs may reference.
export default defineNuxtPlugin(() => {
  for (const [name, component] of Object.entries({
    MncMap,
    FilteredSelectionSidebar,
    MobileContributeFlow,
    MobileInfoPopup,
    EntryDetail,
    ModerationPanel,
    AdminAccounts,
  })) {
    registerComponent(name, component)
  }
  registerHandlers()
})
