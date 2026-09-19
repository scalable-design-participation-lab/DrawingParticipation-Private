/**
 * The generation loop: catalogue → prompt → model → JSON → verify → patches.
 *
 *   yarn workspace @mono/base gen-spec --app apps/<app> --page <name> --prompt "…" [--provider stub|anthropic] [--rounds 3]
 *
 * Round 1 asks for a whole spec, constrained to the page-spec JSON Schema
 * (Anthropic tool use with the schema as input_schema, so the reply is always
 * valid JSON of the right shape). Every later round asks only for patches at
 * the paths the verifier flagged, so a fix cannot regress the rest of the
 * page. The catalogue carries one verified example per component (mined from
 * the specs in this repo) and the two existing specs closest to the request.
 *
 * Writes `apps/<app>/app/specs/<name>.json` when the spec passes the strict
 * verifier and prints the verify result otherwise. The `stub` provider reads
 * the "model output" from `--stub round1.json[,round2.json,…]` so the loop
 * can be exercised without an API key; `anthropic` calls the Messages API
 * with ANTHROPIC_API_KEY. Nothing else in the repo knows which provider ran.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import process from 'node:process'
import { z } from 'zod'
import { listContracts } from '../app/contracts/components'
import { listStyles } from '../app/utils/styles'
import { listCollections } from '../app/contracts/collections'
import { listHandlers } from '../app/contracts/handlers'
import { RootSpecSchema } from '../app/contracts/spec'
import { applyPatches } from '../app/utils/spec-patch'
import type { SpecPatch } from '../app/utils/spec-patch'
import { verifySpec } from '../app/verifier'
import type { VerifyResult } from '../app/verifier'

const args = process.argv.slice(2)
function flag(name: string) {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
const repoRoot = resolve(import.meta.dirname, '../..')
function fromUser(p: string) {
  const local = resolve(process.cwd(), p)
  return existsSync(local) ? local : resolve(repoRoot, p)
}

const appDir = flag('app')
const page = flag('page')
const prompt = flag('prompt')
if (!appDir || !page || !prompt) {
  console.error('usage: generate --app <dir> --page <name> --prompt "…" [--provider stub|anthropic] [--stub r1.json,r2.json] [--rounds 3]')
  process.exit(2)
}
const root = fromUser(appDir)
const contracts = resolve(root, 'app/contracts.ts')
if (existsSync(contracts)) {
  await import(contracts.split('\\').join('/'))
}

// ---------------------------------------------------------------------------
// Verified specs in the repo: examples per component + few-shot pages.
// ---------------------------------------------------------------------------
interface Node { type?: string, props?: unknown, bind?: unknown, on?: unknown, style?: unknown, text?: unknown, children?: Node[], item?: Node }
interface SpecFile { file: string, own: boolean, spec: { children?: Node[] } }

const specsDir = resolve(root, 'app/specs')
const manifestFile = resolve(root, 'app/app.json')
const routes = existsSync(manifestFile) ? Object.keys((JSON.parse(readFileSync(manifestFile, 'utf8')) as { routes?: Record<string, string> }).routes ?? {}) : undefined
const appsDir = resolve(repoRoot, 'apps')
const specFiles: SpecFile[] = readdirSync(appsDir).flatMap((app) => {
  const dir = resolve(appsDir, app, 'app/specs')
  return existsSync(dir)
    ? readdirSync(dir).filter(f => f.endsWith('.json')).map(f => ({ file: resolve(dir, f), own: dir === specsDir, spec: JSON.parse(readFileSync(resolve(dir, f), 'utf8')) }))
    : []
})

function* nodes(list: Node[] | undefined): Generator<Node> {
  for (const node of list ?? []) {
    yield node
    yield * nodes(node.children)
    if (node.item) {
      yield * nodes([node.item])
    }
  }
}

/** First verified use of a component: its props / bind / on / style, no children. */
function exampleFor(name: string) {
  for (const { spec } of specFiles) {
    for (const node of nodes(spec.children)) {
      if (node.type === name) {
        const { props, bind, on, style, text } = node
        return { ...(props && { props }), ...(bind && { bind }), ...(on && { on }), ...(style && { style }), ...(text !== undefined && { text }) }
      }
    }
  }
  return undefined
}

const words = (s: string) => new Set(s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [])
const promptWords = words(prompt)
/** The two specs most similar to the request (word overlap; this app's specs first on ties). */
const examples = specFiles
  .map(f => ({ f, score: [...words(JSON.stringify(f.spec))].filter(w => promptWords.has(w)).length + (f.own ? 0.5 : 0) }))
  .sort((a, b) => b.score - a.score).slice(0, 2)
  .map(({ f }) => `### ${basename(f.file)}\n${JSON.stringify(f.spec)}`).join('\n\n')

// ---------------------------------------------------------------------------
// The catalogue the model sees: what exists, nothing else.
// ---------------------------------------------------------------------------
const catalogue = {
  components: listContracts().map(c => ({
    name: c.name,
    description: c.description,
    props: Object.fromEntries(Object.entries(c.props.shape).map(([k, v]) => [k, describeZod(v)])),
    emits: c.emits ?? [],
    slots: c.slots ?? [],
    example: exampleFor(c.name),
  })),
  collections: listCollections().map(([name]) => name),
  handlers: listHandlers(),
  styles: listStyles().map(s => ({ name: s.name, description: s.description })),
}

function describeZod(schema: unknown): string {
  // Short human-readable type; the JSON Schema in docs/schemas is the exact source.
  const def = (schema as { def?: { type?: string, values?: unknown[], innerType?: unknown, element?: unknown }, description?: string }).def ?? {}
  const desc = (schema as { description?: string }).description
  let type = def.type ?? 'unknown'
  if (type === 'optional' && def.innerType) {
    type = describeZod(def.innerType)
  }
  else if (type === 'enum' && def.values) {
    type = def.values.map(v => JSON.stringify(v)).join(' | ')
  }
  else if (type === 'array' && def.element) {
    type = `${describeZod(def.element)}[]`
  }
  return desc ? `${type} — ${desc}` : type
}

const system = `You write page specs for a Nuxt app. A spec is JSON only: no code, no expressions.
Rules (docs/SPEC-FORMAT.md): a node has only type/props/bind/on/if/style/slot/children/item/text.
Use only the components, handlers and style presets listed; each component's "example" is a verified use of it.
Never use a "class" prop; use component props or "style" presets.
Bind with "$state.x", "$data.x", "$sources.x.loading", "$errors.<handler>", "$query.x", "$item.x". Actions: set/toggle/navigate/call.
Every state key must be read or written somewhere; an input bound to "$state.x" needs on["update:modelValue"] = { "set": "x" }.`

const context = `## Catalogue\n${JSON.stringify(catalogue, null, 1)}\n\n## Verified specs closest to the task\n${examples}\n\n## Task\n${prompt}`

// Tools: the whole spec in round 1, patches at the flagged paths afterwards.
const toSchema = (schema: z.ZodType) => z.toJSONSchema(schema, { unrepresentable: 'any' })
const PatchesSchema = z.strictObject({
  patches: z.array(z.strictObject({
    path: z.string().describe('A path from the verifier errors, e.g. "children[0].props.to"'),
    value: z.unknown().optional().describe('New value at that path'),
    remove: z.boolean().optional().describe('Delete the key or array element instead'),
  })),
})
const writeSpec = { name: 'write_spec', description: 'Submit the complete page spec.', input_schema: toSchema(RootSpecSchema) }
const patchSpec = { name: 'patch_spec', description: 'Fix the flagged paths of the previous spec; one patch per error, nothing else changes.', input_schema: toSchema(PatchesSchema) }

// ---------------------------------------------------------------------------
// Providers: (system, user, tool) -> the tool input as parsed JSON
// ---------------------------------------------------------------------------
type Tool = typeof writeSpec
type Provider = (system: string, user: string, tool: Tool, round: number) => Promise<unknown>

const providers: Record<string, Provider> = {
  // Exercises the loop without a model: the "answers" are files on disk, one per round (the last one repeats).
  stub: async (_system, _user, _tool, round) => {
    const files = (flag('stub') ?? '').split(',').filter(Boolean)
    const file = files[Math.min(round, files.length) - 1]
    if (!file) {
      throw new Error('--stub <round1.json[,round2.json,…]> is required with the stub provider')
    }
    return JSON.parse(readFileSync(fromUser(file), 'utf8'))
  },
  anthropic: async (system, user, tool) => {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: flag('model') ?? 'claude-sonnet-5',
        max_tokens: 8000,
        system,
        tools: [tool],
        tool_choice: { type: 'tool', name: tool.name },
        messages: [{ role: 'user', content: user }],
      }),
    })
    if (!response.ok) {
      throw new Error(`Anthropic API ${response.status}: ${await response.text()}`)
    }
    const body = await response.json() as { content: { type: string, name?: string, input?: unknown }[] }
    const call = body.content.find(c => c.type === 'tool_use' && c.name === tool.name)
    if (!call) {
      throw new Error('model did not call the tool')
    }
    return call.input
  },
}

const provider = providers[flag('provider') ?? 'stub']
if (!provider) {
  console.error(`unknown provider; use ${Object.keys(providers).join(' | ')}`)
  process.exit(2)
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
const rounds = Number(flag('rounds') ?? 3)
let spec: unknown
let feedback: VerifyResult | undefined
for (let round = 1; round <= rounds; round++) {
  if (round === 1) {
    spec = await provider(system, context, writeSpec, round)
  }
  else {
    const user = `${context}\n\n## Your spec\n${JSON.stringify(spec)}\n\n## It failed verification. Return one patch per error: at the flagged path, or at the path its message tells you to add. Change nothing else:\n${JSON.stringify(feedback!.errors, null, 1)}`
    const { patches } = PatchesSchema.parse(await provider(system, user, patchSpec, round))
    spec = applyPatches(spec, patches as SpecPatch[])
  }
  const result = verifySpec(spec, { strict: true, routes })
  if (result.pass) {
    const out = resolve(specsDir, `${page}.json`)
    writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`)
    console.log(`round ${round}: pass → ${out}`)
    process.exit(0)
  }
  feedback = result
  console.error(`round ${round}: ${result.errors.length} error(s)`)
  console.error(JSON.stringify(result.errors, null, 2))
}
process.exit(1)
