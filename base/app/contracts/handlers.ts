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
declareHandler('saveTo', 'Save the payload as a new row of the collection named in args (app.json data.collections), then reload data sources. File values (e.g. PhotoDropZone `files`) are uploaded and stored as /api/uploads URLs. Errors appear as $errors.saveTo.')
declareHandler('updateItem', 'Merge the payload into the item with the same id inside the state list named in args, e.g. { "call": "updateItem", "args": "features" } with a FormFields submit payload.')
declareHandler('setLocale', 'Switch the UI language; payload is a locale code that has an app/i18n/<locale>.json (bind a Tabs to "$locale").')
declareHandler('toggleItem', 'Add the payload to the state list named in args, or remove it when already there (e.g. a tag filter).')
declareHandler('refreshItem', 'Re-read the row a detail view holds from a data source after a write: args { from: "<data source>", into: "<state key>", key? }.')
declareHandler('removeItem', 'Remove the item whose id is the payload from the state list named in args.')
declareHandler('deleteFrom', 'Delete the row whose id is the payload from the collection named in args, then reload data sources.')
