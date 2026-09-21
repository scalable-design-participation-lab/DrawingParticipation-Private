import { z } from 'zod'

/**
 * The page spec: the JSON an app (or an LLM) writes instead of a Vue page.
 *
 * A node says WHICH component to use, WHAT literal props to pass, what to BIND
 * from data/state, WHEN to render (`if`) and which ACTIONS run on events.
 * Nothing else: no expressions, no loops. Logic stays inside components and
 * registered handlers.
 */

const ActionSchema = z.union([
  z.strictObject({
    set: z.string().describe('State path to write, e.g. "welcome" or "filters.year".'),
    value: z.unknown().optional().describe('Value to write; a "$..." string is resolved (e.g. "$item.id"). Omitted = the event payload.'),
  }),
  z.strictObject({ navigate: z.string().describe('Route to push.') }),
  z.strictObject({ toggle: z.string().describe('Boolean state path to flip.') }),
  z.strictObject({
    call: z.string().describe('Name of a handler registered by the app (registerHandler).'),
    args: z.unknown().optional().describe('Arguments passed to the handler after the payload; a "$..." string is resolved.'),
    payload: z.unknown().optional().describe('What the handler receives instead of the event; every "$..." string inside is resolved (e.g. { "propuestaId": "$state.open.id" }).'),
  }),
])
export type Action = z.infer<typeof ActionSchema>

/** One action or a list run in order. */
export const ActionListSchema = z.union([ActionSchema, z.array(ActionSchema)])
export type ActionList = z.infer<typeof ActionListSchema>

/**
 * Enrich every row of this source with an aggregate of another one: the rows
 * of `from` whose `on` field equals this row's `key` (default "id") are
 * counted into `count`, or their `sum` field is added up into `as`.
 */
const JoinSchema = z.strictObject({
  from: z.string().describe('Another data source declared on the same page'),
  on: z.string().describe('Field of the other source holding this row\'s id'),
  key: z.string().optional().describe('Field of this row the other source points at (default "id")'),
  count: z.string().optional().describe('Output field holding how many rows matched'),
  sum: z.string().optional().describe('Numeric field of the other source to add up'),
  as: z.string().optional().describe('Output field for `sum` (default the `sum` field name)'),
}).refine(j => j.count || j.sum, { message: 'a join needs `count` or `sum`' })

const joinable = { join: z.array(JoinSchema).optional() }

const DataSourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('static'),
    contract: z.string().optional().describe('Collection contract the rows must satisfy.'),
    items: z.array(z.unknown()),
    ...joinable,
  }),
  z.strictObject({
    kind: z.literal('collection'),
    name: z.string().describe('Backend collection name (Firestore collection, table, ...).'),
    contract: z.string().optional(),
    where: z.array(z.tuple([z.string(), z.string(), z.unknown()])).optional(),
    limit: z.number().int().positive().optional(),
    ...joinable,
  }),
  z.strictObject({
    kind: z.literal('rest'),
    url: z.string(),
    contract: z.string().optional(),
    ...joinable,
  }),
])
export type DataSourceSpec = z.infer<typeof DataSourceSchema>
export type JoinSpec = z.infer<typeof JoinSchema>

export interface SpecNode {
  /** Registry name ("BackgroundMap") or a native tag ("div"). */
  type: string
  /**
   * Literal props, validated against the component contract. A value of the
   * form `{ "$action": Action }` becomes a callback (for `onClick`-style item
   * props such as header items or toolbar tools).
   */
  props?: Record<string, unknown>
  /** prop -> "$data.<source>", "$state.<path>", "$query.<param>" or "$item[.path]". */
  bind?: Record<string, string>
  on?: Record<string, ActionList>
  /** Render only when this expression is truthy. */
  if?: string
  /** Style preset name(s) from the style registry (the strict-mode replacement for `class`). */
  style?: string | string[]
  /** Named slot of the parent this node goes into. */
  slot?: string
  children?: SpecNode[]
  /** Template rendered once per item by list components (MarkerOverlay...). */
  item?: SpecNode
  /** Text content (native tags only). May be a "$..." binding. */
  text?: string
}

const SpecNodeSchema: z.ZodType<SpecNode> = z.lazy(() => z.strictObject({
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
  bind: z.record(z.string(), z.string()).optional(),
  on: z.record(z.string(), ActionListSchema).optional(),
  /** Render only while the expression is truthy; a leading "!" negates it. */
  if: z.string().optional(),
  style: z.union([z.string(), z.array(z.string())]).optional(),
  slot: z.string().optional(),
  children: z.array(SpecNodeSchema).optional(),
  item: SpecNodeSchema.optional(),
  text: z.string().optional(),
}))

export const RootSpecSchema = z.strictObject({
  version: z.literal(1).optional(),
  /** Initial page state. A string value of the form "$query.x" is read from the route on load. */
  state: z.record(z.string(), z.unknown()).optional(),
  dataSources: z.record(z.string(), DataSourceSchema).optional(),
  /** Actions run once when the page mounts (load a user, fetch results, …). */
  init: ActionListSchema.optional(),
  children: z.array(SpecNodeSchema),
})
export type RootSpec = z.infer<typeof RootSpecSchema>

/** Bind expressions: "$data.x", "$state.a.b", "$query.q", "$item", "$item.reading.humedad". */
export const BIND_RE = /^\$(data|state|sources|errors|item|query|t|locale|payload)((?:\.[\w-]+)*)$/
