/**
 * One-time cleanup for issue #42: some entries carry the SAME photo twice.
 *
 * The contribute wizard collects files across six questions and used to upload
 * each one separately, so a participant who attached the same picture to two
 * questions got two Storage objects with two different download URLs. The
 * gallery then counted "2" and showed the same image on both slides.
 *
 * The write path is fixed (pages/index.vue de-duplicates before uploading);
 * this repairs the documents that were written before that.
 *
 * Two photos are "the same" when their Storage object names share the original
 * filename — objects are stored as contributions/<folder>/<epoch-ms>-<name>,
 * so the epoch prefix is what makes their URLs differ. The first URL of each
 * group is kept, in order.
 *
 * Run from apps/mnc/functions with credentials that can reach Firestore:
 *   gcloud auth application-default login            (then: node dedupe-entry-photos.mjs)
 *   GOOGLE_APPLICATION_CREDENTIALS=../service-account.json node dedupe-entry-photos.mjs
 *
 * DRY RUN BY DEFAULT — prints what it would change and writes nothing.
 * Pass --apply to actually update the documents.
 *
 * Storage objects left unreferenced are NOT deleted: they are the only way back
 * if a de-duplication turns out to be wrong. Clean them up separately once the
 * data is confirmed good.
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'drawing-participation'
const apply = process.argv.slice(2).includes('--apply')

/** The uploaded file's original name, from a Firebase Storage download URL. */
function originalName(url) {
  try {
    // .../o/contributions%2F<folder>%2F<epoch>-<name>?alt=media&token=...
    const encoded = new URL(url).pathname.split('/o/')[1] || ''
    const objectPath = decodeURIComponent(encoded)
    const file = objectPath.split('/').pop() || objectPath
    return file.replace(/^\d{13}-/, '')
  }
  catch {
    return url
  }
}

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

const snap = await db.collection('userSolutions').get()
let changed = 0

for (const doc of snap.docs) {
  const photos = doc.data().photos
  if (!Array.isArray(photos) || photos.length < 2)
    continue

  const seen = new Set()
  const kept = photos.filter((url) => {
    const key = originalName(url)
    if (seen.has(key))
      return false
    seen.add(key)
    return true
  })

  if (kept.length === photos.length)
    continue

  changed++
  console.log(`${doc.id}  "${(doc.data().title || '').trim()}"  ${photos.length} -> ${kept.length} photos`)
  for (const url of photos)
    console.log(`   ${kept.includes(url) ? 'keep  ' : 'DROP  '} ${originalName(url)}`)

  if (apply)
    await doc.ref.update({ photos: kept })
}

console.log(
  changed === 0
    ? 'No duplicate photos found.'
    : apply ? `Updated ${changed} document(s).` : `${changed} document(s) would change. Re-run with --apply to write.`,
)
process.exit(0)
