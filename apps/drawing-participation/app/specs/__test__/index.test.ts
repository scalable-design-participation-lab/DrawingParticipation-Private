import { describe, expect, it } from 'vitest'
import '../../../../../base/app/contracts/components'
import { verifySpec } from '../../../../../base/app/verifier'
import '../../contracts'
import spec from '../index.json'

describe('specs/index.json', () => {
  it('passes the strict static verifier', () => {
    expect(verifySpec(spec, { strict: true })).toEqual({ pass: true, errors: [] })
  })
})
