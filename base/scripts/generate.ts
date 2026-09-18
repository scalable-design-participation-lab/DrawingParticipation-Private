/**
 * The generation loop: catalogue → prompt → model → JSON → verify → errors back.
 *
 *   yarn workspace @mono/base gen-spec --app apps/<app> --page <name> --prompt "…" [--provider stub|anthropic] [--rounds 3]
 *
 * Writes `apps/<app>/app/specs/<name>.json` when the spec passes the strict
 * verifier and prints the verify result otherwise. The `stub` provider reads
 * the "model output" from `--stub <file.json>` so the loop can be exercised
 * without an API key; `anthropic` calls the Messages API with
 * ANTHROPIC_API_KEY. Nothing else in the repo knows which provider ran.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { listContracts } from '../app/contracts/components'
import { listStyles } from '../app/utils/styles'
import { listCollections } from '../app/contracts/collections'
import { listHandlers } from '../app/contracts/handlers'
import { verifySpec } from '../app/verifier'
import type { VerifyResult } from '../app/verifier'

const args = process.argv.slice(2)
function flag(name: string) {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
function fromUser(p: string) {
  const local = resolve(process.cwd(), p)
  return existsSync(local) ? local : resolve(import.meta.dirname, '../..', p)
}

const appDir = flag('app')
const page = flag('page')
const prompt = flag('prompt')
if (!appDir || !page || !prompt) {
  console.error('usage: generate --app <dir> --page <name> --prompt "…" [--provider stub|anthropic] [--stub file.json] [--rounds 3]')
  process.exit(2)
}
const root = fromUser(appDir)
const contracts = resolve(root, 'app/contracts.ts')
if (existsSync(contracts)) {
  await import(contracts.split('\\').join('/'))
}

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

const specsDir = resolve(root, 'app/specs')
const examples = readdirSync(specsDir).filter(f => f.endsWith('.json')).slice(0, 2)
  .map(f => `### ${f}\n${readFileSync(resolve(specsDir, f), 'utf8')}`).join('\n\n')

const system = `You write page specs for a Nuxt app. A spec is JSON only: no code, no expressions.
Rules (docs/SPEC-FORMAT.md): a node has only type/props/bind/on/if/style/slot/children/item/text.
Use only the components, handlers and style presets listed. Never use a "class" prop; use component props or "style" presets.
Bind with "$state.x", "$data.x", "$sources.x.loading", "$query.x", "$item.x". Actions: set/toggle/navigate/call.
Reply with the JSON object and nothing else.`

function user(feedback?: VerifyResult) {
  return [
    `## Catalogue\n${JSON.stringify(catalogue, null, 1)}`,
    `## Examples from this app\n${examples}`,
    `## Task\n${prompt}`,
    feedback ? `## Your previous answer failed verification. Fix exactly these and answer again:\n${JSON.stringify(feedback.errors, null, 1)}` : '',
  ].filter(Boolean).join('\n\n')
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
type Provider = (system: string, user: string) => Promise<string>

const providers: Record<string, Provider> = {
  // Exercises the loop without a model: the "answer" is a file on disk.
  stub: async () => readFileSync(fromUser(flag('stub') ?? ''), 'utf8'),
  anthropic: async (system, user) => {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: flag('model') ?? 'claude-sonnet-5', max_tokens: 8000, system, messages: [{ role: 'user', content: user }] }),
    })
    if (!response.ok) {
      throw new Error(`Anthropic API ${response.status}: ${await response.text()}`)
    }
    const body = await response.json() as { content: { type: string, text?: string }[] }
    return body.content.filter(c => c.type === 'text').map(c => c.text).join('')
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
let feedback: VerifyResult | undefined
for (let round = 1; round <= rounds; round++) {
  const raw = await provider(system, user(feedback))
  let spec: unknown
  try {
    spec = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  }
  catch {
    feedback = { pass: false, errors: [{ path: '(root)', rule: 'output.not-json', message: 'reply must be a single JSON object' }] }
    console.error(`round ${round}: not JSON`)
    continue
  }
  const result = verifySpec(spec, { strict: true })
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
