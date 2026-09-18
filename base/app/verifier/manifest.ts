import { AppManifestSchema } from '../contracts/manifest'
import type { SpecNode } from '../contracts/spec'
import { verifySpec } from './index'
import type { VerifyError, VerifyResult } from './index'

/**
 * Verifies a whole app: the manifest, every spec it routes to (strict mode),
 * and the shell (which must contain exactly one Outlet). Paths are prefixed
 * with the file they belong to so an LLM can fix the right JSON.
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

  const check = (file: string, at: string) => {
    if (!(file in specs)) {
      errors.push({ path: at, rule: 'manifest.missing-spec', message: `"${file}" is not in specs/` })
      return
    }
    const result = verifySpec(specs[file], { strict: true })
    errors.push(...result.errors.map(e => ({ ...e, path: `${file}:${e.path}` })))
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
