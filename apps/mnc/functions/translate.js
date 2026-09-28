import { v2 } from '@google-cloud/translate'

/** Languages the app ships (must match nuxt.config i18n locales). */
export const LOCALES = ['en', 'pt', 'es']

/** Translatable fields of a userSolutions document. */
export const FIELDS = ['title', 'shortDesc', 'description', 'mncConnection', 'location']

const client = new v2.Translate()

/**
 * Builds the i18n map for an entry: { en: {title,...}, pt: {...}, es: {...} }.
 * Source language is auto-detected per call by the API; asking for the source
 * language back just returns the text unchanged, which keeps the shape uniform
 * (the read side never needs to know what language the author wrote in).
 * Returns null when the entry has no translatable text.
 */
export async function buildEntryI18n(data, locales = LOCALES) {
  const present = FIELDS.filter(f => typeof data[f] === 'string' && data[f].trim())
  if (!present.length)
    return null
  const texts = present.map(f => data[f])
  const i18n = {}
  for (const lang of locales) {
    const [translated] = await client.translate(texts, lang)
    const out = {}
    const list = Array.isArray(translated) ? translated : [translated]
    present.forEach((f, i) => {
      out[f] = list[i]
    })
    i18n[lang] = out
  }
  return i18n
}
