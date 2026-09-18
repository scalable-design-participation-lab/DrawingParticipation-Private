// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// Nuxt reports page files with forward slashes; match on the same form.
const slash = (p: string) => p.split('\\').join('/')
const basePagesDir = slash(fileURLToPath(new URL('./app/pages/', import.meta.url)))
const specPage = fileURLToPath(new URL('./app/components/SpecPage.vue', import.meta.url))

/**
 * An app with an `app/app.json` manifest gets its routes from the manifest:
 * every `routes` entry becomes a route rendered by SpecPage, and it replaces
 * any page with the same path (including base's template leftovers).
 */
function manifestRoutes() {
  const file = ['app/app.json', 'app.json'].map(p => resolve(process.cwd(), p)).find(existsSync)
  if (!file) {
    return null
  }
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as { routes?: Record<string, string> }
  return manifest.routes ?? null
}

export default defineNuxtConfig({
  hooks: {
    'pages:extend': (pages) => {
      const routes = manifestRoutes()
      if (!routes) {
        return
      }
      const paths = new Set(Object.keys(routes))
      for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i]
        if (paths.has(page.path) || (page.file && slash(page.file).startsWith(basePagesDir))) {
          pages.splice(i, 1)
        }
      }
      for (const [path, spec] of Object.entries(routes)) {
        pages.push({ name: `spec${path.replace(/\W+/g, '-')}`, path, file: specPage, meta: { spec } })
      }
    },
  },

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
