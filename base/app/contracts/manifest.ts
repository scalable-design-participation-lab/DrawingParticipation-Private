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
  }).optional(),
  /** Spec rendered around every page; it must contain one `Outlet` node. */
  shell: z.string().optional().describe('Spec file name under specs/, e.g. "shell.json".'),
  /** route path -> spec file name under specs/. */
  routes: z.record(z.string().regex(/^\/\S*$/), z.string().regex(/\.json$/)),
  data: z.strictObject({
    /** Which adapter serves `kind: "collection"` data sources. */
    collection: z.enum(['none', 'rest']).optional(),
    /** Base URL for the rest adapter (collection name is appended). */
    restBase: z.string().optional(),
  }).optional(),
})
export type AppManifest = z.infer<typeof AppManifestSchema>
