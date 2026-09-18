// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'

export default defineNuxtConfig({
  extends: ['../../base'],

  // Client-side map SPA (OpenLayers); nothing here needs SSR.
  ssr: false,

  // The design is paper-white only; never follow the OS dark preference.
  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'osc-color-mode',
  },

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    public: {
      // Read by base's GeneralizedBackgroundMap.
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  plugins: [
    { src: '~/plugins/vue3-openlayers.js', mode: 'client' },
  ],
})
