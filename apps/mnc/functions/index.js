import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { buildEntryI18n } from './translate.js'

initializeApp()

/**
 * Translate every new entry once at creation time and store the result on the
 * document (space is cheap; per-read API calls are not). The client reads
 * `doc.i18n[locale].field` and falls back to the original text, so a failed
 * translation degrades gracefully instead of blocking the submission.
 */
export const translateSolution = onDocumentCreated('userSolutions/{id}', async (event) => {
  const snap = event.data
  const data = snap?.data()
  if (!data || data.i18n)
    return
  try {
    const i18n = await buildEntryI18n(data)
    if (i18n)
      await snap.ref.update({ i18n })
  }
  catch (e) {
    // Log and give up — the entry stays readable in its original language.
    console.error(`translateSolution failed for ${event.params.id}:`, e)
  }
})
