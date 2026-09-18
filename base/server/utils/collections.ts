import { getCollection } from '../../app/contracts/collections'
import { verifyRows } from '../../app/verifier'

/**
 * Collections declared in app.json `data.collections` are served by
 * base/server/api/collections/[name]. Rows live in Nitro's `collections`
 * storage (fs driver under .data/ by default, see base/nuxt.config.ts) and
 * every write is validated against the collection contract the app
 * registered in app/contracts.ts (loaded by server/plugins/app-contracts.ts).
 */
export interface StoredRow {
  id: string
  createdAt: string
  [key: string]: unknown
}

export function collectionConfig(name: string) {
  const collections = (useRuntimeConfig().collections ?? {}) as Record<string, { contract: string }>
  const config = collections[name]
  if (!config) {
    throw createError({ statusCode: 404, statusMessage: `Unknown collection "${name}"` })
  }
  return config
}

/** Throws 400 with the verifier's errors when the row breaks the contract. */
export function validateRow(name: string, row: unknown) {
  const { contract } = collectionConfig(name)
  const schema = getCollection(contract)
  if (!schema) {
    throw createError({ statusCode: 500, statusMessage: `Contract "${contract}" is not registered on the server (register it in app/contracts.ts)` })
  }
  const result = verifyRows([row], schema)
  if (!result.pass) {
    throw createError({ statusCode: 400, statusMessage: 'Row does not satisfy the collection contract', data: result })
  }
}

export const collectionStore = () => useStorage<StoredRow>('collections')

export const rowKey = (name: string, id: string) => `${name}:${id}`
