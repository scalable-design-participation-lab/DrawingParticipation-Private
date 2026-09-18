import { collectionStore, rowKey, validateRow } from '../../../utils/collections'

/** POST /api/collections/:name { …row } -> the stored row (with id / createdAt). 400 with verifier errors when invalid. */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')!
  const body = await readBody(event)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Body must be a JSON object' })
  }
  // The contract describes the user's fields; id / createdAt are ours.
  const { id: _id, createdAt: _createdAt, ...fields } = body as Record<string, unknown>
  validateRow(name, fields)
  const row = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...fields }
  await collectionStore().setItem(rowKey(name, row.id), row)
  return row
})
