import { reactive } from 'vue'
import { getCollection } from '../contracts/collections'
import type { DataSourceSpec } from '../contracts/spec'
import { verifyRows } from '../verifier'
import type { VerifyResult } from '../verifier'
import type { DataAdapter } from './adapters'
import { applyJoin } from './join'

export interface DataSourceState {
  /** Rows as the page sees them: loaded rows plus any `join` aggregates. */
  items: unknown[]
  /** Rows exactly as the adapter returned them. */
  raw: unknown[]
  loading: boolean
  /** Adapter failure message, or the contract verification result when rows were rejected. */
  error: string | VerifyResult | null
}

/**
 * Loads every declared data source through the adapter. When a source names a
 * `contract`, the rows are verified against that collection schema first and
 * rejected wholesale on failure (fail closed: bad data never reaches the UI).
 * `reload(name)` re-runs one source (all when omitted), e.g. after a write.
 */
export function useDataSources(specs: Record<string, DataSourceSpec>, adapter: DataAdapter) {
  const sources = reactive<Record<string, DataSourceState>>({})

  // `join` folds another source's aggregates into these rows, so it re-runs
  // whenever either side is (re)loaded.
  function applyJoins() {
    for (const [name, spec] of Object.entries(specs)) {
      const source = sources[name]
      if (!source) {
        continue
      }
      source.items = (spec.join ?? []).reduce(
        (rows, join) => applyJoin(rows, join, sources[join.from]?.raw ?? []),
        source.raw,
      )
    }
  }

  async function load(name: string) {
    const spec = specs[name]
    const source = sources[name]
    source.loading = true
    try {
      const rows = await adapter.load(spec)
      if (spec.contract) {
        const schema = getCollection(spec.contract)
        if (!schema) {
          source.error = `Unknown collection contract "${spec.contract}"`
          return
        }
        const result = verifyRows(rows, schema)
        if (!result.pass) {
          source.error = result
          return
        }
      }
      source.raw = rows
      source.error = null
      applyJoins()
    }
    catch (err: unknown) {
      source.error = err instanceof Error ? err.message : String(err)
    }
    finally {
      source.loading = false
    }
  }

  for (const name of Object.keys(specs)) {
    sources[name] = { items: [], raw: [], loading: true, error: null }
    load(name)
  }

  async function reload(name?: string) {
    await Promise.all((name ? [name] : Object.keys(specs)).filter(n => n in specs).map(load))
  }

  return { sources, reload }
}
