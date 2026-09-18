import type { z } from 'zod'
import { getContract } from '../contracts/components'
import { isHandlerDeclared } from '../contracts/handlers'
import { ActionListSchema, BIND_RE, RootSpecSchema } from '../contracts/spec'
import type { ActionList, RootSpec, SpecNode } from '../contracts/spec'
import { getStyle } from '../utils/styles'

/**
 * Level 1 (static) verifier. Pure functions, no DOM, no network: safe to run
 * on every LLM output in milliseconds.
 *
 * Every failure carries a JSON path so the author (human or model) can fix the
 * exact node without re-reading the whole spec.
 */
export interface VerifyError {
  /** JSON path into the spec, e.g. "children[0].bind.items". */
  path: string
  /** Stable rule id, e.g. "component.unknown". */
  rule: string
  message: string
}

export interface VerifyResult {
  pass: boolean
  errors: VerifyError[]
}

export interface VerifySpecOptions {
  /** Registered component names. Defaults to every contract registered so far. */
  components?: string[]
  /** Extra `$data.*` names the host page supplies via SpecRenderer's `data` prop. */
  extraData?: string[]
  /** Extra handler names beyond the declared ones. */
  handlers?: string[]
  /**
   * Strict mode: no raw `class` props anywhere. Styling must go through
   * component props (variants) or registered style presets (`style`). This is
   * the mode to run on LLM output.
   */
  strict?: boolean
}

const NATIVE_TAG = /^[a-z][a-z0-9-]*$/
// Attributes any component accepts without declaring them.
const PASSTHROUGH_PROPS = new Set(['class', 'style', 'id', 'key'])

function issuePath(issue: { path: PropertyKey[] }) {
  return issue.path.map(p => (typeof p === 'number' ? `[${p}]` : `.${String(p)}`)).join('').replace(/^\./, '')
}

function joinPath(prefix: string, rest: string) {
  return rest ? `${prefix}${rest.startsWith('[') ? '' : '.'}${rest}` : prefix
}

/** zod issues -> VerifyErrors. Unknown keys get one error per key so the path names the offending prop. */
function issuesToErrors(issues: z.core.$ZodIssue[], prefix: string, rule: string): VerifyError[] {
  return issues.flatMap((issue) => {
    const base = joinPath(prefix, issuePath(issue))
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map(key => ({ path: `${base}.${key}`, rule, message: `Unrecognized key "${key}"` }))
    }
    return [{ path: base, rule, message: issue.message }]
  })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function verifySpec(spec: unknown, options: VerifySpecOptions = {}): VerifyResult {
  const errors: VerifyError[] = []

  const parsed = RootSpecSchema.safeParse(spec)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({ path: issuePath(issue) || '(root)', rule: 'spec.schema', message: issue.message })
    }
    return { pass: false, errors }
  }

  const root: RootSpec = parsed.data
  const known = new Set(options.components ?? [])
  const sourceNames = new Set(Object.keys(root.dataSources ?? {}))
  const dataNames = new Set([...sourceNames, ...(options.extraData ?? [])])
  const stateNames = new Set(Object.keys(root.state ?? {}))
  const handlerNames = new Set(options.handlers ?? [])

  // Initial state may read the route query ("$query.x"); nothing else.
  for (const [key, value] of Object.entries(root.state ?? {})) {
    if (typeof value === 'string' && value.startsWith('$') && !/^\$query(?:\.[\w-]+)+$/.test(value)) {
      errors.push({ path: `state.${key}`, rule: 'state.bad-init', message: `initial state may only reference "$query.<param>", got "${value}"` })
    }
  }

  const checkExpr = (expr: string, at: string, inItem: boolean) => {
    const match = BIND_RE.exec(expr)
    if (!match) {
      errors.push({ path: at, rule: 'bind.bad-expr', message: `"${expr}" is not "$data.x", "$state.x", "$sources.x", "$query.x" or "$item[.x]"` })
      return
    }
    const [, kind, rest] = match
    const first = rest.split('.')[1]
    if ((kind === 'data' && !dataNames.has(first)) || (kind === 'sources' && !sourceNames.has(first))) {
      errors.push({ path: at, rule: 'bind.unknown-data', message: `data source "${first}" is not declared in dataSources` })
    }
    if (kind === 'state' && !stateNames.has(first)) {
      errors.push({ path: at, rule: 'bind.unknown-state', message: `state "${first}" is not declared in state` })
    }
    if (kind === 'item' && !inItem) {
      errors.push({ path: at, rule: 'bind.item-outside-template', message: '"$item" is only available inside an "item" template' })
    }
  }

  const checkActions = (actions: ActionList, at: string, inItem: boolean) => {
    for (const [i, action] of (Array.isArray(actions) ? actions : [actions]).entries()) {
      const p = Array.isArray(actions) ? `${at}[${i}]` : at
      const statePath = 'set' in action ? action.set : 'toggle' in action ? action.toggle : null
      if (statePath !== null && !stateNames.has(statePath.split('.')[0])) {
        const key = 'set' in action ? 'set' : 'toggle'
        errors.push({ path: `${p}.${key}`, rule: 'action.unknown-state', message: `state "${statePath}" is not declared in state` })
      }
      if ('call' in action && !isHandlerDeclared(action.call) && !handlerNames.has(action.call)) {
        errors.push({ path: `${p}.call`, rule: 'action.unknown-handler', message: `handler "${action.call}" is not registered` })
      }
      // `value` / `args` may be expressions.
      const dynamic: [string, unknown] | null = 'set' in action ? ['value', action.value] : 'call' in action ? ['args', action.args] : null
      if (dynamic && typeof dynamic[1] === 'string' && dynamic[1].startsWith('$')) {
        checkExpr(dynamic[1], `${p}.${dynamic[0]}`, inItem)
      }
    }
  }

  // `{ "$action": ... }` objects may sit anywhere inside literal props.
  const checkActionProps = (value: unknown, at: string, inItem: boolean) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => checkActionProps(v, `${at}[${i}]`, inItem))
      return
    }
    if (!isPlainObject(value)) {
      return
    }
    if ('$action' in value) {
      const parsedAction = ActionListSchema.safeParse(value.$action)
      if (!parsedAction.success) {
        errors.push(...issuesToErrors(parsedAction.error.issues, `${at}.$action`, 'action.invalid'))
      }
      else {
        checkActions(parsedAction.data, `${at}.$action`, inItem)
      }
      return
    }
    for (const [k, v] of Object.entries(value)) {
      checkActionProps(v, `${at}.${k}`, inItem)
    }
  }

  // Strip callbacks before contract validation: `{ "$action" }` is not a prop value.
  const stripActions = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(stripActions)
    }
    if (isPlainObject(value)) {
      if ('$action' in value) {
        return undefined
      }
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripActions(v)]).filter(([, v]) => v !== undefined))
    }
    return value
  }

  const walk = (node: SpecNode, path: string, inItem: boolean) => {
    const contract = getContract(node.type)
    const registered = known.size ? known.has(node.type) : !!contract
    if (!registered && !contract && !NATIVE_TAG.test(node.type)) {
      errors.push({ path: `${path}.type`, rule: 'component.unknown', message: `"${node.type}" is not a registered component or a native tag` })
    }

    if (options.strict && node.props && 'class' in node.props) {
      errors.push({ path: `${path}.props.class`, rule: 'style.raw-class', message: 'strict mode: use component props or a registered `style` preset instead of raw classes' })
    }
    const styles = Array.isArray(node.style) ? node.style : node.style ? [node.style] : []
    for (const [i, name] of styles.entries()) {
      if (!getStyle(name)) {
        errors.push({ path: Array.isArray(node.style) ? `${path}.style[${i}]` : `${path}.style`, rule: 'style.unknown', message: `style preset "${name}" is not registered` })
      }
    }

    checkActionProps(node.props ?? {}, `${path}.props`, inItem)

    if (contract) {
      const props = Object.fromEntries(Object.entries(stripActions(node.props ?? {}) as Record<string, unknown>).filter(([k]) => !PASSTHROUGH_PROPS.has(k)))
      const schema = contract.looseProps ? contract.props.partial().loose() : contract.props.partial()
      const result = schema.safeParse(props)
      if (!result.success) {
        errors.push(...issuesToErrors(result.error.issues, `${path}.props`, 'props.invalid'))
      }
      if (!contract.looseProps) {
        for (const prop of Object.keys(node.bind ?? {})) {
          if (!(prop in contract.props.shape) && !PASSTHROUGH_PROPS.has(prop)) {
            errors.push({ path: `${path}.bind.${prop}`, rule: 'bind.unknown-prop', message: `"${node.type}" has no prop "${prop}"` })
          }
        }
      }
      if (contract.slots) {
        for (const [i, child] of (node.children ?? []).entries()) {
          const slot = child.slot ?? 'default'
          if (!contract.slots.includes(slot)) {
            errors.push({ path: `${path}.children[${i}].slot`, rule: 'slot.unknown', message: `"${node.type}" has no slot "${slot}"` })
          }
        }
        if (node.item && !contract.slots.includes('item')) {
          errors.push({ path: `${path}.item`, rule: 'slot.unknown', message: `"${node.type}" has no "item" slot` })
        }
      }
      if (contract.emits) {
        for (const event of Object.keys(node.on ?? {})) {
          if (!contract.emits.includes(event)) {
            errors.push({ path: `${path}.on.${event}`, rule: 'event.unknown', message: `"${node.type}" does not emit "${event}"` })
          }
        }
      }
    }

    for (const [prop, expr] of Object.entries(node.bind ?? {})) {
      checkExpr(expr, `${path}.bind.${prop}`, inItem)
    }
    if (node.if !== undefined) {
      checkExpr(node.if, `${path}.if`, inItem)
    }
    if (node.text?.startsWith('$')) {
      checkExpr(node.text, `${path}.text`, inItem)
    }
    for (const [event, actions] of Object.entries(node.on ?? {})) {
      checkActions(actions, `${path}.on.${event}`, inItem)
    }

    for (const [i, child] of (node.children ?? []).entries()) {
      walk(child, `${path}.children[${i}]`, inItem)
    }
    if (node.item) {
      walk(node.item, `${path}.item`, true)
    }
  }

  for (const [i, child] of root.children.entries()) {
    walk(child, `children[${i}]`, false)
  }

  return { pass: errors.length === 0, errors }
}

/** Level 3 (contract) check used by the data layer: every row must satisfy the collection schema. */
export function verifyRows(rows: unknown, schema: z.ZodType): VerifyResult {
  if (!Array.isArray(rows)) {
    return { pass: false, errors: [{ path: '(root)', rule: 'rows.not-array', message: 'adapter did not return an array' }] }
  }
  const errors: VerifyError[] = []
  rows.forEach((row, i) => {
    const result = schema.safeParse(row)
    if (!result.success) {
      errors.push(...issuesToErrors(result.error.issues, `[${i}]`, 'row.invalid'))
    }
  })
  return { pass: errors.length === 0, errors }
}
