import { z } from 'zod'
import './utils/styles'
import { LonLat, registerCollection, registerContract } from '../../../base/app/contracts'

/**
 * App-specific contracts. Plain module (no Nuxt auto-imports) so the verifier
 * CLI can load it: `yarn workspace @mono/base verify <spec> --contracts apps/open-sensing-chapultepec/app/contracts.ts`.
 */

export const ReadingSchema = z.strictObject({
  humedad: z.number().min(0).max(100).describe('Relative humidity, %'),
  temperatura: z.number().min(-30).max(60).describe('°C'),
  nubes: z.enum(['stratus', 'cirrus', 'cumulus', 'cirrocumulus']),
  lluvia: z.enum(['suave', 'moderada', 'fuerte']),
  viento: z.enum(['suave', 'leve', 'moderada', 'fuerte']),
  olor: z.enum(['bajo', 'alto', 'intermitente']),
})

/** One observation on the map: where + what. */
export const ReadingRowSchema = registerCollection('reading', z.strictObject({
  id: z.string().optional(),
  position: LonLat,
  reading: ReadingSchema,
}))

export const weatherGlyphContract = registerContract({
  name: 'WeatherGlyph',
  description: 'SVG weather glyph: humidity spiral in the middle, one symbol per variable around it.',
  props: z.strictObject({
    reading: ReadingSchema,
    size: z.number().positive().optional().describe('Rendered size in px (default 240).'),
    labels: z.boolean().optional().describe('Print the variable names under each symbol.'),
    spiralOnly: z.boolean().optional(),
  }),
})

registerContract({ name: 'GlyphLegend', description: 'EJEMPLO glyph plus the six legend cards.', props: z.strictObject({}) })
registerContract({ name: 'GlyphCanvas', description: 'Axes where a visitor composes their glyph (static for now).', props: z.strictObject({}) })
