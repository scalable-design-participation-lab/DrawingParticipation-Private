import { reactive } from 'vue'
import { getCollection } from '../contracts/collections'
import type { DataSourceSpec } from '../contracts/spec'
import { verifyRows } from '../verifier'
import type { VerifyResult } from '../verifier'
import type { DataAdapter } from './adapters'

export interface DataSourceState {
  items: unknown[]
  loading: boolean
  /** Adapter failure message, or the contract verification result when rows were rejected. */
  error: string | VerifyResult | null
}

/**
 * Loads every declared data source through the adapter. When a source names a
 * `contract`, the rows are verified against that collection schema first and
 * rejected wholesale on failure (fail closed: bad data never reaches the UI).
 */
export function useDataSources(specs: Record<string, DataSourceSpec>, adapter: DataAdapter) {
  const sources = reactive<Record<string, DataSourceState>>({})

  for (const [name, spec] of Object.entries(specs)) {
    sources[name] = { items: [], loading: true, error: null }
    adapter.load(spec)
      .then((rows) => {
        if (spec.contract) {
          const schema = getCollection(spec.contract)
          if (!schema) {
            sources[name].error = `Unknown collection contract "${spec.contract}"`
            return
          }
          const result = verifyRows(rows, schema)
          if (!result.pass) {
            sources[name].error = result
            return
          }
        }
        sources[name].items = rows
      })
      .catch((err: unknown) => {
        sources[name].error = err instanceof Error ? err.message : String(err)
      })
      .finally(() => {
        sources[name].loading = false
      })
  }

  return sources
}
