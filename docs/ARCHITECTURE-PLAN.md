# Generalized components, JSON pages, verifier

Goal: every app is composed from one generalized component library, pages are
JSON that only names components / props / bindings, a verifier decides whether
a page is acceptable, and the backend is reached through declared data sources.
Later an LLM writes the JSON; it never writes Vue.

**Status (2026-09): every page of every app in this repo is a spec.**
`apps/drawing-participation` (1 page), `apps/restart-ukraine` (4 pages),
`apps/open-sensing-chapultepec` (3 pages + 2 placeholders). Each page file is a
single `<SpecRenderer :spec>` line; the JSON lives in `app/specs/`.

## Layers (each depends only on the one below)

| Layer     | Where                                                                                                                    | What                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| contracts | `base/app/contracts/`                                                                                                    | zod schemas: component props/emits/slots, collections, handler declarations, the page spec                                                                                                 |
| ui        | `base/app/components/`                                                                                                   | generalized components: props in, emits out, no hidden stores/config                                                                                                                       |
| renderer  | `SpecRenderer.vue`, `SpecNode.vue`, `utils/registry.ts`, `utils/handlers.ts`, `utils/styles.ts`, `utils/spec-context.ts` | JSON → component tree; `$state` / `$data` / `$sources` / `$query` / `$item` binds; `if`; `style` presets; `set` / `toggle` / `navigate` / `call` actions; `$action` callbacks inside props |
| verifier  | `base/app/verifier/`, `base/scripts/verify.ts`                                                                           | static (schema + registry + bindings + handlers), render (headless mount), contract (rows)                                                                                                 |
| data      | `base/app/data/`                                                                                                         | `DataAdapter` per source kind; contract check on every response                                                                                                                            |

Apps keep: `app.json` (manifest: title, theme, routes, shell, data adapter),
`specs/*.json`, `contracts.ts` (their own components + handler declarations),
a registry plugin, style presets, and truly project-specific components
(glyphs, the Гуртомá sidebar, the analysis panel). No `app.vue`, no `pages/`.

## What "painless" required

Turning the existing pages into JSON exposed exactly what the library was
missing. Everything below was added rather than worked around:

| Missing                                                    | Added                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| conditional render                                         | node `if`                                                                                                                                                                                                                  |
| side effects from JSON                                     | `call` action + `registerHandler` / `declareHandler`                                                                                                                                                                       |
| callbacks inside data (header items, tools)                | `{ "$action": … }` prop values                                                                                                                                                                                             |
| boolean flips, action lists                                | `toggle` action; `on` accepts arrays                                                                                                                                                                                       |
| route-driven initial state                                 | `state: { x: "$query.x" }` (+ "true"/"false" coercion)                                                                                                                                                                     |
| header extras that are not items                           | `Header` `#right` slot; `MapTypeToggle` component                                                                                                                                                                          |
| app-local modal hidden inside base                         | `Footer` `support` event + slot (was `SupportModal`)                                                                                                                                                                       |
| forms                                                      | `FormFields` (box / underline, stacked / inline, row / column)                                                                                                                                                             |
| photo upload with preview                                  | `PhotoDropZone` (on top of `FileDropZone`)                                                                                                                                                                                 |
| content pages                                              | native tags + `text`; `Button` / `Divider` / `Card` / `Icon` from Nuxt UI                                                                                                                                                  |
| map overlays needing the OL instance                       | `BackgroundMap` provides `olMap`; `ToolTips` injects it                                                                                                                                                                    |
| 350-line dashboard page                                    | `useAnalysis` composable + `AnalysisPanel` + `AnalysisLayers` (restart-ukraine)                                                                                                                                            |
| DrawingLayer icons via the app's `@/assets`                | icons ship with base                                                                                                                                                                                                       |
| raw Tailwind strings in specs (unverifiable, inconsistent) | layout primitives `Stack` / `Grid` / `Panel` / `Text` / `Image` with enumerated props; style presets (`registerStyle`, node `style`); verifier strict mode (`style.raw-class`, `style.unknown`) — every spec passes strict |
| list-item actions, loading/error UI, validation feedback   | `"value": "$item.id"` / `"args": "$…"` expressions; `$sources.<name>.loading                                                                                                                                               | error`; `FormFields.errors` |

## Next

1. ~~Delete the dashboard leftovers~~ done.
2. `apps/open-sensing-frontend` is a gitlink (nested repo pointer, no `.gitmodules`, no content here); vendor or
   submodule it before it can be spec'd.
3. `DrawingLayer` / `SideBar` / `RuMap`: accept `features` as a prop with the store as fallback, then flip `stateful`.
4. Promote restart-ukraine's modal family to three generic shapes (intro / form / confirm); `MenuModal` and
   `SupportModal` are the obvious first two.
5. Backend: expose the same collection contracts server-side (Nitro `server/api/<collection>` validated
   with the same zod schemas) so a `rest` data source and a `collection` data source are interchangeable.
6. Run `gen-spec --provider anthropic` on a real request and tune the prompt / catalogue from what the verifier rejects.
7. Coverage: `DataList` / `DataTable`, `Chart`, form submit to a collection, `AuthGate` — add each with a contract when a real request needs it.
