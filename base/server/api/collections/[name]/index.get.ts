import { collectionConfig, collectionStore } from '../../../utils/collections'

/** GET /api/collections/:name -> every row, oldest first. */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')!
  collectionConfig(name)
  const store = collectionStore()
  const keys = await store.getKeys(name)
  const rows = (await Promise.all(keys.map(key => store.getItem(key)))).filter((r): r is NonNullable<typeof r> => !!r)
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
})
