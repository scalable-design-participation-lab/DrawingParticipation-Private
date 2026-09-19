# barrio-ideas

A participation map written **only as JSON**, to prove the generalized
library covers a new app end to end without a line of app code:

- `app/app.json` – title, theme, routes, and the `ideas` collection declared
  as `fields` (validated server-side on every write).
- `app/specs/shell.json` – header + `Outlet`.
- `app/specs/mapa.json` – a `FeatureLayer` for the saved ideas (comment
  bubbles), another for what you are drawing (`StepCard` picks the draw
  mode), a `MarkerOverlay` + `FormFields` editor that `saveTo`s the
  collection.
- `app/specs/ideas.json` – `List` of the saved rows.
- `app/specs/acerca.json` – text.

No components, handlers, stores or styles of its own. The four files next
to `app/` (`package.json`, `nuxt.config.ts`, `tsconfig.json`,
`eslint.config.mjs`) are the fixed boilerplate a generator templates.

```bash
yarn workspace @mono/base verify --app apps/barrio-ideas
yarn workspace @mono/barrio-ideas dev
```
