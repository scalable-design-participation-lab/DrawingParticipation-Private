import OpenLayersMap from 'vue3-openlayers'
import { defineNuxtPlugin } from '#app'
import 'vue3-openlayers/dist/vue3-openlayers.css'

// Every app renders maps through base's components, so the OpenLayers
// bindings are registered here once instead of in each app.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(OpenLayersMap)
})
