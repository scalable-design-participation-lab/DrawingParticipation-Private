import { collectionConfig, collectionStore, rowKey } from '../../../utils/collections'

/** DELETE /api/collections/:name/:id */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')!
  const id = getRouterParam(event, 'id')!
  collectionConfig(name)
  await collectionStore().removeItem(rowKey(name, id))
  return { ok: true }
})
