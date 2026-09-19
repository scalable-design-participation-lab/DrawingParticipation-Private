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

  // List helpers on page state: `{ "call": "updateItem", "args": "<state key>" }` with { id, …patch } as payload.
  const list = (ctx: { state: Record<string, unknown> }, key: unknown) => {
    const rows = ctx.state[String(key)]
    if (!Array.isArray(rows)) {
      throw new TypeError(`state "${String(key)}" is not a list`)
    }
    return rows as { id: unknown }[]
  }
  registerHandler('updateItem', (payload, ctx, args) => {
    const patch = payload as { id: unknown }
    ctx.state[String(args)] = list(ctx, args).map(row => (row.id === patch.id ? { ...row, ...patch } : row))
  }, 'Merge the payload into the item with the same id inside the state list named in args.')
  registerHandler('toggleItem', (payload, ctx, args) => {
    const rows = (ctx.state[String(args)] ?? []) as unknown[]
    ctx.state[String(args)] = rows.includes(payload) ? rows.filter(x => x !== payload) : [...rows, payload]
  }, 'Add the payload to the state list named in args, or remove it when already there.')
  registerHandler('removeItem', (payload, ctx, args) => {
    ctx.state[String(args)] = list(ctx, args).filter(row => row.id !== payload)
  }, 'Remove the item whose id is the payload from the state list named in args.')

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

  // A payload holding File objects (e.g. from PhotoDropZone) goes up as
  // multipart: the JSON fields under `data`, every file under `files:<key>`;
  // the server stores the files and puts their URLs into the row.
  const isFile = (v: unknown): v is File => typeof File !== 'undefined' && v instanceof File
  function encode(body: unknown): { headers: Record<string, string>, body: BodyInit | undefined } {
    if (body === undefined) {
      return { headers: {}, body: undefined }
    }
    const entries = Object.entries((body ?? {}) as Record<string, unknown>)
    const hasFiles = entries.some(([, v]) => isFile(v) || (Array.isArray(v) && v.some(isFile)))
    if (!hasFiles) {
      return { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
    }
    const form = new FormData()
    const data: Record<string, unknown> = {}
    for (const [key, value] of entries) {
      const files = isFile(value) ? [value] : Array.isArray(value) && value.some(isFile) ? value.filter(isFile) : null
      if (files) {
        files.forEach(file => form.append(`files:${key}`, file, file.name))
        form.append(`multi:${key}`, Array.isArray(value) ? '1' : '0')
      }
      else {
        data[key] = value
      }
    }
    form.append('data', JSON.stringify(data))
    return { headers: {}, body: form }
  }

  async function request(method: 'POST' | 'DELETE', url: string, payload?: unknown) {
    const { headers, body } = encode(payload)
    const response = await fetch(url, { method, headers, body })
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
