import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

/**
 * Guards the bug class behind issue #38: a template calling a helper that comes
 * from a composable (`useLocalizedEntry()`), in a component whose script never
 * destructured it. Nuxt auto-imports the composable, NOT the closures it
 * returns, so the compiler emits `_ctx.lf(...)` and the whole component throws
 * "lf is not a function" at render time — an invisible, silent failure.
 *
 * MobileProximityList shipped that way and the mobile list tab was dead.
 */
const HELPERS = ['lf', 'linkLabel', 'tagLabel']

const APP_DIR = path.resolve(__dirname, '../../..')

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory())
      return name === 'node_modules' || name === '__test__' ? [] : vueFiles(full)
    return name.endsWith('.vue') ? [full] : []
  })
}

describe('composable helpers used in templates are bound in the script', () => {
  const files = vueFiles(APP_DIR)

  it('finds components to check', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  for (const file of files) {
    const rel = path.relative(APP_DIR, file).replace(/\\/g, '/')

    it(rel, () => {
      const source = readFileSync(file, 'utf8')
      const { descriptor } = parse(source, { filename: file })
      if (!descriptor.scriptSetup || !descriptor.template)
        return

      let compiled: string
      try {
        compiled = compileScript(descriptor, { id: rel, inlineTemplate: true }).content
      }
      catch {
        // Not our concern here: a file the SFC compiler cannot handle with
        // these options is covered by the build, not by this guard.
        return
      }

      const unbound = HELPERS.filter(h => compiled.includes(`_ctx.${h}(`))
      expect(unbound, `${rel} calls ${unbound.join(', ')} in its template without destructuring it from useLocalizedEntry()`).toEqual([])
    })
  }
})
