import { ref } from 'vue'
import type { Ref } from 'vue'
import { useAppManifest } from '../composables/useAppManifest'
import { SPEC_I18N, createTranslator } from '../utils/i18n'
import { DATA_ADAPTER, composeAdapters, restAdapter, staticAdapter } from '../data/adapters'
import type { DataSourceSpec } from '../contracts/spec'
import { registerAuthHandlers } from '../data/auth'
import { firestoreAdapter, firestoreCreate, firestoreDelete, firestoreUpdate } from '../data/firestore'
import { registerHandler } from '../utils/handlers'
import { registerComponent } from '../utils/registry'
import { registerStyle } from '../utils/styles'
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

  const readPath = (row: unknown, key: string) =>
    key.split('.').reduce<unknown>((value, part) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined), row)

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
  // A detail view holds a snapshot of a row; after a write, re-read it from the
  // (reloaded) data source so the open panel shows the new numbers.
  registerHandler('refreshItem', (_payload, ctx, args) => {
    const { from, into, key = 'id' } = (args ?? {}) as { from?: string, into?: string, key?: string }
    if (!from || !into) {
      throw new Error('refreshItem needs args { from: "<data source>", into: "<state key>" }')
    }
    const current = ctx.state[into] as Record<string, unknown> | null
    if (!current) {
      return
    }
    const rows = (ctx.data[from] ?? []) as Record<string, unknown>[]
    ctx.state[into] = rows.find(row => row[key] === current[key]) ?? current
  }, 'Re-read the row a detail view is showing from a data source: args { from, into, key? }.')

  registerHandler('removeItem', (payload, ctx, args) => {
    ctx.state[String(args)] = list(ctx, args).filter(row => row.id !== payload)
  }, 'Remove the item whose id is the payload from the state list named in args.')

  // Pick one row out of a list by a field, e.g. opening a detail view from a
  // queue that only knows the id. Sibling of refreshItem, same args.
  registerHandler('selectItem', (payload, ctx, args) => {
    const { from, into, key = 'id' } = (args ?? {}) as { from?: string, into?: string, key?: string }
    if (!from || !into) {
      throw new Error('selectItem needs args { from: "<data source or state list>", into: "<state key>" }')
    }
    const rows = (ctx.data[from] ?? ctx.state[from] ?? []) as Record<string, unknown>[]
    ctx.state[into] = rows.find(row => String(readPath(row, key)) === String(payload)) ?? null
  }, 'Put the row whose `key` equals the payload into state: args { from, into, key? }. `from` is a data source or a state list.')

  // The page tells the reader what fits on their screen; every app that has a
  // phone layout was writing this listener itself.
  registerHandler('watchViewport', (payload, ctx) => {
    const at = Number(payload) || 768
    const update = () => {
      ctx.state.isMobile = window.innerWidth < at
    }
    update()
    window.addEventListener('resize', update)
  }, 'Keep state.isMobile in step with the viewport; the payload is the breakpoint in px (default 768).')

  // "Nearest to me" needs a me. The reader is asked once; a refusal or a
  // timeout simply leaves the state null and the list keeps its own order.
  registerHandler('watchLocation', (payload, ctx) => {
    const into = String(payload || 'location')
    if (!import.meta.client || !navigator.geolocation) {
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        ctx.state[into] = [position.coords.longitude, position.coords.latitude]
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    )
  }, 'Ask once where the reader is and put [lon, lat] into the state key named by the payload (default "location").')

  registerHandler('download', (_payload, ctx, args) => {
    const { from, format = 'json', filename } = (args ?? {}) as { from?: string, format?: string, filename?: string }
    const rows = ((from ? ctx.data[from] ?? ctx.state[from] : []) ?? []) as Record<string, unknown>[]
    const csv = () => {
      const columns = [...new Set(rows.flatMap(row => Object.keys(row)))]
      const cell = (value: unknown) => {
        const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
      }
      return [columns.join(','), ...rows.map(row => columns.map(c => cell(row[c])).join(','))].join('\n')
    }
    const blob = new Blob([format === 'csv' ? csv() : JSON.stringify(rows, null, 2)], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename || from || 'data'}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, 'Save a data source to a file: args { from, format?: "json" | "csv", filename? }.')

  registerHandler('copy', async (payload, ctx, args) => {
    const text = String(payload ?? '')
    if (!text) {
      return
    }
    await navigator.clipboard.writeText(text)
    // A copy leaves no trace on screen, so the page can flash a confirmation:
    // the state named in `args` goes true and comes back down on its own.
    const { into, seconds = 2 } = (args ?? {}) as { into?: string, seconds?: number }
    if (into) {
      ctx.state[into] = true
      setTimeout(() => {
        ctx.state[into] = false
      }, seconds * 1000)
    }
  }, 'Copy the payload to the clipboard; args { into, seconds? } flashes a state flag so the page can say it worked.')

  const { manifest, messages } = useAppManifest()
  if (!manifest) {
    return
  }

  // Translations as data: app/i18n/<locale>.json + "$t.key" in specs.
  //
  // An app that installed vue-i18n (mnc) keeps its own catalogue and its own
  // locale ref, so `$locale` and `setLocale` follow that instead of a second,
  // parallel one. Same precedence SpecRenderer uses for `$t`.
  const vueI18n = (nuxtApp as { $i18n?: { locale: Ref<string>, locales?: Ref<{ code: string }[]>, setLocale: (code: string) => void } }).$i18n
  const own = Object.keys(messages)
  const locales = vueI18n?.locales?.value?.map(l => l.code) ?? own
  const fallback = manifest.i18n?.default ?? locales[0] ?? 'en'

  let remembered: string | null = null
  try {
    remembered = localStorage.getItem('spec-locale')
  }
  catch { /* private mode */ }

  const locale = vueI18n?.locale ?? ref(remembered && own.includes(remembered) ? remembered : fallback)
  nuxtApp.vueApp.provide(SPEC_I18N, { locale, locales, translate: createTranslator(messages, locale, fallback) })

  registerHandler('setLocale', (payload) => {
    const next = String(payload)
    if (!locales.includes(next)) {
      return
    }
    if (vueI18n) {
      vueI18n.setLocale(next)
      return
    }
    locale.value = next
    try {
      localStorage.setItem('spec-locale', next)
    }
    catch { /* private mode */ }
  }, 'Switch the UI language; payload is a locale the app has (an app/i18n/<locale>.json, or one vue-i18n knows).')

  for (const [name, classes] of Object.entries(manifest.styles ?? {})) {
    registerStyle(name, classes, `From ${manifest.name}'s app.json`)
  }

  if (manifest.theme?.primary || manifest.theme?.gray) {
    updateAppConfig({ ui: { ...(manifest.theme.primary && { primary: manifest.theme.primary }), ...(manifest.theme.gray && { gray: manifest.theme.gray }) } })
  }

  // Owned collections are served by base's Nitro routes; others by restBase.
  // An app that declared `data.backend: "firestore"` talks to its own Firebase
  // project instead, through the same source kind and the same handlers.
  const owned = manifest.data?.collections ?? {}
  const onFirestore = manifest.data?.backend === 'firestore'
  if (onFirestore) {
    registerAuthHandlers()
  }
  const urlFor = (name: string) => (name in owned ? `/api/collections/${name}` : manifest.data?.restBase ? `${manifest.data.restBase}/${name}` : null)

  const collection = {
    load: (spec: DataSourceSpec) => {
      if (onFirestore) {
        return firestoreAdapter.load(spec)
      }
      const url = spec.kind === 'collection' && spec.name ? urlFor(spec.name) : null
      return url ? restAdapter.load({ kind: 'rest', url }) : Promise.reject(new Error(`collection "${spec.kind === 'collection' ? spec.name : spec.kind}" is not declared in app.json`))
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
    if (onFirestore) {
      await firestoreCreate(name, (payload ?? {}) as Record<string, unknown>)
      await ctx.reload()
      return
    }
    const url = urlFor(name)
    if (!url) {
      throw new Error(`collection "${name}" is not declared in app.json`)
    }
    await request('POST', url, payload)
    await ctx.reload()
  }, 'Save the payload as a new row of the collection named in args, then reload data sources.')

  // `{ "call": "updateIn", "args": "<collection>" }` with `{ id, …patch }`.
  registerHandler('updateIn', async (payload, ctx, args) => {
    const name = String(args)
    const { id, ...patch } = (payload ?? {}) as { id?: string }
    if (!id) {
      throw new Error('updateIn needs a payload with an `id`')
    }
    if (onFirestore) {
      await firestoreUpdate(name, String(id), patch)
      await ctx.reload()
      return
    }
    const url = urlFor(name)
    if (!url) {
      throw new Error(`collection "${name}" is not declared in app.json`)
    }
    await request('POST', `${url}/${encodeURIComponent(String(id))}`, patch)
    await ctx.reload()
  }, 'Merge `{ id, …patch }` into that row of the collection named in args, then reload data sources.')

  // `{ "call": "deleteFrom", "args": "<collection>" }` with the row id as payload (e.g. "$item.id").
  registerHandler('deleteFrom', async (payload, ctx, args) => {
    const name = String(args)
    if (onFirestore) {
      await firestoreDelete(name, String(payload))
      await ctx.reload()
      return
    }
    const url = urlFor(name)
    if (!url) {
      throw new Error(`collection "${name}" is not declared in app.json`)
    }
    await request('DELETE', `${url}/${encodeURIComponent(String(payload))}`)
    await ctx.reload()
  }, 'Delete the row whose id is the payload from the collection named in args, then reload data sources.')
})
