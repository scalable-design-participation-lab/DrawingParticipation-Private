// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'

// Everything this app is lives in app/app.json, app/specs/*.json and app/i18n/*.json.
export default defineNuxtConfig({
  extends: ['../../base'],
  ssr: false,
  future: { compatibilityVersion: 4 },
  runtimeConfig: {
    public: {
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,
    },
  },
})
