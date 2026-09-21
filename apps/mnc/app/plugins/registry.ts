import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// Every component is base's now; mnc contributes handlers and contracts.
export default defineNuxtPlugin(() => {
  registerHandlers()
})
