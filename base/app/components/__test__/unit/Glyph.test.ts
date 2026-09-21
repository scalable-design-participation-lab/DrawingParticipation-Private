import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Glyph from '@components/Glyph.vue'

/**
 * The component knows how to place and scale a mark; what the marks look like
 * is the project's own vocabulary, passed in.
 */
const shapes = {
  nubes: {
    stratus: [{ d: 'M6 22h28' }],
    cumulus: [{ d: 'M6 26h28' }, { d: 'M8 26a12 12 0 0 1 24 0' }],
  },
  viento: {
    suave: [{ d: 'M20 34V8' }, { circle: [20, 34, 2] as [number, number, number], filled: true }],
    fuerte: [{ d: 'M20 34V8' }],
  },
  olor: { intermitente: [{ d: 'M20 4v32', dash: '1 4', width: 3 }] },
  temperatura: { unit: [{ circle: [5, 5, 2.8] as [number, number, number], width: 1.8 }] },
}

function glyph(parts: Record<string, unknown>[], extra: Record<string, unknown> = {}) {
  return mount(Glyph, { props: { shapes, parts, ...extra } })
}

describe('glyph picks a shape by value', () => {
  it('draws what the vocabulary says, and nothing for a value it does not know', () => {
    expect(glyph([{ kind: 'nubes', value: 'stratus' }]).findAll('path')).toHaveLength(1)
    expect(glyph([{ kind: 'nubes', value: 'cumulus' }]).findAll('path')).toHaveLength(2)
    expect(glyph([{ kind: 'nubes', value: 'ninguna' }]).findAll('path')).toHaveLength(0)
  })

  it('carries dash, width and fill across', () => {
    const path = glyph([{ kind: 'olor', value: 'intermitente' }]).find('path')
    expect(path.attributes('stroke-dasharray')).toBe('1 4')
    expect(path.attributes('stroke-width')).toBe('3')
  })

  it('draws a circle when the vocabulary is made of them', () => {
    const w = glyph([{ kind: 'viento', value: 'suave' }])
    expect(w.find('circle').attributes()).toMatchObject({ cx: '20', cy: '34', r: '2', fill: 'currentColor' })
  })

  it('turns a mark that points somewhere', () => {
    const rotate = { suave: 0, fuerte: 85 }
    expect(glyph([{ kind: 'viento', value: 'fuerte', rotate }]).html()).toContain('rotate(85 20 34)')
    // No angle, no transform to read past.
    expect(glyph([{ kind: 'viento', value: 'suave', rotate }]).html()).not.toContain('rotate(')
  })
})

describe('glyph counts a value out', () => {
  it('repeats the unit once per `per`', () => {
    // 24 °C at one circle per 2 °C.
    expect(glyph([{ mode: 'repeat', kind: 'temperatura', value: 24, per: 2 }]).findAll('circle')).toHaveLength(12)
    expect(glyph([{ mode: 'repeat', kind: 'temperatura', value: 0, per: 2 }]).findAll('circle')).toHaveLength(0)
  })

  it('wraps after `columns`, on a grid in the glyph own coordinates', () => {
    const w = glyph([{ mode: 'repeat', kind: 'temperatura', value: 12, per: 2, columns: 5, step: 10 }])
    const at = w.findAll('svg svg').map(s => [s.attributes('x'), s.attributes('y')])
    // Six units, five to a row: the sixth starts the second row.
    expect(at.slice(0, 5)).toEqual([['0', '0'], ['10', '0'], ['20', '0'], ['30', '0'], ['40', '0']])
    expect(at[5]).toEqual(['0', '10'])
  })
})

describe('glyph winds a value', () => {
  it('spirals tighter the higher it is', () => {
    const turns = (value: number) => {
      const d = glyph([{ mode: 'spiral', value, turns: [2, 6], max: 100 }]).find('path').attributes('d')!
      return d.split('L').length
    }
    expect(turns(100)).toBeGreaterThan(turns(0))
  })

  it('prints the value with its unit', () => {
    expect(glyph([{ mode: 'spiral', value: 61.5, suffix: '%' }]).text()).toContain('61.5%')
    expect(glyph([{ mode: 'repeat', kind: 'temperatura', value: 24, per: 2, suffix: '°C' }]).text()).toContain('24°C')
  })

  it('measures against a scale of ticks', () => {
    expect(glyph([{ mode: 'ticks', count: 11 }]).findAll('path')).toHaveLength(12)
  })
})

describe('glyph places and names its parts', () => {
  it('puts each part where it was told', () => {
    const w = glyph([{ kind: 'nubes', value: 'stratus', at: [8, 4] }])
    expect(w.html()).toContain('translate(8 4)')
  })

  it('names them only when asked', () => {
    const parts = [{ kind: 'nubes', value: 'stratus', label: 'NUBES' }]
    expect(glyph(parts).text()).not.toContain('NUBES')
    expect(glyph(parts, { labels: true }).text()).toContain('NUBES')
  })
})
