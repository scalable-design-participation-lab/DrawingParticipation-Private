import { getCollection } from '../contracts/collections'
import { AppManifestSchema } from '../contracts/manifest'
import type { RootSpec, SpecNode } from '../contracts/spec'
import { verifySpec } from './index'
import type { VerifyError, VerifyResult } from './index'

/**
 * Verifies a whole app: the manifest, every spec it routes to (strict mode,
 * with the app's routes and collections known), and the shell (which must
 * contain exactly one Outlet). Paths are prefixed with the file they belong
 * to so an LLM can fix the right JSON.
 */
export function verifyApp(manifest: unknown, specs: Record<string, unknown>): VerifyResult {
  const errors: VerifyError[] = []
  const parsed = AppManifestSchema.safeParse(manifest)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({ path: `app.json:${issue.path.join('.') || '(root)'}`, rule: 'manifest.schema', message: issue.message })
    }
    return { pass: false, errors }
  }
  const m = parsed.data
  const routes = Object.keys(m.routes)
  const owned = new Set(Object.keys(m.data?.collections ?? {}))

  for (const [name, { contract }] of Object.entries(m.data?.collections ?? {})) {
    if (contract && !getCollection(contract)) {
      errors.push({ path: `app.json:data.collections.${name}.contract`, rule: 'manifest.unknown-contract', message: `collection contract "${contract}" is not registered (app/contracts.ts)` })
    }
  }

  const check = (file: string, at: string) => {
    if (!(file in specs)) {
      errors.push({ path: at, rule: 'manifest.missing-spec', message: `"${file}" is not in specs/` })
      return
    }
    const result = verifySpec(specs[file], { strict: true, routes })
    errors.push(...result.errors.map(e => ({ ...e, path: `${file}:${e.path}` })))
    // `collection` sources must be served by something: an owned collection or restBase.
    for (const [name, source] of Object.entries((specs[file] as RootSpec).dataSources ?? {})) {
      if (source.kind === 'collection' && !owned.has(source.name) && !m.data?.restBase) {
        errors.push({ path: `${file}:dataSources.${name}.name`, rule: 'manifest.unknown-collection', message: `collection "${source.name}" is neither in app.json data.collections nor served by restBase` })
      }
    }
  }

  for (const [route, file] of Object.entries(m.routes)) {
    check(file, `app.json:routes.${route}`)
  }
  if (m.shell) {
    check(m.shell, 'app.json:shell')
    if (m.shell in specs) {
      const outlets = countType((specs[m.shell] as { children?: SpecNode[] }).children ?? [], 'Outlet')
      if (outlets !== 1) {
        errors.push({ path: `${m.shell}:(root)`, rule: 'manifest.shell-outlet', message: `shell must contain exactly one Outlet node, found ${outlets}` })
      }
    }
  }
  return { pass: errors.length === 0, errors }
}

function countType(nodes: SpecNode[], type: string): number {
  return nodes.reduce((n, node) => n + (node.type === type ? 1 : 0) + countType(node.children ?? [], type) + (node.item ? countType([node.item], type) : 0), 0)
}
