import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { z } from 'zod'
import SpecRenderer from '../../SpecRenderer.vue'
import { registerHandler } from '../../../utils/handlers'
import { registerComponent } from '../../../utils/registry'
import { registerStyle } from '../../../utils/styles'
import { verifyRender } from '../../../verifier/render'

// A tiny component standing in for any generalized one: a prop in, an event out.
const Toggle = defineComponent({
  props: { on: { type: Boolean, default: false }, label: { type: String, default: '' } },
  emits: ['update:on'],
  setup(props, { emit, slots }) {
    return () => h('button', { onClick: () => emit('update:on', !props.on) }, [
      `${props.label}:${props.on ? 'ON' : 'OFF'}`,
      slots.default?.(),
    ])
  },
})

const List = defineComponent({
  props: { items: { type: Array, default: () => [] } },
  setup(props, { slots }) {
    return () => h('ul', (props.items as unknown[]).map(item => h('li', slots.item?.({ item }))))
  },
})

// Items with callbacks, like header items / toolbar tools.
const Menu = defineComponent({
  props: { items: { type: Array as () => { label: string, onClick?: () => void }[], default: () => [] } },
  setup(props) {
    return () => h('nav', props.items.map(item => h('button', { class: 'item', onClick: item.onClick }, item.label)))
  },
})

registerComponent('Toggle', Toggle, {
  name: 'Toggle',
  description: 'test',
  props: z.strictObject({ on: z.boolean().optional(), label: z.string().optional() }),
  emits: ['update:on'],
  slots: ['default'],
})
registerComponent('List', List, {
  name: 'List',
  description: 'test',
  props: z.strictObject({ items: z.array(z.unknown()).optional() }),
  slots: ['item'],
})
registerComponent('Menu', Menu, {
  name: 'Menu',
  description: 'test',
  props: z.strictObject({ items: z.array(z.object({ label: z.string() })).optional() }),
})
registerStyle('boxed', 'border p-2')

const called: unknown[] = []
registerHandler('record', (payload, ctx, args) => called.push({ payload, args, lamp: ctx.state.lamp }))

const spec = {
  version: 1 as const,
  state: { lamp: false, panel: true, intro: '$query.showIntro', picked: '' },
  dataSources: { names: { kind: 'static' as const, items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] } },
  children: [
    { type: 'Toggle', props: { label: 'lamp' }, bind: { on: '$state.lamp' }, on: { 'update:on': { set: 'lamp' } }, children: [{ type: 'span', text: 'x' }] },
    { type: 'List', bind: { items: '$data.names' }, item: { type: 'em', text: '$item.name', on: { click: { set: 'picked', value: '$item.id' } } } },
    { type: 'a', props: { href: '#' }, text: 'go', on: { click: { navigate: '/there' } } },
    { type: 'p', if: '$state.panel', style: 'boxed', props: { class: 'panel' }, text: 'panel' },
    { type: 'p', if: '$state.intro', props: { class: 'intro' }, text: 'intro' },
    { type: 'p', if: '$sources.names.loading', props: { class: 'loading' }, text: 'loading' },
    { type: 'Menu', props: { items: [{ label: 'hide', onClick: { $action: [{ toggle: 'panel' }, { call: 'record', args: { from: 'menu' } }] } }] } },
  ],
}

describe('specRenderer', () => {
  it('binds state, runs actions, loads data sources and renders item templates', async () => {
    const visited: string[] = []
    const wrapper = mount(SpecRenderer, { props: { spec, navigate: to => visited.push(to), query: { showIntro: 'true' } } })
    await flushPromises()

    expect(wrapper.find('button').text()).toBe('lamp:OFFx')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').text()).toBe('lamp:ONx')

    expect(wrapper.findAll('li em').map(e => e.text())).toEqual(['a', 'b'])
    // `$item` inside an action value
    await wrapper.findAll('li em')[1].trigger('click')
    expect((wrapper.vm as unknown as { state: Record<string, unknown> }).state.picked).toBe(2)

    await wrapper.find('a').trigger('click')
    expect(visited).toEqual(['/there'])

    // `if` + `$query` coercion ("true" -> true); `$sources.*.loading` is false once loaded
    expect(wrapper.find('.intro').exists()).toBe(true)
    expect(wrapper.find('.panel').exists()).toBe(true)
    expect(wrapper.find('.loading').exists()).toBe(false)
    // style preset merged with the literal class
    expect(wrapper.find('.panel').classes()).toEqual(expect.arrayContaining(['border', 'p-2', 'panel']))

    // `$action` item callback: toggle + call with args
    await wrapper.find('nav .item').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(false)
    expect(called).toEqual([{ payload: expect.anything(), args: { from: 'menu' }, lamp: true }])
  })

  it('render-verifies a spec without warnings', async () => {
    expect(await verifyRender(spec)).toEqual({ pass: true, errors: [] })
  })
})

describe('specNode event modifiers', () => {
  it('lets a button inside a clickable row stop the row from firing', async () => {
    const spec = {
      version: 1 as const,
      state: { picked: '', acted: '' },
      children: [{
        type: 'div',
        props: { class: 'row' },
        on: { click: { set: 'picked', value: 'row' } },
        children: [
          { type: 'button', props: { class: 'inner' }, on: { 'click.stop': { set: 'acted', value: 'button' } } },
          { type: 'button', props: { class: 'through' }, on: { click: { set: 'acted', value: 'bubbled' } } },
        ],
      }],
    }
    const wrapper = mount(SpecRenderer, { props: { spec, navigate: () => {}, query: {} } })
    await flushPromises()

    await wrapper.find('.inner').trigger('click')
    expect(wrapper.vm.state).toMatchObject({ acted: 'button', picked: '' })

    // Without the modifier the row still hears it, which is why the row's own
    // buttons need one.
    await wrapper.find('.through').trigger('click')
    expect(wrapper.vm.state).toMatchObject({ acted: 'bubbled', picked: 'row' })
  })
})

describe('or in a condition', () => {
  const spec = {
    version: 1 as const,
    state: { a: false, b: false, c: false, name: '' },
    children: [
      { type: 'p', props: { class: 'either' }, if: '$state.a || $state.b', text: 'either' },
      { type: 'p', props: { class: 'mixed' }, if: '$state.a && $state.b || $state.c', text: 'mixed' },
      { type: 'p', props: { class: 'named' }, if: '$state.name == \'ada\' || $state.name == \'grace\'', text: 'named' },
    ],
  }
  const render = (state: Record<string, unknown>) =>
    mount(SpecRenderer, { props: { spec: { ...spec, state: { ...spec.state, ...state } }, navigate: () => {}, query: {} } })

  it('is true when any side is', () => {
    expect(render({}).find('.either').exists()).toBe(false)
    expect(render({ a: true }).find('.either').exists()).toBe(true)
    expect(render({ b: true }).find('.either').exists()).toBe(true)
  })

  it('binds looser than &&, so "a && b || c" is "(a && b) || c"', () => {
    expect(render({ a: true }).find('.mixed').exists()).toBe(false)
    expect(render({ a: true, b: true }).find('.mixed').exists()).toBe(true)
    expect(render({ c: true }).find('.mixed').exists()).toBe(true)
  })

  it('works with comparisons on both sides', () => {
    expect(render({ name: 'ada' }).find('.named').exists()).toBe(true)
    expect(render({ name: 'grace' }).find('.named').exists()).toBe(true)
    expect(render({ name: 'alan' }).find('.named').exists()).toBe(false)
  })
})

describe('comparing two expressions', () => {
  const spec = {
    version: 1 as const,
    state: { me: 'uid-1', rows: [{ uid: 'uid-1' }, { uid: 'uid-2' }] },
    children: [{
      type: 'List',
      bind: { items: '$state.rows' },
      item: {
        type: 'p',
        props: { class: 'row' },
        children: [
          { type: 'span', props: { class: 'mine' }, if: '$item.uid == $state.me', text: 'me' },
          { type: 'span', props: { class: 'theirs' }, if: '$item.uid != $state.me', text: 'them' },
        ],
      },
    }],
  }

  it('reads the right-hand side instead of matching its text', async () => {
    // "$item.uid == $state.me" used to compare a uid against the literal
    // string "$state.me", which is false for everyone.
    const wrapper = mount(SpecRenderer, { props: { spec, navigate: () => {}, query: {} } })
    await flushPromises()
    expect(wrapper.findAll('.mine')).toHaveLength(1)
    expect(wrapper.findAll('.theirs')).toHaveLength(1)
  })
})
