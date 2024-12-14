// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['../../base'],

  modules: [
    '@nuxt/ui',
  ],

  ui: {
    icons: ['heroicons'],
    global: true,
    safelistColors: ['primary', 'gray'],
  },

  future: {
    compatibilityVersion: 4,
  },
})
