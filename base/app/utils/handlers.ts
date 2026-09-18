import { declareHandler } from '../contracts/handlers'
import type { SpecContext } from './spec-context'

/**
 * A handler is the one place a spec can trigger side effects (downloads,
 * submits, store writes). `payload` is the event payload, `args` the static
 * `args` from the action.
 */
export type SpecHandler = (payload: unknown, ctx: SpecContext, args?: unknown) => unknown

const handlers = new Map<string, SpecHandler>()

export function registerHandler(name: string, handler: SpecHandler, description = '') {
  handlers.set(name, handler)
  declareHandler(name, description)
}

export function getHandler(name: string) {
  return handlers.get(name)
}
