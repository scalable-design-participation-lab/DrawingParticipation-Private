// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config';
import path from 'path';
export default defineNuxtConfig({
  extends: ['../../base', '@nuxt/ui-pro'],
  devtools: {
    enabled: true
  },

  // This is a client-side map SPA (OpenLayers + client-only Firebase via
  // nuxt-vuefire). Disabling SSR avoids server-side Firebase Admin init
  // (which would require a service-account.json) and Pinia SSR payload
  // serialization issues, neither of which this app needs.
  ssr: false,

  css: ['vue3-openlayers/dist/vue3-openlayers.css'],

  future: {
    compatibilityVersion: 4,
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    'nuxt-vuefire',
    'nuxt-color-picker'
  ],

  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
  },

  runtimeConfig: {
    public: {
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
    { src: '~/plugins/auth.client.ts', mode: 'client' }
  ],

  vite: {
    resolve: {
      alias: {
        '@base': path.resolve(__dirname, '../../base/app'),
      },
    },
  },
})
