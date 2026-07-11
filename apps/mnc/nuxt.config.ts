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
    'nuxt-color-picker',
    '@nuxtjs/i18n'
  ],

  // Automatic English/Portuguese: detects the browser language on first visit,
  // then remembers the user's choice from the header switcher. `no_prefix`
  // keeps the URLs clean (this is a single-page map app).
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'pt', language: 'pt-BR', name: 'Português', file: 'pt.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'mnc_locale',
      redirectOn: 'root',
    },
  },

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
    // Opt-in local testing: set VUEFIRE_EMULATORS=true to point the app at the
    // Firebase Emulator Suite instead of the cloud project. Off by default, so a
    // normal `yarn dev` still uses the real project.
    emulators: {
      enabled: process.env.VUEFIRE_EMULATORS === 'true',
      // Suppress the Firebase Auth SDK's fixed "Running in emulator mode" banner
      // (it overlaps the mobile bottom nav). Emulator-only; production is unaffected.
      auth: { options: { disableWarnings: true } },
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
