# Generalized components, JSON pages, verifier

Goal: every app is composed from one generalized component library, pages are
JSON that only names components / props / bindings, a verifier decides whether
a page is acceptable, and the backend is reached through declared data sources.
Later an LLM writes the JSON; it never writes Vue.

**Status (2026-09): every page of every app in this repo is a spec.**
`apps/drawing-participation` (1 page), `apps/restart-ukraine` (4 pages),
`apps/open-sensing-chapultepec` (3 pages + 2 placeholders). Each page file is a
single `<SpecRenderer :spec>` line; the JSON lives in `app/specs/`.

**Status (2026-09, round 2): the target user cannot read code or debug.** A
generated app therefore has to fail safe at runtime, be caught by the verifier
for the mistakes a schema cannot see, and own its data without hand-written
backend code. All three are in (see the last rows of the table below); the
deploy pipeline and acceptance scripts are deliberately not yet.

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
| one crashing component or handler took the page down       | per-node `SpecErrorBoundary` (alert box in place of the node); handler errors captured into `$errors.<handler>`; `verifyRender` reports leftover alert boxes                                                                 |
| wiring mistakes the schema cannot see                      | verifier rules `bind.write-only`, `link.unknown-route` (uses the manifest's routes), `state.unused`, unknown `$errors.<x>`                                                                                                   |
| writing data needed app-specific backend code              | `app.json` `data.collections` -> base Nitro CRUD (`/api/collections/<name>`, fs storage) validated server-side with the app's own zod contract; built-in `saveTo` / `deleteFrom` handlers with reload                         |

**Status (2026-09, round 3): a new app from JSON alone works.** `apps/barrio-ideas` (map + draw + save to a
collection declared as `fields` + list + about) was written as specs only, passes `verify --app`, and the
draw → comment → save → list → reopen loop was checked in the browser. What that needed from base: `List`,
collections as `fields`, and the OpenLayers plugin moving into base so an app has no plugins directory.

**Status (2026-09, round 4): three more spec-only apps of different kinds** (`encuesta-movilidad` survey +
results, `agenda-barrio` filter / search / sort board, `diario-fotos` uploads + gallery), each run in the
browser end to end. Gaps they exposed and closed in base: `List` filter / search / sort / limit, `Tally`
(aggregation), `Tabs`, `Text.format` + `Text.labels` (dates and stored codes for people), file uploads
through `saveTo` (multipart -> `.data/uploads` -> `/api/uploads/<file>`), `page-narrow` / `page-wide`,
`FormFields` losing a field when two updates land in one tick, `YYYY-MM-DD` shown a day early.

**Status (2026-09, round 5): multilingual as data.** `app/i18n/<locale>.json` + `$t.key` everywhere in a
spec (including literal props), `$locale`, built-in `setLocale`, verifier rules `i18n.unknown-key` /
`i18n.missing`; `agenda-barrio` is bilingual with a `Tabs` switcher and no code.

**Status (2026-09, round 6): one deliberately complex spec-only app.** `apps/presupuesto-distrito` (participatory
budgeting: map + draw + two-step form with photo and PDF, filterable list with per-row vote counts, live results,
FAQ page, es/en) uses all 28 components the registry offers, on purpose, to find what breaks under load. What it exposed and
closed: data-source `join` (counting votes per proposal), `call` `payload` + the `$payload` root (a button could
not build the row it saves), `refreshItem` (a detail view went stale after its own write), `FeatureLayer.visibleTags`,
`Icon` size / tone (a file named `Icon.vue` shadowed Nuxt's own `<Icon>` and recursed forever), `FileDropZone`
default look, Footer buttons that rendered and did nothing, a Toolbar that emitted an array index instead of the
tool, a `FilterSidebar` contract describing a shape the component never reads, `Tally` number formatting, and
three layout presets. The four smaller demo apps of rounds 3-5 were deleted once this one covered every
component they did; base keeps everything they taught it, and `docs/SPEC-FORMAT.md` keeps the patterns.

**Status (2026-09, round 7): chrome stops being the spec's to paint.** Looking at a header whose links were
`text-gray-400` floating unreadably over a map, the user asked for the rule directly: base decides almost
everything, and a spec changes only what is tied to the theme. So `Header`'s contract lost `z`, `shape`,
`primaryAccentColor`, `logoSrc` / `logoAlt` / `logoLink` / `iconLink` and per-item `color` / `variant` (nine
uses across the specs, several of them dead -- the text variant ignored `color`, and the same bar was given
three different `z` values). What belongs to the whole app moved to `app.json` as `brand` and `theme.accent`,
read straight from the manifest by the component, so it is written once instead of once per page. The text
variant now puts its links in the same floating pill as everything else, which is what made them readable.
Two real bugs fell out: a full-screen date-picker backdrop sat *under* the header at `z-30`, and a right-hand
item rendered twice in the text variant. `GeneralizedHeader.test.ts` went green for the first time in months:
it could not even load (it imported a component deleted with the dashboard), and behind that were two
assertions counting a rendering the component stopped doing in August.

The same pass closed every other way a spec could paint its own pixels: no contract is `looseProps` any more
(`Button` / `Card` / `Divider` forwarded anything to the Nuxt UI primitive, `ui` included, which can restyle
any part of it), `Button`'s `color` / `variant` / `size` are the Nuxt UI token sets instead of free strings,
a `FormFields` field takes a `style` preset instead of a raw `class` (the last raw-class hole in strict mode),
and spacing around a `Divider` is a preset -- which is how one app already did it while another reached for
`ui: { wrapper: … }`. A verifier test pins all of it.

**Status (2026-09-21, round 8): app code moves into base, on a stated goal — "everything in base, all of it
generalized, the same way of doing things everywhere".** Two apps now hold nothing but `app.json` and specs
(presupuesto-distrito, drawing-participation); the other three are down to what is genuinely theirs.

What base gained, each one shaped like something already there:

| New | Replaces |
| --- | --- |
| `LoadingScreen`, `IconBar`, `Dropdown` | a splash both map apps had twice, mnc's desktop toolbar + mobile nav, its language menu |
| `Header` centre slot, `showLogo` | mnc's separate phone header |
| `List` `near` / `groupBy` / `filterIn` / dotted keys | its proximity list, category sidebar, solutions grid |
| `Icon` `icons` / `colors` maps | per-row category glyphs, the way FeatureLayer already took marker icons |
| `Text` `fallback` / `prefix` / `suffix` / `decimals` | localized titles with an original to fall back on, "1.4 km" |
| `Modal` `scroll` and wider sizes | mnc's AppModal |
| `app.json` `styles` and `brand` | four `utils/styles.ts`, three `app.config.ts`, three `layouts/default.vue` |
| handlers `selectItem`, `watchViewport`, `watchLocation`, `download` | four app handlers, one of which never worked |
| `$locale` as a path segment | reading a row that stores its text per language |

`$locale` and `setLocale` follow vue-i18n when an app installed it, so a spec binds one language whichever
catalogue the app uses. Dead things found on the way: a `download` handler writing an empty object, an events
list no component emitted, a category panel nothing opens.

**Continued (same round).** base has 32 components; mnc is down to 7 from 24. Added since: `Carousel` (a
strip of images that drops a URL which fails to load, so the counter never promises a missing slide),
`VoiceRecorder` (records a note and hands it over as a `File`, the way the drop zones hand over a pick), and
`FileDropZone` grew the other half it was missing — bind `modelValue` and it keeps the list, shows each file
with its size, removes one, and refuses anything over `maxSizeMb` or outside `accept`, with the refusal
wording as props.

**The backend is in place but unproven.** `app.json` takes `data.backend: "firestore"`, which routes the same
`{ kind: "collection" }` source and the same `saveTo` / `updateIn` / `deleteFrom` handlers at the app's own
Firebase project; auth is handlers (`watchAuth`, `signIn`, `signInAnonymous`, `register`, `signOut`,
`resetPassword`) registered only for such an app; and a `where` value may name page state
(`["uid", "==", "$state.auth.uid"]`), the source re-reading itself when that changes. No app has switched to
it: there are no Firebase credentials on this machine, and rewriting a live registration flow that cannot be
tried is how you break one silently.

Left in the apps, and why: chapultepec's four SVG glyph components (its own visual language, and a fifth app
would not want them), restart-ukraine's analysis panel over base's GeoSpatialLayer, and both apps' Firebase
layers. The last is the real remaining block — making it data means a declarative backend in `app.json`, which
is the next piece of work.

## Next

1. ~~Delete the dashboard leftovers~~ done.
2. `apps/open-sensing-frontend` is a gitlink (nested repo pointer, no `.gitmodules`, no content here); vendor or
   submodule it before it can be spec'd.
3. ~~`DrawingLayer` / `SideBar` / `RuMap`~~ done for restart-ukraine: `FeatureLayer` + `StepCard` + `Accordion`,
   stores replaced by page state and handlers. `DrawingLayer` and `base/app/stores/*` remain for mnc only.
4. ~~Promote restart-ukraine's modal family~~ done: one `Modal`, six dialogs are JSON.
4b. ~~mnc~~ done: 3 specs, 30 handlers, 16 props-only components, 8 stores and 5 pages deleted; `$t.<key>`,
   `==` / `!=` / `&&` conditions and `toggleItem` were the spec-language additions it needed. Left:
   restart-ukraine's `AnalysisPanel` / `AnalysisLayers` still read the app-local `layers` store.
5. ~~Backend: expose the same collection contracts server-side~~ done (`data.collections`, fs storage; swap the
   Nitro storage driver for a database when a deployment needs one).
6. Run `gen-spec --provider anthropic` on a real request and tune the prompt / catalogue from what the verifier rejects.
   In: the real model layer (`base/scripts/llm.ts`, Anthropic SDK + structured outputs), outline-then-fill with
   the catalogue trimmed to the outline's components, one verified example per component, retrieval of the two
   closest specs, patch-only later rounds, and `visual-check` (screenshot + vision model) as verifier level 4.
   Not yet run against a real request in this repo: needs `ANTHROPIC_API_KEY`.
7. Coverage: `DataList` / `DataTable`, `Chart`, `AuthGate` — add each with a contract when a real request needs it.
8. Deploy pipeline (verify --app -> build -> host, one command) and JSON acceptance scripts (a generated app ships
   with "open page X, fill Y, expect Z" checks the pipeline runs) — deferred on purpose until 1-7 are exercised.
