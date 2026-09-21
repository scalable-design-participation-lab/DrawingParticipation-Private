import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import List from '@components/List.vue'

/** Prints whatever the item template is handed, so order and shape both show. */
function rows(items: unknown) {
  const wrapper = mount(List, {
    props: { items },
    slots: { item: ({ item }: { item: Record<string, unknown> }) => h('li', JSON.stringify(item)) },
  })
  return wrapper.findAll('li').map(li => JSON.parse(li.text()))
}

describe('list over an object', () => {
  it('repeats over an array unchanged', () => {
    expect(rows([{ id: 'a' }, { id: 'b' }])).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('walks a map as { key, value }', () => {
    expect(rows({ entries: 12, categories: 3 })).toEqual([
      { key: 'entries', value: 12 },
      { key: 'categories', value: 3 },
    ])
  })

  it('spreads a row-shaped value so the template reads it normally', () => {
    // locale -> translation is the case this exists for: the template wants
    // both the language and the fields under it.
    expect(rows({ pt: { title: 'Olá' }, es: { title: 'Hola' } })).toEqual([
      { key: 'pt', title: 'Olá' },
      { key: 'es', title: 'Hola' },
    ])
  })

  it('treats an array value as a value, not as fields', () => {
    expect(rows({ tags: ['a', 'b'] })).toEqual([{ key: 'tags', value: ['a', 'b'] }])
  })

  it('renders nothing for an empty map, like an empty array', () => {
    expect(rows({})).toEqual([])
    expect(rows(undefined)).toEqual([])
  })
})
