import { uploadStore } from '../../utils/collections'

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf', mp3: 'audio/mpeg', m4a: 'audio/mp4', webm: 'video/webm', mp4: 'video/mp4' }

/** GET /api/uploads/:file -> the stored file (written by a multipart collection POST). */
export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file')!
  const data = await uploadStore().getItemRaw(file)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'No such upload' })
  }
  setHeader(event, 'content-type', TYPES[file.split('.').pop() ?? ''] ?? 'application/octet-stream')
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  return data
})
