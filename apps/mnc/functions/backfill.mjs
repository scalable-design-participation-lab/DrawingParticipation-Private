/**
 * One-time backfill: writes translations for content that existed before the
 * translateSolution trigger was deployed. Safe to re-run (skips what's done).
 *
 *   1. Every `userSolutions` doc without an `i18n` field gets one (en/pt/es).
 *   2. The 25-entry curated catalog (content/mncData.json) is translated to
 *      pt + es and written to content/mncData.i18n.json (en is the source).
 *
 * Run from apps/mnc/functions with credentials that can reach Firestore and
 * the Cloud Translation API — either of:
 *   gcloud auth application-default login   (then just: node backfill.mjs)
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json node backfill.mjs
 *
 * Pass --catalog-only or --firestore-only to run half of it.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { buildEntryI18n } from './translate.js'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'drawing-participation'
const args = process.argv.slice(2)
const doCatalog = !args.includes('--firestore-only')
const doFirestore = !args.includes('--catalog-only')

if (doFirestore) {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const snap = await db.collection('userSolutions').get()
  let done = 0
  for (const doc of snap.docs) {
    const data = doc.data()
    if (data.i18n) {
      console.log(`skip ${doc.id} (already translated)`)
      continue
    }
    const i18n = await buildEntryI18n(data)
    if (i18n) {
      await doc.ref.update({ i18n })
      done++
      console.log(`translated ${doc.id} — ${data.title || 'untitled'}`)
    }
  }
  console.log(`Firestore backfill: ${done} docs updated, ${snap.size - done} skipped.`)
}

if (doCatalog) {
  const catalog = JSON.parse(await readFile('../content/mncData.json', 'utf8'))
  const outPath = '../content/mncData.i18n.json'
  const existing = JSON.parse(await readFile(outPath, 'utf8').catch(() => '{}'))
  for (const entry of catalog) {
    if (existing[entry.string_id]) {
      console.log(`skip ${entry.string_id} (already translated)`)
      continue
    }
    // Map catalog column names onto the shared field names.
    const i18n = await buildEntryI18n({
      title: entry.Title,
      shortDesc: entry['Short Description'],
      description: entry.Description,
      mncConnection: entry['Connection to Mobile Networked Creativity'],
      location: entry.Location,
    }, ['pt', 'es']) // catalog source is English — no need to store an en copy
    if (i18n) {
      existing[entry.string_id] = i18n
      // Write after each entry so an interrupted run keeps its progress.
      await writeFile(outPath, `${JSON.stringify(existing, null, 2)}\n`)
      console.log(`translated catalog ${entry.string_id}`)
    }
  }
  console.log(`Catalog: ${Object.keys(existing).length}/${catalog.length} entries in ${outPath}.`)
}
