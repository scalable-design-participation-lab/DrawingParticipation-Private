import type { InjectionKey } from 'vue'
import type { DataSourceSpec } from '../contracts/spec'

/**
 * A DataAdapter turns a data-source declaration into rows. The UI never talks
 * to a backend directly: it declares `{ kind, name, where }` and the app decides
 * which adapter satisfies it. Swapping Firestore for REST or a mock changes one
 * `provide()` in the app shell and nothing in any spec.
 */
export interface DataAdapter {
  load: (spec: DataSourceSpec) => Promise<unknown[]>
}

export const DATA_ADAPTER: InjectionKey<DataAdapter> = Symbol('data-adapter')

function unsupported(spec: DataSourceSpec): never {
  throw new Error(`No data adapter for kind "${spec.kind}"`)
}

/** `{ kind: "static", items }` -> the items. Mocks, fixtures, tests. */
export const staticAdapter: DataAdapter = {
  async load(spec) {
    return spec.kind === 'static' ? spec.items : unsupported(spec)
  },
}

/** `{ kind: "rest", url }` -> GET url; accepts an array, `{ items }` or a FeatureCollection. */
export const restAdapter: DataAdapter = {
  async load(spec) {
    if (spec.kind !== 'rest') {
      unsupported(spec)
    }
    const response = await fetch(spec.url)
    if (!response.ok) {
      throw new Error(`GET ${spec.url} failed: ${response.status}`)
    }
    const body = await response.json()
    if (Array.isArray(body)) {
      return body
    }
    return body.items ?? body.features ?? []
  },
}

/**
 * `{ kind: "collection", name, where, limit }` -> Firestore query.
 * `db` is whatever the app already has (nuxt-vuefire's useFirestore(), the
 * firebase layer's getFirestore(), or the emulator).
 */
export function createFirestoreAdapter(db: unknown): DataAdapter {
  return {
    async load(spec) {
      if (spec.kind !== 'collection') {
        unsupported(spec)
      }
      const { collection, getDocs, limit, query, where } = await import('firebase/firestore')
      const clauses = (spec.where ?? []).map(([field, op, value]) => where(field, op as never, value))
      if (spec.limit) {
        clauses.push(limit(spec.limit) as never)
      }
      const snapshot = await getDocs(query(collection(db as never, spec.name), ...clauses))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    },
  }
}

/** Route each `kind` to an adapter. */
export function composeAdapters(byKind: Partial<Record<DataSourceSpec['kind'], DataAdapter>>): DataAdapter {
  return {
    load(spec) {
      const adapter = byKind[spec.kind]
      return adapter ? adapter.load(spec) : Promise.reject(new Error(`No data adapter for kind "${spec.kind}"`))
    },
  }
}

/** static + rest out of the box; apps add `collection` with their own db. */
export const defaultAdapter = composeAdapters({ static: staticAdapter, rest: restAdapter })
