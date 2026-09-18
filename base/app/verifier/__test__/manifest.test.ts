import { describe, expect, it } from 'vitest'
import '../../contracts/components'
import '../../utils/styles'
import { verifyApp } from '../manifest'

const specs = {
  'shell.json': { children: [{ type: 'div', style: 'page', children: [{ type: 'Outlet' }] }] },
  'home.json': { children: [{ type: 'Text', props: { text: 'hi' } }] },
  'bad.json': { children: [{ type: 'div', props: { class: 'raw' } }] },
}

describe('verifyApp', () => {
  it('accepts a manifest whose routes and shell all verify', () => {
    expect(verifyApp({ name: 'x', shell: 'shell.json', routes: { '/': 'home.json' } }, specs)).toEqual({ pass: true, errors: [] })
  })

  it('reports schema errors, missing specs, failing specs and a shell without an outlet', () => {
    const result = verifyApp({ name: 'x', shell: 'home.json', routes: { '/': 'nope.json', '/bad': 'bad.json', 'no-slash': 'home.json' } }, specs)
    expect(result.errors.map(e => `${e.rule}@${e.path}`)).toEqual(expect.arrayContaining([
      'manifest.schema@app.json:routes.no-slash',
    ]))
    const ok = verifyApp({ name: 'x', shell: 'home.json', routes: { '/': 'nope.json', '/bad': 'bad.json' } }, specs)
    expect(ok.errors.map(e => `${e.rule}@${e.path}`)).toEqual([
      'manifest.missing-spec@app.json:routes./',
      'style.raw-class@bad.json:children[0].props.class',
      'manifest.shell-outlet@home.json:(root)',
    ])
  })
})
