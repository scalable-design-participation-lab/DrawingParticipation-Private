import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import '../../contracts/components'
import { declareHandler } from '../../contracts/handlers'
import '../../utils/styles'
import { verifyRows, verifySpec } from '../index'

declareHandler('download', 'test')

const valid = {
  version: 1,
  state: { open: true, mapType: 'vector', intro: '$query.showIntro', selected: '' },
  dataSources: { rows: { kind: 'static', items: [] } },
  children: [
    {
      type: 'BackgroundMap',
      props: { centerLonLat: [-99.19, 19.42], zoom: 14 },
      bind: { mapType: '$state.mapType' },
      children: [
        {
          slot: 'overlays',
          type: 'MarkerOverlay',
          bind: { items: '$data.rows' },
          item: { type: 'div', text: '$item.name', on: { click: { set: 'selected', value: '$item.id' } } },
        },
      ],
    },
    {
      type: 'Header',
      props: { rightItems: [{ icon: 'i-heroicons-arrow-down-tray-20-solid', onClick: { $action: [{ toggle: 'open' }, { call: 'download' }] } }] },
      on: { menu: { set: 'open', value: true } },
      children: [{ slot: 'right', type: 'MapTypeToggle', bind: { modelValue: '$state.mapType' }, on: { 'update:modelValue': { set: 'mapType' } } }],
    },
    { type: 'IntroModal', if: '$state.intro', bind: { modelValue: '$state.open' }, on: { 'update:modelValue': { set: 'open' } }, props: { text: 'hi' } },
    { type: 'Button', props: { color: 'black', to: '/', size: 'xl', anything: 'goes' }, text: 'go' },
    { type: 'Text', if: '$sources.rows.loading', props: { text: 'loading…' } },
    { type: 'Panel', style: ['fill', 'overlay'], props: { variant: 'card', padding: 'lg' } },
  ],
}

describe('verifySpec', () => {
  it('accepts a well-formed spec, also in strict mode', () => {
    expect(verifySpec(valid)).toEqual({ pass: true, errors: [] })
    expect(verifySpec(valid, { strict: true })).toEqual({ pass: true, errors: [] })
  })

  it('rejects malformed JSON with schema paths', () => {
    const result = verifySpec({ children: [{ props: {} }] })
    expect(result.pass).toBe(false)
    expect(result.errors[0]).toMatchObject({ path: 'children[0].type', rule: 'spec.schema' })
  })

  it('flags unknown components, props, slots, events, bindings, handlers, state and styles', () => {
    const result = verifySpec({
      state: { bad: '$state.other' },
      children: [
        { type: 'Nope' },
        { type: 'BackgroundMap', props: { zoom: 'far', bogus: 1 } },
        { type: 'BackgroundMap', children: [{ slot: 'sidebar', type: 'div' }] },
        { type: 'IntroModal', on: { explode: { navigate: '/' } } },
        { type: 'IntroModal', bind: { modelValue: '$state.missing', text: '$data.missing', title: 'literal' } },
        { type: 'div', text: '$item.x' },
        { type: 'IntroModal', on: { close: { set: 'missing' } } },
        { type: 'IntroModal', on: { close: [{ toggle: 'missing' }, { call: 'nope' }] } },
        { type: 'div', if: '$state.missing' },
        { type: 'Header', props: { leftItems: [{ label: 'x', onClick: { $action: { call: 'nope' } } }] } },
        { type: 'Header', props: { leftItems: [{ label: 'x', onClick: { $action: { explode: true } } }] } },
        { type: 'div', style: ['fill', 'nope'] },
        { type: 'div', if: '$sources.missing.loading' },
        { type: 'div', on: { click: { set: 'bad', value: '$item.id' } } },
      ],
    })
    const rules = result.errors.map(e => `${e.rule}@${e.path}`)
    expect(rules).toEqual(expect.arrayContaining([
      'state.bad-init@state.bad',
      'component.unknown@children[0].type',
      'props.invalid@children[1].props.zoom',
      'props.invalid@children[1].props.bogus',
      'slot.unknown@children[2].children[0].slot',
      'event.unknown@children[3].on.explode',
      'bind.unknown-state@children[4].bind.modelValue',
      'bind.unknown-data@children[4].bind.text',
      'bind.bad-expr@children[4].bind.title',
      'bind.item-outside-template@children[5].text',
      'action.unknown-state@children[6].on.close.set',
      'action.unknown-state@children[7].on.close[0].toggle',
      'action.unknown-handler@children[7].on.close[1].call',
      'bind.unknown-state@children[8].if',
      'action.unknown-handler@children[9].props.leftItems[0].onClick.$action.call',
      'action.invalid@children[10].props.leftItems[0].onClick.$action',
      'style.unknown@children[11].style[1]',
      'bind.unknown-data@children[12].if',
      'bind.item-outside-template@children[13].on.click.value',
    ]))
  })

  it('catches wiring mistakes: write-only bindings, dead state, unknown routes, unknown $errors', () => {
    const result = verifySpec({
      state: { open: true, dead: 1 },
      children: [
        { type: 'IntroModal', bind: { modelValue: '$state.open' } },
        { type: 'Text', if: '$errors.nope', props: { text: 'x' } },
        { type: 'Button', props: { to: '/missing' }, text: 'go' },
        { type: 'a', props: { href: '/also-missing' }, text: 'go', on: { click: { navigate: '/nowhere' } } },
        { type: 'Button', props: { to: '/about/' }, text: 'ok' },
      ],
    }, { routes: ['/', '/about'] })
    expect(result.errors.map(e => `${e.rule}@${e.path}`)).toEqual([
      'bind.write-only@children[0].bind.modelValue',
      'action.unknown-handler@children[1].if',
      'link.unknown-route@children[2].props.to',
      'link.unknown-route@children[3].props.href',
      'link.unknown-route@children[3].on.click.navigate',
      'state.unused@state.dead',
    ])
  })

  it('strict mode forbids raw classes', () => {
    const spec = { children: [{ type: 'div', props: { class: 'mt-4' } }, { type: 'Panel', props: { class: 'p-8' } }] }
    expect(verifySpec(spec).pass).toBe(true)
    expect(verifySpec(spec, { strict: true }).errors.map(e => `${e.rule}@${e.path}`)).toEqual([
      'style.raw-class@children[0].props.class',
      'style.raw-class@children[1].props.class',
    ])
  })

  it('lets host pages declare extra data names and handlers', () => {
    const spec = { children: [{ type: 'MarkerOverlay', bind: { items: '$data.fromPage' }, on: { click: { call: 'fromPage' } } }] }
    expect(verifySpec(spec).errors.map(e => e.rule)).toEqual(['bind.unknown-data', 'action.unknown-handler'])
    expect(verifySpec(spec, { extraData: ['fromPage'], handlers: ['fromPage'] }).pass).toBe(true)
  })
})

describe('verifyRows', () => {
  const schema = z.object({ id: z.string(), n: z.number() })

  it('passes clean rows and pinpoints bad ones', () => {
    expect(verifyRows([{ id: 'a', n: 1 }], schema).pass).toBe(true)
    const result = verifyRows([{ id: 'a', n: 1 }, { id: 'b', n: 'x' }], schema)
    expect(result.errors).toEqual([expect.objectContaining({ path: '[1].n', rule: 'row.invalid' })])
    expect(verifyRows({ not: 'array' }, schema).errors[0].rule).toBe('rows.not-array')
  })
})
