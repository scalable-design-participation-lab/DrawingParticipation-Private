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
      "type": "IntroModal",
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
| `if`    | Render the node only while the expression is truthy.                                                                                                       |
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

## Interaction

Everything an LLM can wire: show/hide (`if`), two-way values (`bind` +
`update:*` → `set`), modals (`toggle` / `set`), navigation, list-item actions
(`"value": "$item.id"`), loading/error states (`$sources.x.loading` /
`$sources.x.error`), form validation feedback (`FormFields.errors`, a
`field -> message` map a handler can `set`), side effects (`call`).
Animations, drag, map gestures stay inside components (an enumerated prop at most).

## Data sources

| kind         | fields                     | served by                                   |
| ------------ | -------------------------- | ------------------------------------------- |
| `static`     | `items`                    | `staticAdapter` (fixtures, mocks, tests)    |
| `rest`       | `url`                      | `restAdapter` (array, `{items}` or GeoJSON) |
| `collection` | `name`, `where?`, `limit?` | `createFirestoreAdapter(db)` or your own    |

Every kind accepts `contract`: the name of a collection contract the rows must
satisfy. Rows that fail are rejected wholesale (`$sources.<name>.error` holds
the `VerifyResult`) so bad data never reaches a component.

The adapter is injected once in the app shell:

```ts
// app.vue
provide(DATA_ADAPTER, composeAdapters({
  static: staticAdapter,
  rest: restAdapter,
  collection: createFirestoreAdapter(useFirestore()),
}))
```

Swapping Firestore for a REST backend changes that one line.

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
   `action.unknown-state`, `action.unknown-handler`, `style.unknown`, `style.raw-class` (strict).
2. **Render** (`verifyRender`, seconds, in vitest): mounts the spec headlessly and
   collects every Vue warning/error (`render.warn`, `render.error`).
3. **Contract** (`verifyRows`, on every adapter response): rows vs. the collection
   schema (`row.invalid`, `rows.not-array`). Runs automatically in `useDataSources`.

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
  "data": { "collection": "none" } // or "rest" + "restBase"
}
```

- Routes become real Nuxt routes at build time (`pages:extend` in
  `base/nuxt.config.ts`); they replace any hand-written page with the same
  path and drop base's template pages. `SpecPage` renders the page, `Outlet`
  marks where it goes inside the shell.
- Title / description / lang come from the manifest (base `app.vue`); theme
  colors and color mode are applied at runtime; `data.collection` picks the
  adapter for `collection` data sources (`rest` with `restBase`, or none —
  Firestore apps provide their own adapter in a plugin).
- `yarn workspace @mono/base verify --app apps/<app>` checks the manifest,
  every routed spec (strict) and the shell (`manifest.*` rules), all in one
  result. Each app has `specs/__test__/app.test.ts` doing the same in vitest.

An app is therefore `app.json` + `specs/*.json` + `contracts.ts` /
`plugins/registry.ts` / `utils/styles.ts` (its own components, handlers and
presets) + `nuxt.config.ts`. All three apps in this repo run this way; mnc
still has hand-written pages and is untouched by the manifest machinery.

## The generation loop

```bash
yarn workspace @mono/base gen-spec --app apps/<app> --page <name> --prompt "…" [--provider stub|anthropic] [--rounds 3]
```

`gen-spec` builds the catalogue (components with their props, collections,
handlers, style presets), adds two existing specs as examples and the task,
asks the provider for JSON, runs the strict verifier, and feeds the `errors`
back for up to `--rounds` attempts. On pass it writes `specs/<name>.json`.
The `stub` provider reads the "answer" from `--stub <file>` so the loop is
testable without a key; `anthropic` uses `ANTHROPIC_API_KEY` (`--model`
overrides the default). Nothing else in the repo knows which provider ran.

## The LLM loop, step by step

1. Give the model `docs/schemas/index.json` plus the component / collection /
   handler / style-preset schemas it needs, and two existing specs as examples.
2. Ask for a page spec. It writes JSON only.
3. Run the static verifier in strict mode. On failure, return `errors` verbatim
   and ask for a fix; the `path` tells it exactly which node to change.
4. On pass, run the render verifier in CI, then ship the JSON.

This is exactly what `gen-spec` does; a whole app is the same loop over
`app.json` first, then one page at a time.
