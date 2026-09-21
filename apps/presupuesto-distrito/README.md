# presupuesto-distrito

Participatory budgeting for a district, written **only as JSON**. It exists to
put the generalized library under load: it is the first app that uses *every*
component the base registry offers (28 of 28), with real logic behind each one,
so that anything the library got wrong would surface as a broken screen rather
than as a gap nobody noticed.

Four routes, five specs:

- `app/specs/mapa.json` – the map. A `FeatureLayer` draws the saved proposals
  with a per-category icon; a floating `Panel` is the category palette that
  sets the draw mode and doubles as a legend (`visibleTags` hides categories
  the reader unchecked). Drawing a point opens a `StepCard`: step one is
  `FormFields` (title, category, cost, summary), step two is a `PhotoDropZone`
  plus a `FileDropZone` for a PDF estimate. Saving posts one multipart row to
  the `propuestas` collection, uploads and all.
- `app/specs/lista.json` – the proposals, as cards. `Tabs` filters by category,
  `List` searches and sorts, and a `join` folds the `votos` collection into a
  per-row count so a card can show its own votes and `sortBy` them. A card and
  its `Modal` both vote, and both refresh themselves afterwards.
- `app/specs/resultados.json` – `Tally` counts the proposals, sums their cost,
  and counts the votes; a `Grid` under it ranks the categories.
- `app/specs/acerca.json` – an `Accordion` of frequent questions.
- `app/specs/shell.json` – `Header`, `Outlet`, `Footer` (whose buttons open a
  help `Modal`).

Everything the reader sees in Spanish or English comes from
`app/i18n/{es,en}.json`; the specs only ever carry `$t.` keys.

No components, handlers, stores or styles of its own.

```bash
yarn workspace @mono/base verify --app apps/presupuesto-distrito
yarn workspace @mono/presupuesto-distrito dev
```

## What it found

Building it broke the library in ten places, each fixed in `base/` rather than
worked around here: data-source `join`; `payload` on the `call` action and the
`$payload` root (a button could not build the row it saves); a `refreshItem`
handler (an open detail view went stale after its own write); `visibleTags` on
`FeatureLayer`; `size` / `tone` on `Icon` — whose file had to be renamed
`SpecIcon.vue`, because a component named `Icon` shadows the global `<Icon>`
that Nuxt UI renders internally and recurses until the stack overflows; a
default look for `FileDropZone`; footer buttons that rendered and did nothing;
a toolbar that emitted an array index instead of the tool; a `FilterSidebar`
contract describing a shape the component never reads; and three layout presets
(`floating-left` had no width, so the palette covered the map).
