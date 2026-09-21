import { describe, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import type { DataSourceSpec } from '../../contracts/spec'
import type { DataAdapter } from '../adapters'
import { useDataSources } from '../useDataSources'

/**
 * The piece that lets one spec work against any backend: a `where` value may
 * name page state ("the rows belonging to whoever is signed in"), and the
 * source re-reads itself when that changes -- without the page asking.
 */
function recorder(rowsFor: (spec: DataSourceSpec) => unknown[] = () => []) {
  const seen: DataSourceSpec[] = []
  const adapter: DataAdapter = {
    load(spec) {
      seen.push(structuredClone(spec))
      return Promise.resolve(rowsFor(spec))
    },
  }
  return { adapter, seen }
}

/** Resolves "$state.x.y" against a plain object, the way SpecRenderer does. */
function from(state: Record<string, unknown>) {
  return (value: unknown) =>
    (typeof value === 'string' && value.startsWith('$state.')
      ? value.slice(7).split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], state)
      : value)
}

async function settle() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('useDataSources', () => {
  it('reads nothing until start(), because a where may need state that does not exist yet', async () => {
    const { adapter, seen } = recorder()
    const { start } = useDataSources({ rows: { kind: 'collection', name: 'entries' } }, adapter)
    await settle()
    expect(seen).toHaveLength(0)
    start()
    await settle()
    expect(seen).toHaveLength(1)
  })

  it('resolves a where against page state and re-reads when it changes', async () => {
    const state = reactive({ auth: { uid: 'uid-1' } })
    const { adapter, seen } = recorder()
    const { start } = useDataSources(
      { mine: { kind: 'collection', name: 'entries', where: [['owner', '==', '$state.auth.uid']] } },
      adapter,
      from(state),
    )
    start()
    await settle()
    expect(seen.at(-1)?.where).toEqual([['owner', '==', 'uid-1']])

    state.auth.uid = 'uid-2'
    await settle()
    expect(seen).toHaveLength(2)
    expect(seen.at(-1)?.where).toEqual([['owner', '==', 'uid-2']])

    // Signing out is a change like any other; the page gets that person's rows.
    state.auth.uid = ''
    await settle()
    expect(seen.at(-1)?.where).toEqual([['owner', '==', '']])
  })

  it('leaves a source alone when what it depends on did not move', async () => {
    const state = reactive({ auth: { uid: 'uid-1' }, tab: 'map' })
    const { adapter, seen } = recorder()
    const { start } = useDataSources(
      {
        mine: { kind: 'collection', name: 'entries', where: [['owner', '==', '$state.auth.uid']] },
        all: { kind: 'collection', name: 'entries' },
      },
      adapter,
      from(state),
    )
    start()
    await settle()
    expect(seen).toHaveLength(2)

    state.tab = 'list'
    await settle()
    expect(seen).toHaveLength(2)

    // And only the source that depends on it re-reads.
    state.auth.uid = 'uid-2'
    await settle()
    expect(seen).toHaveLength(3)
    expect(seen.at(-1)?.name).toBe('entries')
    expect(seen.at(-1)?.where).toEqual([['owner', '==', 'uid-2']])
  })

  it('keeps an adapter failure in the source instead of throwing it at the page', async () => {
    const adapter: DataAdapter = { load: () => Promise.reject(new Error('permission denied')) }
    const { sources, start } = useDataSources({ rows: { kind: 'collection', name: 'entries' } }, adapter)
    start()
    await settle()
    expect(sources.rows.error).toBe('permission denied')
    expect(sources.rows.items).toEqual([])
    expect(sources.rows.loading).toBe(false)
  })

  it('reload(name) re-reads one source, reload() all of them', async () => {
    const { adapter, seen } = recorder()
    const { reload, start } = useDataSources(
      { a: { kind: 'collection', name: 'a' }, b: { kind: 'collection', name: 'b' } },
      adapter,
    )
    start()
    await settle()
    seen.length = 0

    await reload('a')
    expect(seen.map(s => s.name)).toEqual(['a'])

    await reload()
    expect(seen.map(s => s.name)).toEqual(['a', 'a', 'b'])
  })
})
