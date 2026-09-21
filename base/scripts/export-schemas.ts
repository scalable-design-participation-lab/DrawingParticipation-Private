/**
 * Exports every contract as JSON Schema into docs/schemas/. That folder is what
 * an LLM (or any other tool) reads to know which components and collections
 * exist and what they accept.
 *
 *   yarn workspace @mono/base schemas [--contracts <app/contracts.ts>[,<other/contracts.ts>]]
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { z } from 'zod'
import { listCollections } from '../app/contracts/collections'
import { listContracts } from '../app/contracts/components'
import { RootSpecSchema } from '../app/contracts/spec'

const args = process.argv.slice(2)
// `--contracts a.ts,b.ts`: every app's contracts, so one run covers the whole repo.
const contractsIndex = args.indexOf('--contracts')
for (const entry of contractsIndex === -1 ? [] : args[contractsIndex + 1].split(',')) {
  // `yarn workspace … schemas` runs in base/: try the cwd, then the repo root. vite-node wants forward slashes.
  const local = resolve(process.cwd(), entry)
  const file = existsSync(local) ? local : resolve(import.meta.dirname, '../..', entry)
  await import(file.split('\\').join('/'))
}

const out = resolve(import.meta.dirname, '../../docs/schemas')
mkdirSync(resolve(out, 'components'), { recursive: true })
mkdirSync(resolve(out, 'collections'), { recursive: true })

const toSchema = (schema: z.ZodType) => z.toJSONSchema(schema, { unrepresentable: 'any' })

for (const contract of listContracts()) {
  const json = {
    name: contract.name,
    description: contract.description,
    stateful: contract.stateful ?? false,
    emits: contract.emits ?? [],
    slots: contract.slots ?? [],
    props: toSchema(contract.props),
  }
  writeFileSync(resolve(out, 'components', `${contract.name}.json`), `${JSON.stringify(json, null, 2)}\n`)
}

for (const [name, schema] of listCollections()) {
  writeFileSync(resolve(out, 'collections', `${name}.json`), `${JSON.stringify(toSchema(schema), null, 2)}\n`)
}

writeFileSync(resolve(out, 'spec.json'), `${JSON.stringify(toSchema(RootSpecSchema), null, 2)}\n`)

const index = {
  components: listContracts().map(c => c.name),
  collections: listCollections().map(([name]) => name),
}
writeFileSync(resolve(out, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)

// A contract that was deleted leaves a file behind, and a stale schema is worse
// than no schema: prune anything this run did not write.
for (const [folder, kept] of [['components', index.components], ['collections', index.collections]] as const) {
  for (const file of readdirSync(resolve(out, folder))) {
    if (!kept.includes(file.replace(/\.json$/, ''))) {
      rmSync(resolve(out, folder, file))
    }
  }
}
console.log(`wrote ${index.components.length} component + ${index.collections.length} collection schemas to ${out}`)
