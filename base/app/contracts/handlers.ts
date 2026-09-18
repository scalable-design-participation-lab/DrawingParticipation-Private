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

// Built-in handlers every manifest app gets (implemented in plugins/manifest.ts).
declareHandler('saveTo', 'Save the payload as a new row of the collection named in args (app.json data.collections), then reload data sources. Errors appear as $errors.saveTo.')
declareHandler('deleteFrom', 'Delete the row whose id is the payload from the collection named in args, then reload data sources.')
