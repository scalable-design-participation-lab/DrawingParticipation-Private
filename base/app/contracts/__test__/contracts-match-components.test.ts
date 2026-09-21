import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listContracts } from '../components'

/**
 * A contract is what the verifier, the JSON schema export and the LLM prompt
 * all believe about a component. When it drifts from the component, a spec
 * that passes `verify` still renders wrong, and nothing points at why: a prop
 * the contract declares but the component never reads is silently ignored, and
 * an event the contract names but the component never emits makes an `on`
 * handler that can never run.
 *
 * So the two are compared here rather than by eye.
 */

const here = dirname(fileURLToPath(import.meta.url))
const registrySource = readFileSync(resolve(here, '../../plugins/registry.ts'), 'utf8')

/** local import name -> path under components/, from the registry plugin. */
const importedFrom = new Map<string, string>()
for (const match of registrySource.matchAll(/import (\w+) from '\.\.\/components\/(.+?\.vue)'/g)) {
  importedFrom.set(match[1], match[2])
}

/** contract name -> path under components/ (Nuxt UI primitives have none). */
const fileFor = new Map<string, string>()
for (const match of registrySource.matchAll(/registerComponent\('(\w+)', (\w+)\)/g)) {
  const file = importedFrom.get(match[2])
  if (file) {
    fileFor.set(match[1], file)
  }
}

const modules = import.meta.glob('../../components/**/*.vue', { eager: true }) as Record<
  string,
  { default: { props?: Record<string, unknown> | string[], emits?: string[] | Record<string, unknown> } }
>

function keys(value: Record<string, unknown> | string[] | undefined) {
  return Array.isArray(value) ? value : Object.keys(value ?? {})
}

const cases = listContracts()
  .filter(contract => fileFor.has(contract.name))
  .map(contract => ({ contract, component: modules[`../../components/${fileFor.get(contract.name)}`]?.default }))

describe('every contract matches its component', () => {
  it('registers a component file for each contract under test', () => {
    expect(cases.length).toBeGreaterThan(20)
    expect(cases.filter(c => !c.component).map(c => c.contract.name)).toEqual([])
  })

  it.each(cases.map(c => [c.contract.name, c] as const))('%s declares only props it reads', (_name, { contract, component }) => {
    const declared = Object.keys(contract.props.shape)
    const real = keys(component.props)
    expect(declared.filter(prop => !real.includes(prop))).toEqual([])
  })

  it.each(cases.map(c => [c.contract.name, c] as const))('%s declares only events it emits', (_name, { contract, component }) => {
    const real = keys(component.emits)
    expect((contract.emits ?? []).filter(event => !real.includes(event))).toEqual([])
  })
})
