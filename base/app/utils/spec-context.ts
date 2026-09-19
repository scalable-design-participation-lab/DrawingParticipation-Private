import type { InjectionKey } from 'vue'
import { BIND_RE } from '../contracts/spec'
import type { ActionList } from '../contracts/spec'
import type { DataSourceState } from '../data/useDataSources'
import { getHandler } from './handlers'

/** What a rendered spec can see: page state, loaded data, data-source status, handler errors, route query. */
export interface SpecContext {
  state: Record<string, unknown>
  data: Record<string, unknown>
  sources: Record<string, DataSourceState>
  /** handler name -> last error message (cleared on the next successful call). */
  errors: Record<string, string | undefined>
  query: Record<string, unknown>
  navigate: (to: string) => void
  /** Reload one data source (or all of them) after a write. */
  reload: (name?: string) => Promise<void>
}

export const SPEC_CONTEXT: InjectionKey<SpecContext> = Symbol('spec-context')

export function getPath(root: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), root)
}

export function setPath(root: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce<Record<string, unknown>>((acc, key) => {
    if (typeof acc[key] !== 'object' || acc[key] === null) {
      acc[key] = {}
    }
    return acc[key] as Record<string, unknown>
  }, root)
  target[last] = value
}

/** "$state.a.b" -> ctx.state.a.b; "$item.x" -> item.x; anything else is a literal. */
export function resolveExpr(expr: unknown, ctx: SpecContext, item?: unknown): unknown {
  if (typeof expr !== 'string') {
    return expr
  }
  const match = BIND_RE.exec(expr)
  if (!match) {
    return expr
  }
  const [, root, rest] = match
  const path = rest ? rest.slice(1).split('.') : []
  switch (root) {
    case 'item': return getPath(item, path)
    case 'data': return getPath(ctx.data, path)
    case 'sources': return getPath(ctx.sources, path)
    case 'errors': return getPath(ctx.errors, path)
    case 'query': return getPath(ctx.query, path)
    default: return getPath(ctx.state, path)
  }
}

/** Action `value` / `args` may be expressions ("$item.id", "!$state.open"); literals pass through. */
function resolveValue(value: unknown, ctx: SpecContext, item: unknown) {
  if (typeof value !== 'string') {
    return value
  }
  if (value.startsWith('!$')) {
    return !resolveExpr(value.slice(1), ctx, item)
  }
  return value.startsWith('$') ? resolveExpr(value, ctx, item) : value
}

/**
 * Runs the actions in order. A handler that throws (or rejects) stops the
 * list, is logged, and is exposed as `$errors.<handler>` so the spec can show
 * it; it never takes the page down.
 */
export async function runAction(actions: ActionList, payload: unknown, ctx: SpecContext, item?: unknown) {
  for (const action of Array.isArray(actions) ? actions : [actions]) {
    if ('navigate' in action) {
      ctx.navigate(action.navigate)
    }
    else if ('toggle' in action) {
      setPath(ctx.state, action.toggle, !getPath(ctx.state, action.toggle.split('.')))
    }
    else if ('call' in action) {
      const handler = getHandler(action.call)
      if (!handler) {
        console.error(`[spec] no handler registered for "${action.call}"`)
        ctx.errors[action.call] = `handler "${action.call}" is not registered`
        return
      }
      try {
        await handler(payload, ctx, resolveValue(action.args, ctx, item))
        ctx.errors[action.call] = undefined
      }
      catch (err) {
        ctx.errors[action.call] = err instanceof Error ? err.message : String(err)
        console.error(`[spec] handler "${action.call}" failed:`, err)
        return
      }
    }
    else {
      setPath(ctx.state, action.set, 'value' in action ? resolveValue(action.value, ctx, item) : payload)
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep-copies literal props, turning every `{ "$action": ... }` into a
 * callback. This is how JSON expresses `onClick` on data items (header items,
 * toolbar tools) without a slot or an event on the parent.
 */
export function materializeProps(value: unknown, ctx: SpecContext, item?: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(v => materializeProps(v, ctx, item))
  }
  if (isPlainObject(value)) {
    if ('$action' in value) {
      const actions = value.$action as ActionList
      return (payload: unknown) => runAction(actions, payload, ctx, item)
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, materializeProps(v, ctx, item)]))
  }
  return value
}
