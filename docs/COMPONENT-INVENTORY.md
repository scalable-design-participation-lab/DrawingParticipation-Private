# Component inventory

**What exists is in [`schemas/index.json`](schemas/index.json), and one file per
component under [`schemas/components/`](schemas/components).** Those are written
by `yarn workspace @mono/base schemas` straight from the zod contracts, so they
cannot drift; a contract that goes away takes its schema with it. Read them, not
a table someone forgot to update.

This file is only for what a schema cannot say: which components an app still
owns, and why.

## Base owns 35

Every one of them is registered in `base/app/plugins/registry.ts` and reachable
from any spec by name. They take data in through props and send everything back
out as events -- none reads a store, a manifest or `runtimeConfig` behind the
page's back, with two exceptions that say so in their contract
(`stateful: true`):

- `AnalysisPanel` / `AnalysisLayers` share the map-analysis state (which layers
  the reader turned on, and their settings) through `stores/layers` and
  `composables/useAnalysis`. Two components either side of the map have to agree
  on one list of layers, and a spec has nowhere to keep it.
- `Header` reads `app.json` for the logo, the accent and the brand: those belong
  to the app as a whole, not to whichever page is rendering.

## Apps own 8

| App | Components | Why they are still here |
| --- | --- | --- |
| open-sensing-chapultepec | `WeatherGlyph`, `GlyphLegend`, `GlyphCanvas` (`GlyphPart` inside them) | The glyph is this project's own drawn language -- SVG paths for cloud, rain, wind, smell and temperature. A fifth app would not want them, and base would gain four components with one user each. |
| mnc | `EntryDetail`, `MobileInfoPopup`, `MobileContributeFlow`, `ModerationPanel`, `AdminAccounts` (`ImageUploadModal` inside the first two) | Each is a view of mnc's own data model (an entry, its contributions, its moderation state). Turning them into specs waits on the Firestore backend below: they read and write through `apps/mnc/app/handlers.ts`, and rewriting a live contribution flow that cannot be run is how you break one quietly. |

`GeoSpatialLayer/*`, `Icons/*`, `NumberCounter`, `DatePicker` and
`SpecErrorBoundary` live in base without contracts on purpose: they are parts
other components assemble, not things a spec names.

## The backend, and how far it has actually been taken

`base/app/data/firestore.ts` and `base/app/data/auth.ts` let an app set
`data.backend: "firestore"` in `app.json` and keep the same data sources,
the same `saveTo` / `updateIn` / `deleteFrom` actions and the same `where`
clauses -- which may name page state, so a source can ask for "the rows
belonging to whoever is signed in" and re-read itself when that changes.

`base/app/data/__test__/` covers the part base is responsible for, against a
stubbed SDK: a data source becomes the query you would expect, a write lands
on the document it names, every way of signing in leaves the same
`state.auth`, a bad call throws instead of half-signing someone in, and a
`where` that names state re-reads when that state moves (and only then).

What no test here can tell you is whether a real project's rules let you read
it. **No app has switched**, and there are no Firebase credentials on this
machine, so none of it has run against a live Firestore. Switching mnc or
restart-ukraine is the next step, and it needs somewhere it can be tried.

One thing to fix when it is: `watchAuth` drops the unsubscribe that
`onAuthStateChanged` returns. One page per app today, so nothing stacks up,
but a second spec page calling it would add a second listener.
