import type { AppManifest } from '../contracts/manifest'
import type { RootSpec } from '../contracts/spec'

// `~` is the *app's* srcDir even though this file lives in base, so each app
// contributes its own app.json and specs. Both globs are empty for apps that
// still use hand-written pages (e.g. mnc).
const manifests = import.meta.glob<{ default: AppManifest }>('~/app.json', { eager: true })
const specModules = import.meta.glob<{ default: RootSpec }>('~/specs/*.json', { eager: true })

const manifest: AppManifest | undefined = Object.values(manifests)[0]?.default

/** Spec file name (e.g. "map.json") -> parsed spec. */
const specs: Record<string, RootSpec> = Object.fromEntries(
  Object.entries(specModules).map(([path, mod]) => [path.split('/').pop()!, mod.default]),
)

export function useAppManifest() {
  return { manifest, specs }
}
