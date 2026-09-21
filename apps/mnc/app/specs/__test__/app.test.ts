import { describe, expect, it } from 'vitest'
import { verifyApp } from '../../../../../base/app/verifier/manifest'
import '../../../../../base/app/contracts/components'
import '../../contracts'
import manifest from '../../app.json'

// Every spec the manifest routes to, plus the shell, in strict mode. verifyApp
// is the entry point rather than verifySpec per file, because only it registers
// the style presets the manifest itself declares.
const specs = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: unknown }>('../*.json', { eager: true }))
    .map(([path, mod]) => [path.split('/').pop()!, mod.default]),
)

describe('app.json', () => {
  it('verifies the whole app', () => {
    expect(verifyApp(manifest, specs)).toEqual({ pass: true, errors: [] })
  })
})
