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
// Auth, registered when app.json says `data.backend: "firestore"`.
declareHandler('watchAuth', 'Keep state.auth in step with who is signed in: { uid, email, anonymous, signedIn }. The payload names the state key (default "auth"). Call it from the spec root `init`.')
declareHandler('signIn', 'Sign in with a payload of { email, password }. Failures appear as $errors.signIn.')
declareHandler('signInAnonymous', 'Sign in without an account, so a visitor still has a stable id for their contributions.')
declareHandler('register', 'Create an account from { email, password } and sign in.')
declareHandler('signOut', 'Sign out and clear state.auth.')
declareHandler('resetPassword', 'Email a password-reset link to the address in the payload.')
declareHandler('updateIn', 'Merge `{ id, …patch }` into that row of the collection named in args, then reload data sources.')
declareHandler('deleteFrom', 'Delete the row whose id is the payload from the collection named in args, then reload data sources.')
declareHandler('selectItem', 'Put the row whose `key` equals the payload into state: args { from, into, key? }. `from` is a data source or a state list; `key` may be a dotted path.')
declareHandler('watchViewport', 'Keep state.isMobile in step with the viewport; the payload is the breakpoint in px (default 768). Call it from the spec root `init`.')
declareHandler('watchLocation', 'Ask once where the reader is and put [lon, lat] into the state key named by the payload (default "location"). Bind that state to a List `near` for nearest-first.')
declareHandler('download', 'Save a data source to a file the reader keeps: args { from, format?: "json" | "csv", filename? }.')
