// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['../../base'],
  typescript: {
    strict: false,
  },

  ssr: false,

  future: {
    compatibilityVersion: 4,
  },
  build: {
    // transpile: ['y-geojson', 'y-websocket', 'yjs'],
    // transpile: ['vue3-openlayers'],
  },

  // vite: {
  //   optimizeDeps: {
  //     include: ['xml-utils'],
  //   },
  //   resolve: {
  //     alias: {
  //       'xml-utils/find-tags-by-name': 'xml-utils/find-tags-by-name.js',
  //     },
  //   },
  // },

  // Add experimental configuration with proper array
  experimental: {
    // This might be causing issues, so let's comment it out
    // extraPageMetaExtractionKeys: [],
  },

})
