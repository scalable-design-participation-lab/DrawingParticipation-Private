/**
 * Static verifier CLI.
 *
 *   yarn workspace @mono/base verify <spec.json> [--contracts <app/contracts.ts>] [--data name,name] [--strict]
 *   yarn workspace @mono/base verify --app apps/<app>        # manifest + every spec, strict
 *
 * Prints the VerifyResult as JSON and exits 1 when it does not pass. This is
 * the gate an LLM loop calls after every generated spec.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import '../app/contracts/components'
import '../app/utils/styles'
import { verifySpec } from '../app/verifier'
import { verifyApp } from '../app/verifier/manifest'

const args = process.argv.slice(2)
function flag(name: string) {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
// `yarn workspace … verify` runs in base/, so try the cwd first, then the repo root.
function fromUser(p: string) {
  const local = resolve(process.cwd(), p)
  return existsSync(local) ? local : resolve(import.meta.dirname, '../..', p)
}
// vite-node wants forward slashes even on Windows.
const importable = (p: string) => p.split('\\').join('/')

async function loadContracts(file: string | undefined) {
  if (file && existsSync(file)) {
    await import(importable(file))
  }
}

const appDir = flag('app')
if (appDir) {
  const root = fromUser(appDir)
  await loadContracts(resolve(root, 'app/contracts.ts'))
  const manifest = JSON.parse(readFileSync(resolve(root, 'app/app.json'), 'utf8'))
  const specsDir = resolve(root, 'app/specs')
  const specs = Object.fromEntries(
    readdirSync(specsDir).filter(f => f.endsWith('.json')).map(f => [f, JSON.parse(readFileSync(resolve(specsDir, f), 'utf8'))]),
  )
  const result = verifyApp(manifest, specs)
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.pass ? 0 : 1)
}

const specPath = args.find(a => !a.startsWith('--') && !Object.values({ c: flag('contracts'), d: flag('data') }).includes(a))
if (!specPath) {
  console.error('usage: verify <spec.json> [--contracts <file.ts>] [--data a,b] [--strict] | verify --app <dir>')
  process.exit(2)
}

const contractsFile = flag('contracts')
if (contractsFile) {
  await loadContracts(fromUser(contractsFile))
}

const spec = JSON.parse(readFileSync(fromUser(specPath), 'utf8'))
// --strict: no raw classes (the mode for LLM output).
const result = verifySpec(spec, { extraData: flag('data')?.split(','), strict: args.includes('--strict') })
console.log(JSON.stringify(result, null, 2))
process.exit(result.pass ? 0 : 1)
