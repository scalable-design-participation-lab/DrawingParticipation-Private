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
interface Manifest {
  routes?: Record<string, string>
  data?: { collections?: Record<string, { contract?: string, fields?: unknown[] }> }
}

function readManifest(): Manifest | null {
  const file = ['app/app.json', 'app.json'].map(p => resolve(process.cwd(), p)).find(existsSync)
  return file ? JSON.parse(readFileSync(file, 'utf8')) as Manifest : null
}
const manifest = readManifest()

// The app's contracts module (collection schemas, handler declarations). The
// server needs it loaded to validate collection writes; Nitro tree-shakes a
// side-effect-only import, so it is registered through a generated plugin and
// marked as having side effects.
const contractsFile = resolve(process.cwd(), 'app/contracts.ts')
const appContracts = existsSync(contractsFile) ? slash(contractsFile) : null

export default defineNuxtConfig({
  hooks: {
    'pages:extend': (pages) => {
      const routes = manifest?.routes
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

  // Collections declared in app.json are served by server/api/collections/*
  // and validated server-side; rows are stored as files under .data/.
  runtimeConfig: {
    collections: manifest?.data?.collections ?? {},
  },
  nitro: {
    storage: {
      collections: { driver: 'fs', base: './.data/collections' },
      uploads: { driver: 'fs', base: './.data/uploads' },
    },
    // `#spec/app-contracts` is imported by base/server/plugins/app-contracts.ts.
    moduleSideEffects: appContracts ? [appContracts] : [],
    virtual: {
      '#spec/app-contracts': appContracts
        ? `import '${appContracts}'
export const loaded = true`
        : 'export const loaded = false',
    },
  },

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
