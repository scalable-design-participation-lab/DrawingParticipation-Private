import { z } from 'zod'
import { LonLat, registerCollection } from '../../../base/app/contracts'

/**
 * What this app stores. Every component it draws is base's, so there are no
 * component contracts left -- the weather glyph is base's Glyph plus the
 * vocabulary in public/glyph.json.
 *
 * Plain module (no Nuxt auto-imports) so the verifier
 * CLI can load it: `yarn workspace @mono/base verify <spec> --contracts apps/open-sensing-chapultepec/app/contracts.ts`.
 */

const ReadingSchema = z.strictObject({
  humedad: z.number().min(0).max(100).describe('Relative humidity, %'),
  temperatura: z.number().min(-30).max(60).describe('°C'),
  nubes: z.enum(['stratus', 'cirrus', 'cumulus', 'cirrocumulus']),
  lluvia: z.enum(['suave', 'moderada', 'fuerte']),
  viento: z.enum(['suave', 'leve', 'moderada', 'fuerte']),
  olor: z.enum(['bajo', 'alto', 'intermitente']),
})

/** One observation on the map: where + what. */
registerCollection('reading', z.strictObject({
  id: z.string().optional(),
  position: LonLat,
  reading: ReadingSchema,
}))

/** One answer to "¿Cómo está el clima hoy?" (stored by base's collections API). */
registerCollection('observacion', z.strictObject({
  id: z.string().optional(),
  createdAt: z.string().optional(),
  escuchan: z.string().min(1),
  nubes: z.string().min(1),
  cielo: z.string().min(1),
  huele: z.string().min(1),
}))
