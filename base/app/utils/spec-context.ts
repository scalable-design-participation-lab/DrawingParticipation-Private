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
  /** "$t.some.key" -> translated text (vue-i18n when the app has it; the key otherwise). */
  translate?: (key: string) => string
  /** Current UI locale ("$locale"). */
  locale?: string
}

/** `"$state.view == 'list'"`, `"$state.n != 0"`, with an optional leading `!`. */
const CONDITION_RE = /^(!?)(\$[\w.-]+)\s*(==|!=)\s*(\S.*)$/

function literal(raw: string): unknown {
  const s = raw.trim()
  if (/^'.*'$/.test(s) || /^".*"$/.test(s)) {
    return s.slice(1, -1)
  }
  if (s === 'true' || s === 'false') {
    return s === 'true'
  }
  if (s === 'null') {
    return null
  }
  return Number.isNaN(Number(s)) ? s : Number(s)
}

/** The expressions of a condition, one per `&&` part (for the verifier). */
export function conditionExprs(expr: string): string[] {
  return expr.split(/\s*&&\s*/).map(part => parseCondition(part)?.expr ?? part)
}

/** Splits a condition into its expression and the rest; null when it is a plain expression. */
function parseCondition(expr: string): { negate: boolean, expr: string, op?: '==' | '!=', value?: unknown } | null {
  const match = CONDITION_RE.exec(expr)
  if (match) {
    return { negate: match[1] === '!', expr: match[2], op: match[3] as '==' | '!=', value: literal(match[4]) }
  }
  if (expr.startsWith('!$')) {
    return { negate: true, expr: expr.slice(1) }
  }
  return null
}

/** Truthiness of `if` / boolean `value` expressions, including `!` and `==` / `!=` forms. */
export function evaluate(expr: unknown, ctx: SpecContext, item?: unknown, payload?: unknown): unknown {
  if (typeof expr !== 'string') {
    return expr
  }
  if (expr.includes('&&')) {
    return expr.split(/\s*&&\s*/).every(part => Boolean(evaluate(part, ctx, item, payload)))
  }
  const cond = parseCondition(expr)
  if (!cond) {
    return resolveExpr(expr, ctx, item, payload)
  }
  const left = resolveExpr(cond.expr, ctx, item, payload)
  const result = cond.op ? (cond.op === '==' ? left === cond.value : left !== cond.value) : Boolean(left)
  return cond.negate ? !result : result
}

export const SPEC_CONTEXT: InjectionKey<SpecContext> = Symbol('spec-context')

function getPath(root: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), root)
}

function setPath(root: Record<string, unknown>, path: string, value: unknown) {
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

/** "$state.a.b" -> ctx.state.a.b; "$item.x" -> item.x; "$payload.x" -> the event's x; anything else is a literal. */
export function resolveExpr(expr: unknown, ctx: SpecContext, item?: unknown, payload?: unknown): unknown {
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
    case 'payload': return path.length ? getPath(payload, path) : payload
    case 'data': return getPath(ctx.data, path)
    case 'sources': return getPath(ctx.sources, path)
    case 'errors': return getPath(ctx.errors, path)
    case 'query': return getPath(ctx.query, path)
    case 't': return ctx.translate ? ctx.translate(path.join('.')) : path.join('.')
    case 'locale': return ctx.locale
    default: return getPath(ctx.state, path)
  }
}

/**
 * Action `value` / `args` / `payload`: every "$..." string is resolved, at any
 * depth, so an action can build an object out of page state
 * (`{ "propuestaId": "$state.open.id" }`). Literals pass through.
 */
function resolveValue(value: unknown, ctx: SpecContext, item: unknown, payload?: unknown): unknown {
  if (typeof value === 'string') {
    return /^!?\$/.test(value) ? evaluate(value, ctx, item, payload) : value
  }
  if (Array.isArray(value)) {
    return value.map(v => resolveValue(v, ctx, item, payload))
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(v, ctx, item, payload)]))
  }
  return value
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
        const given = 'payload' in action ? resolveValue(action.payload, ctx, item, payload) : payload
        await handler(given, ctx, resolveValue(action.args, ctx, item, payload))
        ctx.errors[action.call] = undefined
      }
      catch (err) {
        ctx.errors[action.call] = err instanceof Error ? err.message : String(err)
        console.error(`[spec] handler "${action.call}" failed:`, err)
        return
      }
    }
    else {
      setPath(ctx.state, action.set, 'value' in action ? resolveValue(action.value, ctx, item, payload) : payload)
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
  // Translations may sit anywhere in literal props (field labels, step titles, menu items).
  if (typeof value === 'string' && value.startsWith('$t.')) {
    return resolveExpr(value, ctx, item)
  }
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
