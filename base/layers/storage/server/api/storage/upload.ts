import { type HandleUploadBody, handleUpload } from '@vercel/blob/client'

export default defineEventHandler(async (event) => {
  const body = await readBody<HandleUploadBody>(event)

  try {
    const jsonResponse = await handleUpload({
      body,
      request: event.node.req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          tokenPayload: JSON.stringify({}),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload)

        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        }
        catch (err) {
          console.error(err)

          throw createError({
            statusCode: 500,
            message: 'Could not update',
          })
        }
      },
    })

    return jsonResponse
  }
  catch (err) {
    console.error(err)

    throw createError({
      statusCode: 400,
      message: 'Could not upload',
    })
  }
})
