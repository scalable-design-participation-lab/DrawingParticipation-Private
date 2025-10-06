const { defineNuxtConfig } = require('nuxt/config')
const path = require('path')

module.exports = defineNuxtConfig({
  extends: ['../../base', '@nuxt/ui-pro'],

  css: ['vue3-openlayers/dist/vue3-openlayers.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ['@pinia/nuxt', '@nuxt/ui'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  runtimeConfig: {
    dbUser: process.env.DB_USER,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPassword: process.env.DB_PASSWORD,
    dbPort: process.env.DB_PORT,
    public: {
      MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    },
  },

  compatibilityDate: '2024-08-15',
  plugins: [{ src: '~/plugins/vue3-openlayers.js', mode: 'client' }],
  vite: {
    resolve: {
      alias: {
        '@base': path.resolve(__dirname, '../../base/app'),
      },
    },
    optimizeDeps: {
      include: ['knex', 'pg'],
    },
  },
})
