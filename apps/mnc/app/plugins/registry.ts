import { registerComponent } from '../../../../base/app/utils/registry'
import MobileContributeFlow from '../components/Mobile/MobileContributeFlow.vue'
import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local components and handlers that the JSON specs may reference.
export default defineNuxtPlugin(() => {
  for (const [name, component] of Object.entries({
    MobileContributeFlow,
  })) {
    registerComponent(name, component)
  }
  registerHandlers()
})
