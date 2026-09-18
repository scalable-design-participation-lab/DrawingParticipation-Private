/**
 * Handler declarations: the names a spec may `call`. The implementation is
 * registered at runtime (utils/handlers.ts); the declaration alone is enough
 * for the static verifier and the schema export, so an app's contracts module
 * can declare its handlers without importing browser code.
 */
const declared = new Map<string, string>()

export function declareHandler(name: string, description = '') {
  declared.set(name, description)
}

export function isHandlerDeclared(name: string) {
  return declared.has(name)
}

export function listHandlers() {
  return [...declared.entries()].map(([name, description]) => ({ name, description }))
}
