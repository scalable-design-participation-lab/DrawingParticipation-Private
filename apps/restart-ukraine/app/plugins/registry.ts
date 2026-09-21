import { registerHandlers } from '../handlers'
import { defineNuxtPlugin } from '#app'
import '../contracts'

// App-local handlers that JSON specs may reference; every component is base's.
export default defineNuxtPlugin(() => {
  registerHandlers()
})
