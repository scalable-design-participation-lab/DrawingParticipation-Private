import type { Component } from 'vue'
import { getContract, registerContract } from '../contracts/components'
import type { ComponentContract } from '../contracts/types'

/**
 * Runtime registry: contract name -> Vue component. The renderer only ever
 * instantiates components that are registered here, and the verifier only
 * accepts spec nodes whose `type` is registered (or a native tag).
 */
const components = new Map<string, Component>()

export function registerComponent(name: string, component: Component, contract?: ComponentContract) {
  components.set(name, component)
  if (contract) {
    registerContract(contract)
  }
  else if (!getContract(name)) {
    console.warn(`[registry] "${name}" registered without a contract; the verifier can only check that it exists.`)
  }
}

export function getComponent(name: string) {
  return components.get(name)
}

export function listComponents() {
  return [...components.keys()]
}
