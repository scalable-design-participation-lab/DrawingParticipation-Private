import { getCollection } from '../../app/contracts/collections'
import { collectionSchema } from '../../app/contracts/manifest'
import type { CollectionFieldSpec } from '../../app/contracts/manifest'
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
  const collections = (useRuntimeConfig().collections ?? {}) as Record<string, { contract?: string, fields?: CollectionFieldSpec[] }>
  const config = collections[name]
  if (!config) {
    throw createError({ statusCode: 404, statusMessage: `Unknown collection "${name}"` })
  }
  return config
}

/** Throws 400 with the verifier's errors when the row breaks the contract. */
export function validateRow(name: string, row: unknown) {
  const { contract, fields } = collectionConfig(name)
  const schema = contract ? getCollection(contract) : fields ? collectionSchema(fields) : undefined
  if (!schema) {
    throw createError({ statusCode: 500, statusMessage: `Contract "${contract}" is not registered on the server (register it in app/contracts.ts)` })
  }
  const result = verifyRows([row], schema)
  if (!result.pass) {
    throw createError({ statusCode: 400, statusMessage: 'Row does not satisfy the collection contract', data: result })
  }
}

export const collectionStore = () => useStorage<StoredRow>('collections')
export const uploadStore = () => useStorage('uploads')

/** JSON body, or a multipart body whose files are stored and replaced by /api/uploads/<file> URLs. */
export async function readRow(event: Parameters<typeof readBody>[0]): Promise<unknown> {
  if (!getHeader(event, 'content-type')?.startsWith('multipart/form-data')) {
    return readBody(event)
  }
  const parts = (await readMultipartFormData(event)) ?? []
  const row: Record<string, unknown> = JSON.parse(parts.find(p => p.name === 'data')?.data.toString('utf8') ?? '{}')
  const multi = new Set(parts.filter(p => p.name?.startsWith('multi:') && p.data.toString() === '1').map(p => p.name!.slice(6)))
  for (const part of parts) {
    if (!part.name?.startsWith('files:') || !part.filename) {
      continue
    }
    const key = part.name.slice(6)
    const ext = (part.filename.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
    const file = `${crypto.randomUUID()}.${ext}`
    await uploadStore().setItemRaw(file, part.data)
    const url = `/api/uploads/${file}`
    if (multi.has(key)) {
      row[key] = [...((row[key] as string[] | undefined) ?? []), url]
    }
    else {
      row[key] = url
    }
  }
  return row
}

export const rowKey = (name: string, id: string) => `${name}:${id}`
