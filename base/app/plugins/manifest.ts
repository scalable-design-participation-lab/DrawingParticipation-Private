import { useAppManifest } from '../composables/useAppManifest'
import { DATA_ADAPTER, composeAdapters, restAdapter, staticAdapter } from '../data/adapters'
import { registerHandler } from '../utils/handlers'
import { registerComponent } from '../utils/registry'
import Outlet from '../components/Outlet.vue'
import { defineNuxtPlugin, updateAppConfig } from '#app'

/**
 * Applies the app manifest at runtime: theme colors, the data adapter for
 * `collection` sources, and the generic saveTo / deleteFrom handlers that
 * write to the app's own collections (title / lang are read by base app.vue;
 * routes are created at build time in base/nuxt.config.ts).
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

  // Owned collections are served by base's Nitro routes; others by restBase.
  const owned = manifest.data?.collections ?? {}
  const urlFor = (name: string) => (name in owned ? `/api/collections/${name}` : manifest.data?.restBase ? `${manifest.data.restBase}/${name}` : null)

  const collection = {
    load: (spec: { kind: string, name?: string }) => {
      const url = spec.name ? urlFor(spec.name) : null
      return url ? restAdapter.load({ kind: 'rest', url }) : Promise.reject(new Error(`collection "${spec.name}" is not declared in app.json`))
    },
  }
  nuxtApp.vueApp.provide(DATA_ADAPTER, composeAdapters({ static: staticAdapter, rest: restAdapter, collection }))

  async function request(method: 'POST' | 'DELETE', url: string, body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { statusMessage?: string, data?: { errors?: { path: string, message: string }[] } } | null
      const reasons = detail?.data?.errors?.map(e => `${e.path}: ${e.message}`).join('; ')
      throw new Error(reasons || detail?.statusMessage || `${method} ${url} failed (${response.status})`)
    }
    return response.json()
  }

  // `{ "call": "saveTo", "args": "<collection>" }` with the row as payload (e.g. FormFields `submit`).
  registerHandler('saveTo', async (payload, ctx, args) => {
    const name = String(args)
    const url = urlFor(name)
    if (!url) {
      throw new Error(`collection "${name}" is not declared in app.json`)
    }
    await request('POST', url, payload)
    await ctx.reload()
  }, 'Save the payload as a new row of the collection named in args, then reload data sources.')

  // `{ "call": "deleteFrom", "args": "<collection>" }` with the row id as payload (e.g. "$item.id").
  registerHandler('deleteFrom', async (payload, ctx, args) => {
    const name = String(args)
    const url = urlFor(name)
    if (!url) {
      throw new Error(`collection "${name}" is not declared in app.json`)
    }
    await request('DELETE', `${url}/${encodeURIComponent(String(payload))}`)
    await ctx.reload()
  }, 'Delete the row whose id is the payload from the collection named in args, then reload data sources.')
})
