# Page specs: JSON instead of Vue pages

A page spec is the JSON an app (or, later, an LLM) writes instead of a `.vue`
page. It is rendered by `<SpecRenderer :spec>` (base) and checked by the
verifier before it ships. Schemas for everything below are exported to
[`docs/schemas/`](./schemas/) by `yarn workspace @mono/base schemas`.

Every page of every app in this repo is a spec (`apps/*/app/specs/*.json`) and
passes the verifier in **strict mode**: no raw class strings anywhere.

## Shape

```jsonc
{
  "version": 1,
  "state": { "welcome": true, "showIntro": "$query.showIntro" }, // page state; "$query.x" is read from the route on load
  "init": [{ "call": "checkUser" }, { "set": "onboarding", "value": "!$state.returning" }], // actions run once on mount
  "dataSources": { // rows, read by $data.*; status by $sources.*
    "readings": { "kind": "static", "contract": "reading", "items": [] }
  },
  "children": [ // component tree
    {
      "type": "BackgroundMap", // registry name (or a native tag like "div")
      "props": { "centerLonLat": [-99.19, 19.42], "zoom": 14 },
      "bind": { "mapType": "$state.mapType" },
      "children": [
        {
          "slot": "overlays", // which slot of the parent this node goes into
          "type": "MarkerOverlay",
          "bind": { "items": "$data.readings" },
          "item": { // once per item
            "type": "WeatherGlyph",
            "bind": { "reading": "$item.reading" },
            "on": { "click": { "set": "selected", "value": "$item.id" } }
          }
        }
      ]
    },
    { "type": "Text", "if": "$sources.readings.loading", "props": { "text": "Cargando…", "tone": "muted" } },
    {
      "type": "Header",
      "props": {
        "z": 20,
        "rightItems": [
          {
            "icon": "i-heroicons-arrow-down-tray-20-solid",
            "onClick": { "$action": { "set": "showDownload", "value": true } }
          } // callback inside data
        ]
      },
      "on": { "menu": { "set": "menuOpen", "value": true } },
      "children": [
        {
          "slot": "right",
          "type": "MapTypeToggle",
          "bind": { "modelValue": "$state.mapType" },
          "on": { "update:modelValue": { "set": "mapType" } }
        }
      ]
    },
    {
      "type": "div",
      "if": "$state.needsRegistration",
      "style": "overlay",
      "on": { "click": { "set": "registration", "value": true } }
    },
    {
      "type": "Modal",
      "bind": { "modelValue": "$state.welcome" },
      "on": { "update:modelValue": { "set": "welcome" } },
      "props": { "text": "Bienvenido…" }
    }
  ]
}
```

A node has exactly these keys: `type`, `props`, `bind`, `on`, `if`, `style`,
`slot`, `children`, `item`, `text`. Nothing else, and no expressions:

| Key     | Meaning                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props` | Literal props, validated against the component contract. A `{ "$action": … }` value becomes a callback (for `onClick` on header items, toolbar tools, …).  |
| `bind`  | `prop -> "$data.<source>"`, `"$sources.<source>.loading"` / `".error"`, `"$state.<path>"`, `"$query.<param>"` or `"$item[.path]"` (inside an `item` only). |
| `on`    | `event -> action` or `event -> [action, …]` run in order.                                                                                                  |
| `if`    | Render while the condition holds: an expression, `!expr`, `expr == 'x'` / `expr != 0`, joined with `&&` (`"$state.isMobile && $state.view == 'list'"`).   |
| `style` | One or more registered style preset names (see Styling).                                                                                                   |
| `slot`  | Named slot of the parent to render into (default slot when omitted).                                                                                       |
| `item`  | Template for list components that expose an `item` slot (`MarkerOverlay`).                                                                                 |
| `text`  | Text content for native tags; may itself be a `$…` binding.                                                                                                |

Actions:

| Action                           | Effect                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ "set": "path", "value"?: … }` | Write state. `value` may be an expression (`"$item.id"`); omit it to store the event payload.                                                                          |
| `{ "toggle": "path" }`           | Flip a boolean state.                                                                                                                                                  |
| `{ "navigate": "/route" }`       | Router push.                                                                                                                                                           |
| `{ "call": "name", "args"?: … }` | Run a handler the app registered (`registerHandler`). `args` may be an expression. This is the only way a spec triggers a side effect (download, submit, store write). |

Logic (conditions beyond `if`, loops, computed values, side effects) lives inside
components and handlers, never in the JSON. That boundary is what keeps specs
small, checkable and cheap to generate.

## Styling: three layers, the spec only touches the middle one

1. **Theme tokens** (app level): colors, font, radius in `app.config.ts` / CSS
   variables. A spec never sees them.
2. **Component variants** (the spec's multiple-choice): every visual decision is
   an enumerated prop the contract validates, e.g. `Header.variant`,
   `FormFields.variant`, `Panel.variant`, `Text.size`. The layout primitives
   exist for exactly this:

   | Component                              | Props                                                                                 |
   | -------------------------------------- | ------------------------------------------------------------------------------------- |
   | `Stack`                                | `direction` row/column, `gap` none…xl, `align`, `justify`, `wrap`, `responsive`, `as` |
   | `Grid`                                 | `cols` 1–6, `colsMd`, `gap`, `as`                                                     |
   | `Panel`                                | `variant` plain/card/outline/paper, `padding`, `measure` prose/wide, `as`             |
   | `Text`                                 | `as` h1…label, `size`, `weight`, `tone`, `align`, `text`                              |
   | `Image`                                | `src`, `alt`, `width` full/half/third/two-thirds, `rounded`, `href`                   |
   | `Button` / `Divider` / `Card` / `Icon` | Nuxt UI primitives                                                                    |

3. **Style presets** (the escape hatch, still a list): `registerStyle(name, classes)`
   in `base/app/utils/styles.ts` (base) or `apps/<app>/app/utils/styles.ts`.
   A node says `"style": "overlay"` or `["fill", "overlay"]`; the verifier
   checks the name (`style.unknown`). Presets hold the few things primitives
   cannot express (a custom grid, a page gutter, an absolute overlay).

In **strict mode** (`verifySpec(spec, { strict: true })`, CLI `--strict`) a raw
`class` prop anywhere is an error (`style.raw-class`). Every spec in this repo
passes strict mode; run LLM output in strict mode.

A `call` action can build what the handler receives instead of passing the
event through: `payload` is resolved at any depth, so a button can save a row
made of page state.

```jsonc
{ "call": "saveTo", "args": "votos",
  "payload": { "propuestaId": "$state.abierta.id", "valor": 1 } }
```

`"$payload"` (or `"$payload.<field>"`) is the event's own value, for the common
case of keeping one field of what a component emitted:
`{ "set": "visibles", "value": "$payload.value" }`. It only exists inside an
action's `value` / `args` / `payload`; anywhere else the verifier rejects it.

Action `value` / `args` / `payload` accept the same expressions, including the
`!` form (`{ "set": "needsRegistration", "value": "!$state.returning" }`), and
resolve inside nested objects and arrays. `init` at
the root runs an action list once when the page mounts: the place to sign in,
load results into state, or derive initial flags from what a handler found.

Translations are data too. Put `app/i18n/<locale>.json` files next to the
specs (nested objects), name the default in `app.json` (`"i18n": { "default": "es" }`),
and write `"$t.nav.home"` anywhere a string goes: `text`, a bound prop, or a
literal prop deep inside `fields`, `steps`, `leftItems`, `labels`. `"$locale"`
is the current locale and the built-in `setLocale` handler switches it (a
`Tabs` bound to `$locale` is a language switcher); the choice is remembered.
The verifier reads the same files: `i18n.unknown-key` when the default locale
lacks a key, `i18n.missing` when another locale does. Apps that ship
`@nuxtjs/i18n` (mnc) keep vue-i18n's `$t` behind the same syntax. `"$errors"`
alone binds the whole handler -> message map, for a component that reports
several outcomes (`AdminAccounts`).

## Interaction

Everything an LLM can wire: show/hide (`if`), two-way values (`bind` +
`update:*` → `set`), modals (`toggle` / `set`), navigation, list-item actions
(`"value": "$item.id"`), loading/error states (`$sources.x.loading` /
`$sources.x.error`), form validation feedback (`FormFields.errors`, a
`field -> message` map a handler can `set`), list edits on page state
(`updateItem` / `removeItem` / `toggleItem` with the state key as `args`: `{ "call": "updateItem", "args": "features" }`
merges a `{ id, …patch }` payload into the matching item; `toggleItem` adds or removes the payload, e.g. a tag filter),
re-reading an open detail view after a write (`{ "call": "refreshItem", "args": { "from": "propuestas", "into": "abierta" } }`),
side effects (`call`), failed
side effects (`$errors.<handler>`: the message of the last error a handler
threw, cleared when it next succeeds), writing rows (`call: "saveTo"` /
`"deleteFrom"` with the collection name as `args`, see the manifest below).
Animations, drag, map gestures stay inside components (an enumerated prop at most).

## Runtime safety

A generated page must degrade, never disappear:

- Every component node is wrapped in an error boundary (`SpecErrorBoundary`).
  A component that throws while rendering is replaced by a small
  `role="alert"` box naming the node type; the rest of the page keeps working.
- A handler that throws (or rejects) does not break the page: the message
  lands in `$errors.<handler>` so the spec can show it
  (`{ "type": "Text", "if": "$errors.saveTo", "bind": { "text": "$errors.saveTo" } }`).
- Data sources whose rows break their contract are rejected wholesale
  (`$sources.<name>.error`), so a component never sees a malformed row.
- `verifyRender` reports any alert box left after mounting as `render.error`,
  so a spec that only fails at render time still fails in CI.

## Data sources

| kind         | fields                     | served by                                   |
| ------------ | -------------------------- | ------------------------------------------- |
| `static`     | `items`                    | `staticAdapter` (fixtures, mocks, tests)    |
| `rest`       | `url`                      | `restAdapter` (array, `{items}` or GeoJSON) |
| `collection` | `name`, `where?`, `limit?` | base's collections API when `name` is declared in `app.json` `data.collections`; otherwise `data.restBase/<name>` |

Every kind accepts `join`: aggregates of another source folded into these rows,
so an item template can read them without looping twice.

```jsonc
"propuestas": { "kind": "collection", "name": "propuestas",
  "join": [{ "from": "votos", "on": "propuestaId", "count": "votos" }] }
// every proposal row now has `votos`; `$item.votos` works, and List can sortBy it
```

`{ from, on, key?, count?, sum?, as? }`: rows of `from` whose `on` equals this
row's `key` (default `id`) are counted into `count`, or their `sum` field is
added up into `as`. Joins re-run whenever either side reloads.

Every kind accepts `contract`: the name of a collection contract the rows must
satisfy. Rows that fail are rejected wholesale (`$sources.<name>.error` holds
the `VerifyResult`) so bad data never reaches a component.

The adapter is provided by base's manifest plugin (`base/app/plugins/manifest.ts`).
An app that needs another backend (Firestore, ...) provides its own
`DATA_ADAPTER` in a plugin:

```ts
nuxtApp.vueApp.provide(DATA_ADAPTER, composeAdapters({
  static: staticAdapter,
  rest: restAdapter,
  collection: createFirestoreAdapter(useFirestore()),
}))
```

Lists: JSON cannot loop, so `List` does it: `{ "type": "List", "bind": { "items": "$data.ideas" }, "props": { "layout": "grid", "cols": 3 }, "item": { … "$item.comment" … } }`.
`List` also filters (`filterKey` + `filterValue` bound to state, e.g. a `Tabs`
value), searches (`search` bound to a form field, `searchKeys`), sorts
(`sortBy`, `sortDesc`) and limits. Results: `Tally` groups rows by a field and
draws a bar per group (`mode` count / sum / avg of `valueKey`). `Text`
renders stored codes and dates for people: `labels` (value -> label) and
`format` (date / datetime / number).

Files: a `saveTo` payload that holds `File` objects (the `files` of a
`PhotoDropZone`, put into a draft with `{ "set": "draft.fotos" }`) is sent as
multipart; base stores the files under `.data/uploads` and writes their
`/api/uploads/<file>` URLs into the row, so the gallery is just
`{ "type": "Image", "bind": { "src": "$item.fotos.0" } }`.

## An app from JSON only

`apps/presupuesto-distrito` is specs only: no components, handlers, stores or
presets of its own (`package.json` / `nuxt.config.ts` / `tsconfig.json` /
`eslint.config.mjs` are fixed boilerplate). It is participatory budgeting for a
district, written to use every component the registry offers - 28 of 28 - so
that a gap in the library shows up as a broken screen instead of going
unnoticed. What each of its pages stresses:

| Page          | Kind                        | What it exercises                                                                                               |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `mapa`        | participation map           | `FeatureLayer` draw + `visibleTags` legend, `StepCard` wizard, `PhotoDropZone` + `FileDropZone` -> multipart `saveTo` |
| `lista`       | data board                  | `Tabs` -> `List.filterValue`, search -> `List.search`, `sortBy` a joined count, detail `Modal` + `refreshItem`     |
| `resultados`  | aggregation                 | `Tally` count / sum / joined count, `Grid` ranking, `Text.format`                                                 |
| `acerca`      | text                        | `Accordion`, `Footer` buttons opening a help `Modal`                                                             |

Four earlier demo apps (a survey, a board, a gallery, a map) were written the
same way in rounds 3-5 and deleted once this one covered the same ground. What
they could not express is still here, because each gap became a base addition:
`List` filters, `Tally`, `Tabs`, `Text` `format` / `labels`, uploads through
`saveTo`, `page-narrow` / `page-wide` presets, `FormFields` tolerant of rapid
updates, and the whole i18n layer.

## Building blocks that replaced hand-written components

restart-ukraine's participation flow is a good reference for what is JSON now:

| Was                                                      | Is                                                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| six modal components                                     | one `Modal` (title, `text` or children, `buttonLabel`, `footer` slot, `align`, `size`, `closable`) + JSON                                                                  |
| `SideBar` (430 lines, three pinia stores)                | `Accordion` (slots `item-0…5`) + one `StepCard` per theme: `steps[]` with `buttons` / `iconGrid` whose `value` is the draw mode; `step` lives in page state               |
| `DrawingLayer` + `IconLayer` / `PolygonLayer` / `LineStringLayer` reading four stores | `FeatureLayer`: `features` in, `update:features` out, `draw` in (`update:draw` when done), `icons` / `labels` as data, `open` / `inspect` payloads carry `position` + `title` |
| `CommentModal` / `CommentDisplay` overlays               | `MarkerOverlay` with `item` bound to `$state.selected` / `$state.inspected` and an `item` template (`FormFields` + `updateItem`, or `Text` bound to `$item.*`)               |
| `RegistrationModal` (305 lines, Firebase inside)         | `Modal` + `FormFields` (`errors` bound to `$state.formErrors`) + handlers `checkUser` / `register`; the `user` collection contract validates the form                       |
| `db` store, `all-features` store                         | handlers `saveProject` (args `"$state.features"`) and `loadResults` (into `state.features`, run from `init`)                                                                |

mnc followed with the same recipe (`apps/mnc/app/specs/{index,about,admin}.json`):
its eight pinia stores became page state + 30 handlers in `app/handlers.ts`
(Firebase auth, live user entries, contributions, moderation, account
management), the components that read stores now take `features` /
`visibleTags` / `selected` as props and derive the rest through
`composables/catalog.ts`, and the desktop / mobile split is `if` conditions
on `$state.isMobile`. `base/app/stores/*` and `DrawingLayer` are gone: no app
reads a store any more.

## Registering components, handlers and styles

Base registers its generalized components in `base/app/plugins/registry.ts`.
An app registers its own, plus its handlers and style presets, in a plugin:

```ts
registerComponent('WeatherGlyph', WeatherGlyph, weatherGlyphContract)
registerHandler('downloadData', (payload, ctx, args) => { /* … */ }, 'description')
registerStyle('legend-layout', 'grid h-full grid-cols-[3fr_4fr] gap-10', 'Legend | canvas page')
```

A contract (`base/app/contracts/types.ts`) is a strict zod object for the props
plus `emits`, `slots`, `looseProps` and a `stateful` flag. Keep app contracts,
`declareHandler(name)` calls and `utils/styles.ts` in plain modules (no Nuxt
auto-imports) so the CLI can load them; keep style presets under `utils/` so
Tailwind scans the class strings.

## Verifier

Three levels, cheapest first. All of them return the same shape:

```json
{ "pass": false, "errors": [{ "path": "children[0].bind.items", "rule": "bind.unknown-data", "message": "…" }] }
```

1. **Static** (`verifySpec`, milliseconds, run on every generated spec):
   ```bash
   yarn workspace @mono/base verify apps/<app>/app/specs/<page>.json --contracts apps/<app>/app/contracts.ts --strict
   ```
   Rules: `spec.schema`, `state.bad-init`, `component.unknown`, `props.invalid`,
   `bind.unknown-prop`, `bind.bad-expr`, `bind.unknown-data`, `bind.unknown-state`,
   `bind.item-outside-template`, `slot.unknown`, `event.unknown`, `action.invalid`,
   `action.unknown-state`, `action.unknown-handler` (also for `$errors.<x>`),
   `style.unknown`, `style.raw-class` (strict).
   Wiring rules, the mistakes a schema cannot see: `bind.write-only` (a
   `modelValue` binding with no `update:modelValue` -> `set` back into the
   same state, i.e. an input that never saves), `link.unknown-route`
   (`navigate`, `to`, `href` pointing at a path the manifest does not route;
   needs `routes`, which `verify --app` passes), `state.unused` (state that
   nothing reads or writes).
2. **Render** (`verifyRender`, seconds, in vitest): mounts the spec headlessly and
   collects every Vue warning/error (`render.warn`, `render.error`) plus any
   error-boundary alert box left in the DOM.
3. **Contract** (`verifyRows`, on every adapter response): rows vs. the collection
   schema (`row.invalid`, `rows.not-array`). Runs automatically in `useDataSources`.
4. **Visual** (`visual-check`, seconds, needs a model): screenshots the page
   with the locally installed Chrome (`playwright-core`, `--url`, or `--image`
   for a screenshot taken elsewhere) and asks a vision model for defects a
   non-technical user would notice: `visual.overlap`, `visual.cut-off`,
   `visual.blank`, `visual.placeholder`, `visual.contrast`, `visual.error-box`.
   ```bash
   yarn workspace @mono/base visual-check --url http://localhost:3015/datos --viewport 390x844 --provider anthropic
   ```
   Same result shape and exit code as the other levels.

Each app has a vitest file under `app/specs/__test__/` that runs the strict
static verifier over all of its specs.

## App manifest: the whole app as data

`apps/<app>/app/app.json` replaces `app.vue`, `pages/*.vue` and most of
`app.config.ts`:

```jsonc
{
  "name": "open-sensing-chapultepec",
  "title": "Bitácora de observación medioambiental",
  "lang": "es",
  "theme": { "primary": "red", "gray": "neutral", "colorMode": "light" },
  "shell": "shell.json", // rendered around every page; contains one { "type": "Outlet" }
  "routes": { "/": "map.json", "/datos": "datos.json" },
  "data": { "collections": { "observaciones": { "contract": "observacion" } } } // and/or "restBase"
}
```

- Routes become real Nuxt routes at build time (`pages:extend` in
  `base/nuxt.config.ts`); they replace any hand-written page with the same
  path and drop base's template pages. `SpecPage` renders the page, `Outlet`
  marks where it goes inside the shell.
- Title / description / lang come from the manifest (base `app.vue`); theme
  colors and color mode are applied at runtime.
- `data.collections` declares the collections the app owns. Base serves each
  one at `/api/collections/<name>` (`GET` list, `POST` row, `DELETE :id`;
  rows are files under `.data/collections`, gitignored) and validates every
  write against the named contract with the same zod schema and the same
  `verifyRows` the client uses; an invalid row is a `400` whose body is the
  `VerifyResult`. The app's `app/contracts.ts` is loaded on the server by
  `base/server/plugins/app-contracts.ts` (via a virtual module generated in
  `base/nuxt.config.ts`), so a contract is registered once and enforced on
  both sides. Specs write with the built-in handlers `saveTo` / `deleteFrom`
  (`{ "call": "saveTo", "args": "observaciones" }` with the row as payload,
  e.g. `FormFields` `submit`); both reload the page's data sources afterwards
  and report failures through `$errors.saveTo` / `$errors.deleteFrom`.
  A collection can also be declared without any code, as data:
  `"ideas": { "fields": [{ "name": "comment", "type": "string" }, { "name": "coordinates", "type": "json", "required": true }] }`
  (types `string | number | boolean | json`; declared fields are validated,
  other keys pass through). Collections not owned by the app are read from
  `data.restBase/<name>`.
- `yarn workspace @mono/base verify --app apps/<app>` checks the manifest,
  every routed spec (strict, with the manifest's routes for `link.unknown-route`)
  and the shell (`manifest.schema`, `manifest.missing-spec`, `manifest.shell-outlet`,
  `manifest.unknown-contract`, `manifest.unknown-collection`), all in one
  result. Each app has `specs/__test__/app.test.ts` doing the same in vitest.

An app is therefore `app.json` + `specs/*.json` + `contracts.ts` /
`plugins/registry.ts` / `utils/styles.ts` (its own components, handlers and
presets) + `nuxt.config.ts`. All three apps in this repo run this way; mnc
still has hand-written pages and is untouched by the manifest machinery.

## The generation loop

```bash
yarn workspace @mono/base gen-spec --app apps/<app> --page <name> --prompt "…" [--provider stub|anthropic] [--rounds 3] [--model …] [--effort …]
```

`gen-spec` makes three kinds of model calls, all through `base/scripts/llm.ts`
(the only file that talks to a model; the Anthropic SDK with structured
outputs, so every answer is parsed against a zod schema or the call fails):

1. **Outline.** The model sees every component's name and description
   (small) and returns the page's sections, the components each one uses and
   the state keys it needs. Unknown names are dropped. This is also how the
   catalogue gets trimmed: the next call only sees the chosen components
   plus the layout primitives (`Stack` / `Grid` / `Panel` / `Text` / `Image` / `Button`).
2. **Spec.** The trimmed catalogue (props, emits, slots, one verified
   `example` per component mined from the specs in this repo), collections,
   handlers, style presets, the app's routes, the two existing specs closest
   to the request (word overlap) and the outline. The answer is shaped by
   the page-spec schema itself.
3. **Patches** (round 2 on). The strict verifier runs with the app's routes;
   on failure the model returns one `{ path, value | remove }` per error and
   `applyPatches` changes only those paths, so a fix cannot regress the rest
   of the page.

On pass it writes `specs/<name>.json`. `--provider stub --stub outline.json,spec.json[,patches.json,…]`
replays answers from disk in call order, so the loop is testable without a
key; `anthropic` reads `ANTHROPIC_API_KEY` from the environment or from
`.env` at the repo root (`--model` defaults to `claude-opus-5`, `--effort`
low…max). Token usage per call is printed to stderr.

## The LLM loop, step by step

1. Ask for an outline against the component names; trim the catalogue to it.
2. Ask for the page spec as structured output (the spec schema), with the
   trimmed catalogue, verified examples and the closest existing specs.
3. Run the static verifier in strict mode with the app's routes. On failure,
   return `errors` verbatim and ask for one patch per error; apply the patches.
4. On pass, run the render verifier in CI, then `visual-check` the deployed
   page, then ship the JSON.

This is exactly what `gen-spec` does; a whole app is the same loop over
`app.json` first, then one page at a time.
