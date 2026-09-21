import { describe, expect, it } from 'vitest'
import { verifySpec } from '../../../../../base/app/verifier'
import '../../contracts'
import spec from '../map.json'

describe('specs/map.json', () => {
  it('reports a precise path when a binding points at an undeclared data source', () => {
    const broken = structuredClone(spec) as typeof spec
    broken.children[0].children[0].children[0].bind.items = '$data.nope'
    const result = verifySpec(broken)
    expect(result.pass).toBe(false)
    expect(result.errors).toEqual([
      expect.objectContaining({ path: 'children[0].children[0].children[0].bind.items', rule: 'bind.unknown-data' }),
    ])
  })

  it('rejects a reading that breaks the glyph contract', () => {
    const broken = structuredClone(spec) as typeof spec
    broken.children[0].children[0].children[0].item.props = { size: 'big' }
    const [error] = verifySpec(broken).errors
    expect(error).toMatchObject({ path: 'children[0].children[0].children[0].item.props.size', rule: 'props.invalid' })
  })
})
