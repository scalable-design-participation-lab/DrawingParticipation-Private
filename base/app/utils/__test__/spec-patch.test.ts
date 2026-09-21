import { describe, expect, it } from 'vitest'
import { applyPatches, parsePath } from '../spec-patch'

describe('applyPatches', () => {
  it('sets, creates and removes by verifier path', () => {
    const spec = { state: { dead: 1, open: true }, children: [{ type: 'Button', props: { to: '/missing' } }] }
    const out = applyPatches(spec, [
      { path: 'children[0].props.to', value: '/' },
      { path: 'children[0].on.click.navigate', value: '/about' },
      { path: 'state.dead', remove: true },
      { path: 'children[1]', value: { type: 'Text', props: { text: 'hi' } } },
    ]) as typeof spec & { children: unknown[] }
    expect(out).toEqual({
      state: { open: true },
      children: [{ type: 'Button', props: { to: '/' }, on: { click: { navigate: '/about' } } }, { type: 'Text', props: { text: 'hi' } }],
    })
    expect(spec.state.dead).toBe(1) // input untouched
    expect(parsePath('children[2].style[0]')).toEqual(['children', 2, 'style', 0])
  })

  it('removes array elements in place', () => {
    const out = applyPatches({ children: [{ type: 'a' }, { type: 'b' }] }, [{ path: 'children[0]', remove: true }])
    expect(out).toEqual({ children: [{ type: 'b' }] })
  })
})
