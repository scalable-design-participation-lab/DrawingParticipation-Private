// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [
    // By default, any layers within your project in the ~/layers directory will be automatically registered as layers in your project. (Nuxt > v3.12)
    '@nuxt/ui-pro',
  ],

  modules: [
    //
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt',
  ],

  ui: {
    safelistColors: ['primary', 'red', 'orange', 'green'],
  },

  colorMode: {
    disableTransition: true,
  },

  routeRules: {
    // Temporary workaround for prerender regression. see https://github.com/nuxt/nuxt/issues/27490
    '/': { prerender: true },
  },

  devtools: {
    enabled: true,
  },

  typescript: {
    strict: false,
  },

  future: {
    compatibilityVersion: 4,
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },

  compatibilityDate: '2024-07-11',
})
