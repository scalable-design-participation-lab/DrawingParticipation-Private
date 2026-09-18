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
