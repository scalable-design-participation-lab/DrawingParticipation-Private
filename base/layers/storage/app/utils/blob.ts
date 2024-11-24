import { upload } from '@vercel/blob/client'

export async function blobUpload(file: File) {
  console.log('upload', file)

  if (!file)
    return

  const newBlob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/storage/upload',
  })

  console.log('newBlob', newBlob)

  return newBlob
}

export default {
  blobUpload,
}
