/**
 * The generation loop: outline → trimmed catalogue → spec → verify → patches.
 *
 *   yarn workspace @mono/base gen-spec --app apps/<app> --page <name> --prompt "…" [--provider stub|anthropic] [--rounds 3]
 *
 * 1. Outline: the model sees every component's name + description (small)
 *    and returns the sections of the page and the components it will use.
 *    Unknown names are dropped, so the next step only ever sees real ones.
 * 2. Spec: the catalogue is trimmed to the chosen components (+ the layout
 *    primitives), each with its props and one verified example mined from
 *    the specs in this repo, plus the two existing specs closest to the
 *    request. The answer is structured output shaped by the page-spec
 *    schema, so it is always valid JSON of the right shape.
 * 3. Verify (strict, with the app's routes). On failure the model returns
 *    one patch per error and only those paths change (base/app/utils/spec-patch.ts).
 *
 * Writes `apps/<app>/app/specs/<name>.json` on pass. The `stub` provider
 * reads the answers from `--stub outline.json,spec.json[,patches.json,…]`
 * in call order; `anthropic` needs ANTHROPIC_API_KEY (see llm.ts).
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
import { verifySpec } from '../app/verifier'
import type { VerifyResult } from '../app/verifier'
import { providerFromArgs } from './llm'

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
  console.error('usage: generate --app <dir> --page <name> --prompt "…" [--provider stub|anthropic] [--stub outline.json,spec.json,…] [--rounds 3] [--model …] [--effort …]')
  process.exit(2)
}
const root = fromUser(appDir)
const contracts = resolve(root, 'app/contracts.ts')
if (existsSync(contracts)) {
  await import(contracts.split('\\').join('/'))
}
const ask = providerFromArgs(flag, fromUser)

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
// Catalogue: what exists, nothing else. Names first (outline), details later.
// ---------------------------------------------------------------------------
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

const all = listContracts()
const names = new Set(all.map(c => c.name))
// Always available: the layout primitives every page is built from.
const ALWAYS = ['Stack', 'Grid', 'Panel', 'Text', 'Image', 'Button']

function catalogue(chosen: Set<string>) {
  return {
    components: all.filter(c => chosen.has(c.name)).map(c => ({
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
    routes,
  }
}

const system = `You write page specs for a Nuxt app. A spec is JSON only: no code, no expressions.
Rules (docs/SPEC-FORMAT.md): a node has only type/props/bind/on/if/style/slot/children/item/text.
Use only the components, handlers and style presets listed; each component's "example" is a verified use of it.
Never use a "class" prop; use component props or "style" presets.
Bind with "$state.x", "$data.x", "$sources.x.loading", "$errors.<handler>", "$query.x", "$item.x". Actions: set/toggle/navigate/call.
Every state key must be read or written somewhere; an input bound to "$state.x" needs on["update:modelValue"] = { "set": "x" }.
Links and navigate targets must be one of the app's routes.`

// ---------------------------------------------------------------------------
// 1. Outline
// ---------------------------------------------------------------------------
const OutlineSchema = z.strictObject({
  sections: z.array(z.strictObject({
    title: z.string(),
    purpose: z.string().describe('What the user does or sees here, one sentence'),
    components: z.array(z.string()).describe('Component names from the list'),
  })),
  state: z.array(z.string()).describe('State keys the page needs, e.g. "open", "selected"'),
})
const outline = await ask(
  OutlineSchema,
  `${system}\nFirst plan the page: its sections and which listed components each one uses. Pick few components; prefer the ones whose description fits exactly.`,
  `## Components\n${all.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\n## Task\n${prompt}`,
  'outline',
)
const chosen = new Set([...ALWAYS, ...outline.sections.flatMap(s => s.components).filter(n => names.has(n))])
console.error(`outline: ${outline.sections.map(s => s.title).join(' / ')} → ${[...chosen].join(', ')}`)

// ---------------------------------------------------------------------------
// 2. Spec, 3. verify + patches
// ---------------------------------------------------------------------------
const context = `## Catalogue\n${JSON.stringify(catalogue(chosen), null, 1)}\n\n## Verified specs closest to the task\n${examples}\n\n## Outline\n${JSON.stringify(outline, null, 1)}\n\n## Task\n${prompt}`

const PatchesSchema = z.strictObject({
  patches: z.array(z.strictObject({
    path: z.string().describe('A path from the verifier errors, e.g. "children[0].props.to"'),
    value: z.unknown().optional().describe('New value at that path'),
    remove: z.boolean().optional().describe('Delete the key or array element instead'),
  })),
})

const rounds = Number(flag('rounds') ?? 3)
let spec: unknown
let feedback: VerifyResult | undefined
for (let round = 1; round <= rounds; round++) {
  if (round === 1) {
    spec = await ask(RootSpecSchema, system, context, 'spec')
  }
  else {
    const user = `${context}\n\n## Your spec\n${JSON.stringify(spec)}\n\n## It failed verification. Return one patch per error: at the flagged path, or at the path its message tells you to add. Change nothing else:\n${JSON.stringify(feedback!.errors, null, 1)}`
    const { patches } = await ask(PatchesSchema, system, user, `patches ${round}`)
    spec = applyPatches(spec, patches)
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
