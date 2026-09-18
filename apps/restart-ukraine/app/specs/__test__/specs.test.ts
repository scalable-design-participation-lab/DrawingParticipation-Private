import { describe, expect, it } from 'vitest'
import { verifySpec } from '../../../../../base/app/verifier'
import '../../contracts'
import about from '../about.json'
import dashboard from '../dashboard.json'
import index from '../index.json'
import result from '../result.json'

// Every page of this app is a spec; all of them must pass the strict static verifier
// (no raw classes: styling only through component props and registered presets).
describe.each([
  ['index', index],
  ['about', about],
  ['result', result],
  ['dashboard', dashboard],
])('specs/%s.json', (_name, spec) => {
  it('passes the strict static verifier', () => {
    expect(verifySpec(spec, { strict: true })).toEqual({ pass: true, errors: [] })
  })
})
