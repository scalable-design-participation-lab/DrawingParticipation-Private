/**
 * Generates web-sized WebP derivatives of the case-study photos (issue #47).
 *
 * The catalog ships 4000px PNGs straight out of a camera — 2.6 MB on average,
 * up to 4.6 MB. Opening the "All Solutions" panel downloaded 58 MB of them to
 * fill 300px-wide cards. This writes, next to each source photo:
 *
 *   <name>.webp        max 1600px wide  — the carousel / full view
 *   <name>-thumb.webp  max  480px wide  — list cards and the map quick look
 *
 * The PNGs stay on disk as the originals; nothing requests them any more
 * (content/mncPhotos.json points at the .webp files).
 *
 * Re-runnable: a derivative newer than its source is left alone. Run it after
 * adding photos to public/Solution_Photos/, then commit the generated files.
 *
 *   yarn workspace @mono/mnc photos:optimize
 *   yarn workspace @mono/mnc photos:optimize --force   (rebuild everything)
 */
import { readdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const PHOTOS = path.join(ROOT, 'public', 'Solution_Photos')
const MANIFEST = path.join(ROOT, 'content', 'mncPhotos.json')

const SIZES = [
  { suffix: '', width: 1600, quality: 80 },
  { suffix: '-thumb', width: 480, quality: 72 },
]

const force = process.argv.includes('--force')

async function sourcePhotos(dir) {
  const out = []
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name)
    if ((await stat(full)).isDirectory())
      out.push(...await sourcePhotos(full))
    else if (/\.(png|jpe?g)$/i.test(name))
      out.push(full)
  }
  return out.sort()
}

/** Is `derived` already up to date with `source`? */
async function isFresh(source, derived) {
  if (force || !existsSync(derived))
    return false
  const [a, b] = await Promise.all([stat(source), stat(derived)])
  return b.mtimeMs >= a.mtimeMs
}

const sources = await sourcePhotos(PHOTOS)
let sourceBytes = 0
let webBytes = 0
let written = 0

for (const source of sources) {
  const base = source.replace(/\.(png|jpe?g)$/i, '')
  sourceBytes += (await stat(source)).size

  for (const { suffix, width, quality } of SIZES) {
    const target = `${base}${suffix}.webp`
    if (!await isFresh(source, target)) {
      // withoutEnlargement: a photo narrower than the cap is re-encoded, not upscaled.
      await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(target)
      written++
    }
    if (suffix === '')
      webBytes += (await stat(target)).size
  }
}

// Point the manifest at the full-size derivatives. The -thumb variant is
// derived from these paths at render time (see composables/photoThumb.ts).
const manifest = {}
for (const source of sources) {
  const rel = path.relative(PHOTOS, source).split(path.sep)
  const id = rel[0]
  const file = rel[rel.length - 1].replace(/\.(png|jpe?g)$/i, '.webp')
  ;(manifest[id] ||= []).push(`/Solution_Photos/${id}/${file}`)
}
for (const list of Object.values(manifest)) list.sort()
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

const mb = n => (n / 1024 / 1024).toFixed(1)
console.log(`${sources.length} source photos, ${written} derivative(s) written`)
console.log(`originals: ${mb(sourceBytes)} MB   served (1600px webp): ${mb(webBytes)} MB`)
console.log(`manifest:  ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} entries)`)
