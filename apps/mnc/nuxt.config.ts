// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config';
import path from 'path';
export default defineNuxtConfig({
  extends: ['../../base', '@nuxt/ui-pro'],
  devtools: {
    enabled: true
  },

  target: 'static',

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
    'nuxt-color-picker',
    '@nuxt/content'
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
    { src: '~/plugins/vue3-openlayers.js', mode: 'client' }
  ],

  layouts: {
    default: '~/layouts/default.vue'
  },
  vite: {
    resolve: {
      alias: {
        '@base': path.resolve(__dirname, '../../base/app'),
      },
    },
  },
})
