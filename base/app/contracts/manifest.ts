import { z } from 'zod'

/**
 * The app manifest (`apps/<app>/app/app.json`): everything that used to live
 * in an app's `app.vue` / `pages/*.vue` / `app.config.ts`, as data.
 *
 * With a manifest, an app is `app.json` + `specs/*.json` + (optionally) its
 * own components registered in a plugin. Base turns the manifest into real
 * Nuxt routes at build time (nuxt.config `pages:extend`) and applies the theme
 * at runtime (plugins/manifest.ts).
 */
/** One field of a collection declared in app.json (validated on every write). */
export const CollectionField = z.strictObject({
  name: z.string().regex(/^[\w-]+$/),
  type: z.enum(['string', 'number', 'boolean', 'json']),
  required: z.boolean().optional(),
})
export type CollectionFieldSpec = z.infer<typeof CollectionField>

/** Build the zod row schema for `fields` (extra keys pass through). */
export function collectionSchema(fields: CollectionFieldSpec[]) {
  const types = { string: z.string(), number: z.number(), boolean: z.boolean(), json: z.unknown() }
  return z.looseObject(Object.fromEntries(fields.map(f => [f.name, f.required ? types[f.type] : types[f.type].optional()])))
}

export const AppManifestSchema = z.strictObject({
  version: z.literal(1).optional(),
  name: z.string().min(1).describe('Workspace / display name.'),
  title: z.string().optional().describe('<title> and og:title. Defaults to `name`.'),
  description: z.string().optional(),
  lang: z.string().optional().describe('<html lang>, e.g. "es".'),
  theme: z.strictObject({
    primary: z.string().optional().describe('Nuxt UI primary color name, e.g. "teal".'),
    gray: z.string().optional().describe('Nuxt UI gray scale name, e.g. "neutral".'),
    colorMode: z.enum(['light', 'dark', 'system']).optional(),
    accent: z.string().optional().describe('CSS color for header text / icons, e.g. "#4FA19D".'),
  }).optional(),
  /**
   * Who the app belongs to. Chrome components (currently the header) read it
   * from here so a spec never repeats it per page, and never restyles it.
   */
  brand: z.strictObject({
    logo: z.string().optional().describe('Logo image served from public/, e.g. "/mnc-logo.svg".'),
    logoAlt: z.string().optional(),
    logoLink: z.string().optional().describe('Where the logo links to.'),
    iconLink: z.string().optional().describe('Where the lab icon links to.'),
  }).optional(),
  /** Spec rendered around every page; it must contain one `Outlet` node. */
  shell: z.string().optional().describe('Spec file name under specs/, e.g. "shell.json".'),
  /** Translations live in app/i18n/<locale>.json; specs use "$t.some.key". */
  i18n: z.strictObject({
    default: z.string().describe('Locale used on first visit and as the fallback for missing keys'),
  }).optional(),
  /** route path -> spec file name under specs/. */
  routes: z.record(z.string().regex(/^\/\S*$/), z.string().regex(/\.json$/)),
  data: z.strictObject({
    /**
     * Collections the app owns. base serves them at /api/collections/<name>
     * (list / create / delete), validates every write against `contract`, and
     * `kind: "collection"` data sources read from there.
     */
    collections: z.record(z.string().regex(/^[\w-]+$/), z.strictObject({
      contract: z.string().optional().describe('A collection contract registered in app/contracts.ts.'),
      fields: z.array(CollectionField).optional().describe('Or the row shape as data: declared fields are validated, others pass through.'),
    }).refine(c => c.contract || c.fields, { message: 'a collection needs `contract` or `fields`' })).optional(),
    /** Base URL for collections the app does not own (name is appended). */
    restBase: z.string().optional(),
  }).optional(),
})
export type AppManifest = z.infer<typeof AppManifestSchema>
