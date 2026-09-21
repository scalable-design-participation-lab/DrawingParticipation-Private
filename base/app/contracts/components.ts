import { z } from 'zod'
import type { ComponentContract } from './types'

const contracts = new Map<string, ComponentContract>()

export function registerContract(contract: ComponentContract) {
  contracts.set(contract.name, contract)
  return contract
}

export function getContract(name: string) {
  return contracts.get(name)
}

export function listContracts() {
  return [...contracts.values()]
}

// ---------------------------------------------------------------------------
// Shared fragments
// ---------------------------------------------------------------------------

export const LonLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])

/**
 * What goes in the header, never how it looks: base paints every item the same
 * way, and `primary` is the one emphasis a page can ask for.
 */
export const HeaderItem = z.strictObject({
  label: z.string().optional(),
  to: z.string().optional(),
  icon: z.string().optional(),
  primary: z.boolean().optional().describe('Render as the emphasized item.'),
  target: z.string().optional().describe('Link target, e.g. "_blank" for an external site'),
})

// ---------------------------------------------------------------------------
// Base component contracts (registry name -> Vue component is wired in
// app/plugins/registry.ts)
// ---------------------------------------------------------------------------

registerContract({
  name: 'BackgroundMap',
  description: 'Full-size OpenLayers map with a Mapbox raster basemap. Layers and overlays go in slots.',
  props: z.strictObject({
    center: z.array(z.number()).length(2).optional().describe('View center in the map projection (EPSG:3857 by default).'),
    centerLonLat: LonLat.optional().describe('View center as [lon, lat]; wins over `center`.'),
    zoom: z.number().min(0).max(22).optional(),
    minZoom: z.number().min(0).max(22).optional(),
    maxZoom: z.number().min(0).max(22).optional(),
    projection: z.string().optional(),
    rotation: z.number().optional(),
    mapHeight: z.string().optional().describe('CSS height, e.g. "100vh" or "100%".'),
    showZoomControl: z.boolean().optional(),
    mapType: z.enum(['vector', 'satellite']).optional(),
    mapboxStyleLight: z.string().optional().describe('Mapbox style id, e.g. "mapbox/light-v11".'),
    mapboxStyleDark: z.string().optional(),
    mapboxToken: z.string().optional().describe('Falls back to runtimeConfig.public.mapboxToken.'),
  }),
  emits: ['map-click'],
  slots: ['layers', 'overlays'],
})

registerContract({
  name: 'Header',
  description: 'Floating top bar: logo, left nav items, right action items. The logo, the accent color and the stacking order come from app.json (`brand` / `theme.accent`), not from the spec.',
  props: z.strictObject({
    variant: z.enum(['pill', 'text']).optional().describe('Two finished looks: floating buttons (default) or a bar of text links.'),
    leftItems: z.array(HeaderItem).optional(),
    rightItems: z.array(HeaderItem).optional(),
    showIcon: z.boolean().optional(),
    showColorMode: z.boolean().optional(),
    showMenu: z.boolean().optional(),
  }),
  emits: ['menu'],
  slots: ['logo', 'menu', 'right'],
})

registerContract({
  name: 'Footer',
  description: 'Floating bottom bar with a title, links and buttons.',
  props: z.strictObject({
    title: z.string().optional(),
    links: z.array(z.strictObject({ to: z.string(), label: z.string() })).optional(),
    buttons: z.array(z.object({ label: z.string(), to: z.string().optional() }).passthrough()).optional().describe('Pressing one emits `buttonClick` with the entry'),
    icons: z.array(z.strictObject({ name: z.string() })).optional(),
  }),
  emits: ['support', 'buttonClick'],
  slots: ['support'],
})

registerContract({
  name: 'Modal',
  description: 'The one modal: title, `text` or children, optional confirm button (`buttonLabel`, emits `confirm` then closes), optional `footer` slot, × when `closable`. Intro, help, menu, thank-you, coming-soon dialogs are all this plus JSON.',
  props: z.strictObject({
    modelValue: z.boolean().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    buttonLabel: z.string().optional().describe('Confirm button label; omit for no button'),
    align: z.enum(['left', 'center']).optional(),
    size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
    closable: z.boolean().optional().describe('Show a × in the header'),
    bodyClass: z.string().optional().describe('Classes for the body box, e.g. a bordered "paper" panel.'),
    ui: z.record(z.string(), z.unknown()).optional().describe('Nuxt UI `ui` override for the underlying UModal.'),
  }),
  emits: ['update:modelValue', 'close', 'confirm'],
  slots: ['default', 'footer'],
})

registerContract({
  name: 'MarkerOverlay',
  description: 'Renders one HTML overlay per item on the map. Put it in the BackgroundMap "overlays" slot.',
  props: z.strictObject({
    items: z.array(z.record(z.string(), z.unknown())).optional(),
    item: z.record(z.string(), z.unknown()).nullable().optional().describe('A single item (e.g. the selected feature); null renders nothing.'),
    positionKey: z.string().optional().describe('Item key holding [lon, lat] (default "position").'),
    lonLat: z.boolean().optional().describe('Positions are [lon, lat] (default) rather than map coordinates.'),
    positioning: z.string().optional(),
    stopEvent: z.boolean().optional(),
  }),
  slots: ['item'],
})

registerContract({
  name: 'FileDropZone',
  description: 'Headless drag-and-drop / click-to-browse file picker.',
  props: z.strictObject({
    accept: z.string().optional(),
    multiple: z.boolean().optional(),
    capture: z.enum(['user', 'environment']).optional(),
    lines: z.array(z.string()).optional().describe('Lines drawn inside a dashed box when no children are given'),
  }),
  emits: ['files'],
  slots: ['default'],
})

registerContract({
  name: 'FilterSidebar',
  description: 'Panel of collapsible filter sections. A section is `{ label, name, component, props }`: `label` heads the accordion, `component` is "GenericCheckboxGroup" (props `{ items: [{ label, value }] }`) or "GenericDateRangePicker", `name` identifies it. `filter-change` emits `{ name, value }`; a checkbox group value is a map of item value to boolean, which binds straight to `FeatureLayer.visibleTags`.',
  props: z.strictObject({
    isVisible: z.boolean().optional(),
    title: z.string().optional(),
    filterSections: z.array(z.object({
      label: z.string(),
      name: z.string(),
      component: z.enum(['GenericCheckboxGroup', 'GenericDateRangePicker']),
      props: z.record(z.string(), z.unknown()).optional(),
    }).passthrough()),
  }),
  emits: ['close', 'reset', 'filter-change', 'download'],
})

registerContract({
  name: 'Toolbar',
  description: 'Vertical tool palette. Pressing one emits `toolClick` with that tool (plus its `index`), so give each tool a `value` and branch on `$state.<key>.value`.',
  props: z.strictObject({
    tools: z.array(z.object({ icon: z.string().optional(), tooltip: z.string().optional(), value: z.unknown().optional() }).passthrough()),
  }),
  emits: ['toolClick'],
})

registerContract({
  name: 'MapTypeToggle',
  description: 'Vector / satellite switch (header pill). Bind its value to BackgroundMap `mapType`.',
  props: z.strictObject({ modelValue: z.enum(['vector', 'satellite']).optional() }),
  emits: ['update:modelValue'],
})

export const FormFieldSchema = z.strictObject({
  name: z.string(),
  label: z.string().optional(),
  type: z.enum(['text', 'email', 'password', 'textarea', 'number', 'date', 'time', 'select']).optional(),
  placeholder: z.string().optional(),
  rows: z.number().int().positive().optional(),
  options: z.array(z.strictObject({ label: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
  required: z.boolean().optional(),
  class: z.string().optional(),
})

const DrawModeSchema = z.strictObject({
  type: z.enum(['Point', 'LineString', 'Polygon']),
  iconName: z.string().optional(),
  frequency: z.string().optional(),
  isProhibit: z.boolean().optional(),
  color: z.string().optional().describe('Stroke / point color while drawing'),
})

registerContract({
  name: 'FeatureLayer',
  description: 'Draw and show map features (points with icons, dashed polygons, dashed lines). `features` in, `update:features` out after a drawing or a delete; `draw` is the active draw mode (a value a StepCard button can carry), cleared through `update:draw`. `open` / `inspect` emit the feature flat plus `position` and `title`, ready for a MarkerOverlay `item`. Goes in the BackgroundMap "layers" slot.',
  props: z.strictObject({
    features: z.array(z.record(z.string(), z.unknown())).optional(),
    draw: DrawModeSchema.nullable().optional(),
    icons: z.record(z.string(), z.string()).optional().describe('iconName | frequency | "prohibit" | "default" -> image URL'),
    labels: z.record(z.string(), z.string()).optional().describe('iconName | frequency | "prohibit" -> title'),
    defaultLabel: z.string().optional(),
    editable: z.boolean().optional().describe('Show the open (edit) button on every feature'),
    deletable: z.boolean().optional(),
    commentIcons: z.boolean().optional().describe('Show the comment icon that emits `inspect`'),
    visibleTags: z.union([z.array(z.string()), z.record(z.string(), z.boolean())]).optional().describe('Only draw features whose icon key is listed, or true in the map a FilterSidebar checkbox group emits; omit to draw all'),
    confirmDelete: z.string().optional(),
  }),
  emits: ['update:features', 'update:draw', 'open', 'inspect'],
})

const StepButtonSchema = z.strictObject({
  label: z.string(),
  color: z.string().optional(),
  variant: z.enum(['solid', 'outline']).optional(),
  tooltip: z.string().optional(),
  value: z.unknown().optional().describe('Emitted by `select` when chosen'),
})
const StepIconSchema = z.strictObject({
  name: z.string(),
  src: z.string(),
  tooltip: z.string().optional(),
  value: z.unknown().optional().describe('Emitted by `select` when chosen'),
})
registerContract({
  name: 'StepCard',
  description: 'A card that walks through numbered steps (progress bar, title, text, buttons, icon grid, prev / next). `step` is 1-based and comes back through `update:step`; choosing a button or an icon emits `select` with its `value`.',
  props: z.strictObject({
    step: z.number().int().positive().optional(),
    steps: z.array(z.strictObject({
      title: z.string().optional(),
      text: z.string().optional(),
      icon: z.string().optional(),
      buttons: z.array(StepButtonSchema).optional(),
      iconGrid: z.strictObject({ title: z.string().optional(), icons: z.array(StepIconSchema) }).optional(),
    })),
  }),
  emits: ['update:step', 'select'],
  slots: ['default'],
})

registerContract({
  name: 'Accordion',
  description: 'Collapsible sections. `items` gives the labels; the content of item n goes in slot "item-n".',
  props: z.strictObject({
    items: z.array(z.strictObject({ label: z.string(), defaultOpen: z.boolean().optional() })),
    multiple: z.boolean().optional(),
  }),
  slots: ['item-0', 'item-1', 'item-2', 'item-3', 'item-4', 'item-5'],
})

registerContract({
  name: 'List',
  description: 'Repeat the `item` template for every row of `items` (bind to `$data.<source>` or a state list), as a stack or a grid. Inside the template use `$item.<field>`.',
  props: z.strictObject({
    items: z.array(z.unknown()).optional(),
    layout: z.enum(['stack', 'grid']).optional(),
    cols: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    gap: z.enum(['none', 'xs', 'sm', 'md', 'lg']).optional(),
    empty: z.string().optional().describe('Text shown when there are no items'),
    filterKey: z.string().optional().describe('Keep rows whose field equals filterValue (bind filterValue to state; empty = all)'),
    filterValue: z.unknown().optional(),
    search: z.string().optional().describe('Case-insensitive text search (bind to state)'),
    searchKeys: z.array(z.string()).optional(),
    sortBy: z.string().optional(),
    sortDesc: z.boolean().optional(),
    limit: z.number().int().positive().optional(),
  }),
  slots: ['item'],
})

registerContract({
  name: 'Tally',
  description: 'Results as data: groups `items` by a field and shows one bar per group with the count, or the sum / average of `valueKey`.',
  props: z.strictObject({
    items: z.array(z.unknown()).optional(),
    by: z.string(),
    mode: z.enum(['count', 'sum', 'avg']).optional(),
    valueKey: z.string().optional().describe('Numeric field for sum / avg'),
    labels: z.record(z.string(), z.string()).optional().describe('value -> label'),
    empty: z.string().optional(),
    decimals: z.number().int().min(0).max(4).optional(),
  }),
})

registerContract({
  name: 'Tabs',
  description: 'A row of pills with one selected; bind `modelValue` to a state key and set it back on `update:modelValue` (e.g. a category filter for a List).',
  props: z.strictObject({
    options: z.array(z.strictObject({ label: z.string(), value: z.string() })),
    modelValue: z.string().optional(),
  }),
  emits: ['update:modelValue'],
})

registerContract({
  name: 'FormFields',
  description: 'A form described by data: `fields` in, one values object out (`update:modelValue`, `submit`).',
  props: z.strictObject({
    fields: z.array(FormFieldSchema),
    modelValue: z.record(z.string(), z.unknown()).optional(),
    variant: z.enum(['box', 'underline']).optional(),
    layout: z.enum(['stacked', 'inline']).optional(),
    submitLabel: z.string().optional(),
    gap: z.string().optional(),
    direction: z.enum(['column', 'row']).optional(),
    labelClass: z.string().optional(),
    errors: z.record(z.string(), z.string()).optional().describe('field name -> message shown under the control'),
  }),
  emits: ['update:modelValue', 'submit'],
})

registerContract({
  name: 'PhotoDropZone',
  description: 'Photo picker with preview: drop, click or take a photo.',
  props: z.strictObject({
    lines: z.array(z.string()).optional(),
    accept: z.string().optional(),
    capture: z.enum(['user', 'environment']).optional(),
  }),
  emits: ['files'],
})

registerContract({
  name: 'ToolTips',
  description: 'Hover/click tooltips for vector features on the map. Put it in the BackgroundMap "overlays" slot.',
  props: z.strictObject({
    filterKeys: z.array(z.string()).optional(),
    clickTolerance: z.number().optional(),
    dataProjection: z.string().optional(),
    featuresProjection: z.string().optional(),
    itemsPerPage: z.number().int().positive().optional(),
  }),
})

// Nuxt UI primitives for content pages. Props are forwarded, so only the
// common ones are declared and the rest is allowed through (`looseProps`).
registerContract({
  name: 'Button',
  description: 'Nuxt UI button / link.',
  props: z.strictObject({ label: z.string().optional(), to: z.string().optional(), color: z.string().optional(), variant: z.string().optional(), icon: z.string().optional(), size: z.string().optional() }),
  looseProps: true,
  emits: ['click'],
  slots: ['default'],
})
registerContract({ name: 'Divider', description: 'Nuxt UI divider.', props: z.strictObject({ label: z.string().optional() }), looseProps: true })
registerContract({ name: 'Card', description: 'Nuxt UI card.', props: z.strictObject({}), looseProps: true, slots: ['default', 'header', 'footer'] })
registerContract({
  name: 'Icon',
  description: 'An icon with the same enumerated size / tone vocabulary as Text.',
  props: z.strictObject({
    name: z.string(),
    size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
    tone: z.enum(['default', 'muted', 'accent', 'inverse']).optional(),
  }),
})

// ---------------------------------------------------------------------------
// Layout primitives: every visual decision is an enum, so a spec never needs
// a raw class string (see utils/styles.ts for the escape hatch).
// ---------------------------------------------------------------------------
const Gap = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl'])
const Cols = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)])

registerContract({
  name: 'Stack',
  description: 'Flex container. Children flow in a row or a column with an enumerated gap.',
  props: z.strictObject({
    direction: z.enum(['row', 'column']).optional(),
    gap: Gap.optional(),
    align: z.enum(['start', 'center', 'end', 'stretch', 'baseline']).optional(),
    justify: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
    wrap: z.boolean().optional(),
    responsive: z.boolean().optional().describe('Column on phones, row from md up.'),
    as: z.string().optional(),
  }),
  slots: ['default'],
})

registerContract({
  name: 'Grid',
  description: 'CSS grid with enumerated columns (`cols` on phones, `colsMd` from md up).',
  props: z.strictObject({
    cols: Cols.optional(),
    colsMd: Cols.optional(),
    gap: Gap.optional(),
    as: z.string().optional(),
  }),
  slots: ['default'],
})

registerContract({
  name: 'Panel',
  description: 'A box: plain / card / outline / paper, with enumerated padding and an optional readable measure.',
  props: z.strictObject({
    variant: z.enum(['plain', 'card', 'outline', 'paper']).optional(),
    padding: z.enum(['none', 'sm', 'md', 'lg']).optional(),
    measure: z.enum(['none', 'prose', 'wide']).optional(),
    as: z.string().optional(),
  }),
  slots: ['default'],
})

registerContract({
  name: 'Text',
  description: 'Typography: element, size, weight, tone, alignment. Size and weight default from the element.',
  props: z.strictObject({
    as: z.enum(['h1', 'h2', 'h3', 'p', 'span', 'label']).optional(),
    size: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']).optional(),
    weight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
    tone: z.enum(['default', 'muted', 'accent', 'inverse']).optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    text: z.union([z.string(), z.number()]).optional(),
    format: z.enum(['date', 'datetime', 'number']).optional().describe('Render an ISO date / a number in the reader\'s locale'),
    labels: z.record(z.string(), z.string()).optional().describe('value -> label for stored codes; unknown values show as-is'),
  }),
  slots: ['default'],
})

registerContract({
  name: 'Image',
  description: 'Image with enumerated width and rounded corners; optionally wrapped in a link.',
  props: z.strictObject({
    src: z.string(),
    alt: z.string().optional(),
    width: z.enum(['auto', 'full', 'half', 'third', 'two-thirds']).optional(),
    rounded: z.boolean().optional(),
    href: z.string().optional(),
  }),
})

registerContract({
  name: 'Outlet',
  description: 'Where the current page renders inside a shell spec (app.json `shell`). Exactly one per shell.',
  props: z.strictObject({}),
})
