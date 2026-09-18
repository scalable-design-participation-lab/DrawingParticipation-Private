import { z } from 'zod'

/**
 * Collection contracts describe the rows a data source returns. The data layer
 * validates every adapter response against them before the UI sees the rows,
 * so a backend swap (Firestore -> REST -> mock) cannot silently change shapes.
 */
const collections = new Map<string, z.ZodType>()

export function registerCollection(name: string, schema: z.ZodType) {
  collections.set(name, schema)
  return schema
}

export function getCollection(name: string) {
  return collections.get(name)
}

export function listCollections() {
  return [...collections.entries()]
}

/** Minimal GeoJSON feature, the lingua franca of every map app here. */
export const FeatureSchema = registerCollection('feature', z.object({
  type: z.literal('Feature'),
  id: z.union([z.string(), z.number()]).optional(),
  geometry: z.object({
    type: z.enum(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']),
    coordinates: z.unknown(),
  }),
  properties: z.record(z.string(), z.unknown()).nullable(),
}))
