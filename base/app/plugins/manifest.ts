import { useAppManifest } from '../composables/useAppManifest'
import { DATA_ADAPTER, composeAdapters, restAdapter, staticAdapter } from '../data/adapters'
import { registerComponent } from '../utils/registry'
import Outlet from '../components/Outlet.vue'
import { defineNuxtPlugin, updateAppConfig } from '#app'

/**
 * Applies the app manifest at runtime: theme colors and the data adapter
 * (title / lang are read by base app.vue). Color mode is applied by SpecPage (the color-mode plugin may
 * not have run yet here); routes are created at build time in base/nuxt.config.ts.
 */
export default defineNuxtPlugin((nuxtApp) => {
  registerComponent('Outlet', Outlet)

  const { manifest } = useAppManifest()
  if (!manifest) {
    return
  }

  if (manifest.theme?.primary || manifest.theme?.gray) {
    updateAppConfig({ ui: { ...(manifest.theme.primary && { primary: manifest.theme.primary }), ...(manifest.theme.gray && { gray: manifest.theme.gray }) } })
  }

  // `collection` data sources: a REST base URL when declared, nothing otherwise
  // (apps with Firestore provide their own adapter in their plugin).
  const collection = manifest.data?.collection === 'rest' && manifest.data.restBase
    ? {
        load: (spec: { kind: string, name?: string }) => restAdapter.load({ kind: 'rest', url: `${manifest.data!.restBase}/${spec.name}` }),
      }
    : undefined
  nuxtApp.vueApp.provide(DATA_ADAPTER, composeAdapters({ static: staticAdapter, rest: restAdapter, ...(collection && { collection }) }))
})
