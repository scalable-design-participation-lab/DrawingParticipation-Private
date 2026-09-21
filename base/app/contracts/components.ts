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
const UI_COLOR = z.enum(['primary', 'black', 'white', 'gray', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'])
const UI_VARIANT = z.enum(['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'])
const UI_SIZE = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])

const HeaderItem = z.strictObject({
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
    pitch: z.number().optional(),
    bearing: z.number().optional(),
    extent: z.array(z.number()).length(4).optional().describe('Bounds panning, in the map projection. Defaults to one world, so the view cannot drift into the repeated copies where HTML overlays do not render.'),
    mapHeight: z.string().optional().describe('CSS height, e.g. "100vh" or "100%".'),
    showZoomControl: z.boolean().optional(),
    mapType: z.enum(['vector', 'satellite']).optional(),
    mapboxStyleLight: z.string().optional().describe('Mapbox style id, e.g. "mapbox/light-v11".'),
    mapboxStyleDark: z.string().optional(),
    mapboxToken: z.string().optional().describe('Falls back to runtimeConfig.public.mapboxToken.'),
  }),
  // `featureClick` fires when the click landed on an existing feature and
  // carries `{ feature, markerPosition }`; `mapClick` fires for bare map.

  emits: ['mapClick', 'featureClick'],
  slots: ['layers', 'overlays'],
})

registerContract({
  name: 'Header',
  description: 'Floating top bar: logo, left nav items, right action items. The logo, the accent color and the stacking order come from app.json (`brand` / `theme.accent`), not from the spec.',
  props: z.strictObject({
    variant: z.enum(['pill', 'text']).optional().describe('Two finished looks: floating buttons (default) or a bar of text links.'),
    leftItems: z.array(HeaderItem).optional(),
    rightItems: z.array(HeaderItem).optional(),
    showIcon: z.boolean().optional().describe('The lab mark on the far left.'),
    showLogo: z.boolean().optional().describe('The app\'s own logo from app.json `brand`.'),
    showColorMode: z.boolean().optional(),
    showMenu: z.boolean().optional(),
  }),
  emits: ['menu'],
  slots: ['logo', 'center', 'menu', 'right'],
})

registerContract({
  name: 'Footer',
  description: 'Floating bottom bar with a title, links and buttons.',
  props: z.strictObject({
    title: z.string().optional(),
    links: z.array(z.strictObject({ to: z.string(), label: z.string() })).optional(),
    buttons: z.array(z.object({ label: z.string(), to: z.string().optional() }).passthrough()).optional().describe('Pressing one emits `buttonClick` with the entry'),
    icons: z.array(z.strictObject({ name: z.string() })).optional(),
    supportLabel: z.string().optional().describe('Accessible name of the "?" button; pass a "$t." key to translate it.'),
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
    size: z.enum(['sm', 'md', 'lg', 'xl', '2xl', '3xl']).optional(),
    scroll: z.boolean().optional().describe('Cap the height and scroll the body, keeping the title and the button in place.'),
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
    cluster: z.number().nonnegative().optional().describe('Merge items closer than this many map units into one overlay, so overlapping markers stay reachable. The item slot then gets { position, members, count }.'),
    filterKey: z.string().optional(),
    filterIn: z.union([z.array(z.string()), z.record(z.string(), z.boolean()), z.null()]).optional().describe('Keep items whose filterKey is in this set, like List filterIn.'),
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
    modelValue: z.array(z.unknown()).nullable().optional().describe('Bound mode: the component keeps the picked files and draws them as removable rows.'),
    maxSizeMb: z.number().positive().optional().describe('Largest file accepted; anything bigger is refused with a message.'),
    removeLabel: z.string().optional(),
    tooLargeLabel: z.string().optional().describe('Message for an oversized file, with {name} and {max} placeholders.'),
    unsupportedLabel: z.string().optional().describe('Message for a file outside `accept`, with a {name} placeholder.'),
  }),
  emits: ['update:modelValue', 'files'],
  slots: ['default'],
})

registerContract({
  name: 'FilterSidebar',
  description: 'Panel of collapsible filter sections. A section is `{ label, name, component, props }`: `label` heads the accordion, `component` is "GenericCheckboxGroup" (props `{ items: [{ label, value }], selectAllLabel?, deselectAllLabel? }`) or "GenericDateRangePicker", `name` identifies it. `filterChange` emits `{ name, value }`; a checkbox group value is a map of item value to boolean, which binds straight to `FeatureLayer.visibleTags`.',
  props: z.strictObject({
    isVisible: z.boolean().optional(),
    title: z.string().optional(),
    resetLabel: z.string().optional().describe('Wording of the reset button; pass a "$t." key to translate it.'),
    values: z.record(z.string(), z.unknown()).optional().describe('Current value of each section keyed by its `name`. Bind the same page state you set from `filterChange`, or the panel forgets what is selected when it is closed.'),
    filterSections: z.array(z.object({
      label: z.string(),
      name: z.string(),
      component: z.enum(['GenericCheckboxGroup', 'GenericDateRangePicker']),
      props: z.record(z.string(), z.unknown()).optional(),
    }).passthrough()),
  }),
  emits: ['close', 'reset', 'filterChange'],
  slots: ['before-filters', 'footer-buttons'],
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

const FormFieldSchema = z.strictObject({
  name: z.string(),
  label: z.string().optional(),
  type: z.enum(['text', 'email', 'password', 'textarea', 'number', 'date', 'time', 'select']).optional(),
  placeholder: z.string().optional(),
  rows: z.number().int().positive().optional(),
  options: z.array(z.strictObject({ label: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
  required: z.boolean().optional(),
  style: z.union([z.string(), z.array(z.string())]).optional().describe('Registered style preset(s) for the control, e.g. a width. Raw classes are not accepted.'),
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
  color: UI_COLOR.optional(),
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
    items: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).optional().describe('Rows to repeat over. A plain object is repeated over its entries instead, each arriving as { key, value } (a row-shaped value is spread, keeping its key).'),
    layout: z.enum(['stack', 'grid']).optional(),
    cols: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    gap: z.enum(['none', 'xs', 'sm', 'md', 'lg']).optional(),
    empty: z.string().optional().describe('Text shown when there are no items'),
    filterKey: z.string().optional().describe('Keep rows whose field equals filterValue (bind filterValue to state; empty = all)'),
    filterValue: z.unknown().optional(),
    groupBy: z.string().optional().describe('Group rows by this key: the item template then repeats per group and gets { value, count, rows }, so a nested List over `$item.rows` renders one group.'),
    groupOrder: z.array(z.string()).optional().describe('Groups that come first, in this order.'),
    filterIn: z.union([z.array(z.string()), z.record(z.string(), z.boolean()), z.null()]).optional().describe('Keep rows whose filterKey is in this set: a list, or the { value: boolean } map a checkbox group or an IconBar emits. An empty selection keeps all.'),
    exclude: z.array(z.unknown()).nullable().optional().describe('Rows to subtract: keep only those whose excludeBy field appears in none of them, e.g. the registrations that are not already accounts.'),
    excludeBy: z.string().optional().describe('Field compared on both sides of exclude; dotted paths allowed.'),
    search: z.string().optional().describe('Case-insensitive text search (bind to state)'),
    searchKeys: z.array(z.string()).optional(),
    sortBy: z.string().optional(),
    sortDesc: z.boolean().optional(),
    near: z.union([z.tuple([z.number(), z.number()]), z.null()]).optional().describe('Sort nearest-first from this [lon, lat] and give the item template a `distanceKm`. Bind the state `watchLocation` fills.'),
    coordinatesKey: z.string().optional().describe('Where a row keeps its position (default "coordinates"); a dotted path works.'),
    coordinates: z.enum(['lonlat', 'webmercator']).optional().describe('What those numbers are (default "lonlat"); map features are usually "webmercator".'),
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
  name: 'VoiceRecorder',
  description: 'Record a voice note in the browser. Recordings arrive in `modelValue` as File objects, the same way PhotoDropZone and FileDropZone hand over what was picked, so the same `saveTo` uploads them.',
  props: z.strictObject({
    modelValue: z.array(z.unknown()).optional(),
    recordLabel: z.string().optional(),
    stopLabel: z.string().optional(),
    removeLabel: z.string().optional(),
    deniedLabel: z.string().optional().describe('Shown when the reader refuses the microphone, or there is none.'),
  }),
  emits: ['update:modelValue'],
})

registerContract({
  name: 'Carousel',
  description: 'A strip of images with arrows, a counter and dots. A URL that fails to load is dropped, so the counter never promises a slide that is not there. Every label is a prop, so pass "$t." keys.',
  props: z.strictObject({
    images: z.array(z.string()).optional(),
    caption: z.string().optional(),
    alt: z.string().optional(),
    height: z.enum(['sm', 'md', 'lg']).optional(),
    emptyTitle: z.string().optional().describe('Shown in place of the strip when there are no images.'),
    emptyText: z.string().optional(),
    prevLabel: z.string().optional(),
    nextLabel: z.string().optional(),
  }),
})

registerContract({
  name: 'Dropdown',
  description: 'A one-of choice that costs one button of space: the trigger shows the current item, the list opens on press. Use `Tabs` where the options fit and this where they do not, e.g. a language switcher in a phone header.',
  props: z.strictObject({
    items: z.array(z.strictObject({
      value: z.string(),
      label: z.string(),
      icon: z.string().optional(),
    })).optional(),
    modelValue: z.string().optional(),
    label: z.string().optional().describe('Trigger text; the selected label otherwise.'),
    icon: z.string().optional().describe('Trigger icon, in place of text.'),
    title: z.string().optional().describe('Accessible name for the trigger.'),
    showValue: z.boolean().optional().describe('Trigger shows the selected value, not its label, so the list can read "Portugues" while the button reads "PT".'),
    uppercase: z.boolean().optional(),
  }),
  emits: ['update:modelValue'],
})

registerContract({
  name: 'IconBar',
  description: 'Floating pill of icon buttons: the bottom toolbar of a map app, a row of category chips, a view switcher. `modelValue` is the active value (or the list of them with `multiple`), so the page owns it. An item may carry its own `onClick` action when pressing it does more than change which one is lit.',
  props: z.strictObject({
    items: z.array(z.strictObject({
      value: z.string(),
      icon: z.string().optional(),
      label: z.string().optional().describe('Tooltip and accessible name.'),
      color: z.string().optional().describe('Colour when active; the theme primary otherwise.'),
      onClick: z.unknown().optional().describe('`{ "$action": … }` run when pressed.'),
    })).optional().describe('The buttons, listed. Leave it out and bind `rows` instead to derive them from data.'),
    rows: z.array(z.record(z.string(), z.unknown())).optional().describe('Rows to read values off: each distinct `field` becomes a button, so a filter bar shows the categories actually present.'),
    field: z.string().optional().describe('Which key of a row holds the value.'),
    first: z.array(z.string()).optional().describe('Values that always appear, in this order, ahead of anything found in `rows`.'),
    exclude: z.array(z.string()).optional(),
    icons: z.record(z.string(), z.string()).optional().describe('value -> icon, for buttons derived from `rows`.'),
    colors: z.record(z.string(), z.string()).optional().describe('value -> colour when active.'),
    labels: z.record(z.string(), z.string()).optional().describe('value -> tooltip; the value itself otherwise.'),
    modelValue: z.union([z.string(), z.array(z.string())]).optional(),
    multiple: z.boolean().optional(),
    position: z.enum(['top', 'bottom', 'static']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
  }),
  emits: ['update:modelValue', 'select'],
})

registerContract({
  name: 'LoadingScreen',
  description: 'Full-screen splash whose bar fills over `duration`, cycling through `steps`, then emits `done`. The progress is reassurance, not measurement: bind `$sources.<name>.loading` to an `if` when the page can tell.',
  props: z.strictObject({
    title: z.string().optional(),
    message: z.string().optional(),
    steps: z.array(z.string()).optional().describe('Shown in turn under the bar, one per equal slice of the duration.'),
    duration: z.number().int().positive().optional().describe('Milliseconds for the bar to fill (default 2500).'),
    icon: z.string().optional(),
  }),
  emits: ['done'],
})

registerContract({
  name: 'ToolTips',
  description: 'Hover/click tooltips for vector features on the map. Put it in the BackgroundMap "overlays" slot. It shows every property a feature carries, so say which ones to leave out rather than which to show.',
  props: z.strictObject({
    hideKeys: z.array(z.string()).optional().describe('Feature properties NOT to show, e.g. internal ids and render fields. Everything else is shown.'),
    clickTolerance: z.number().optional().describe('How many pixels away from a feature still counts as being on it.'),
    itemsPerPage: z.number().int().positive().optional(),
  }),
})

// Nuxt UI primitives for content pages. What a spec may set is declared, and
// nothing else gets through: `ui` in particular would let a page restyle any
// part of a primitive, which is base's call, not the page's.
registerContract({
  name: 'Button',
  description: 'Nuxt UI button / link.',
  props: z.strictObject({
    label: z.string().optional(),
    to: z.string().optional(),
    target: z.string().optional(),
    icon: z.string().optional(),
    trailing: z.boolean().optional(),
    block: z.boolean().optional().describe('Fill the width of its container'),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
    color: UI_COLOR.optional(),
    variant: UI_VARIANT.optional(),
    size: UI_SIZE.optional(),
  }),
  emits: ['click'],
  slots: ['default'],
})
registerContract({ name: 'Divider', description: 'Nuxt UI divider. Spacing around it is a `style` preset on the node.', props: z.strictObject({ label: z.string().optional(), orientation: z.enum(['horizontal', 'vertical']).optional(), type: z.enum(['solid', 'dashed', 'dotted']).optional() }) })
registerContract({ name: 'Card', description: 'Nuxt UI card. Use a `Panel` variant for anything beyond the default look.', props: z.strictObject({}), slots: ['default', 'header', 'footer'] })
registerContract({
  name: 'Icon',
  description: 'An icon with the same enumerated size / tone vocabulary as Text.',
  props: z.strictObject({
    name: z.string(),
    icons: z.record(z.string(), z.string()).optional().describe('value -> icon name, for when a row decides its own icon.'),
    colors: z.record(z.string(), z.string()).optional().describe('value -> colour, for the same lookup.'),
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
    format: z.enum(['date', 'datetime', 'number', 'relative', 'host']).optional().describe('Render the value: an ISO date or a number in the reader locale, `relative` for how long ago, `host` for the domain of a URL.'),
    labels: z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])).optional().describe('value -> label for stored codes; unknown values show as-is. Nest it by language ({ pt: { bici: "Bicicleta" } }) when the label differs per locale and the stored code does not.'),
    fallback: z.union([z.string(), z.number()]).optional().describe('Shown when the bound text is empty, e.g. a row untranslated original.'),
    prefix: z.string().optional().describe('Put in front of the formatted value, e.g. a currency symbol.'),
    suffix: z.string().optional().describe('Put after it, e.g. a unit. Pass a "$t." key to translate it.'),
    decimals: z.number().int().min(0).optional().describe('Round a number to this many decimals.'),
    colors: z.record(z.string(), z.string()).optional().describe('value -> colour for stored codes, like `labels` but for how it reads. Pair it with the same map on an Icon so a theme looks the same wherever it appears.'),
    clamp: z.number().int().positive().optional().describe('Fold to this many lines with a link to open it; the link appears only when the text really is longer.'),
    moreLabel: z.string().optional(),
    lessLabel: z.string().optional(),
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
    variant: z.string().optional().describe('Ask for a derivative a build step wrote beside the original: "thumb" turns /photos/a.webp into /photos/a-thumb.webp. Same-origin paths only.'),
  }),
})

registerContract({
  name: 'UploadQueue',
  description: 'Attach photos and recordings, one upload at a time with the progress of each on screen. Where they go is the app business: `uploader` names a handler, called with { file, onProgress } plus `args`, and whatever it returns lands in `modelValue`. It never submits anything -- the page decides when the collected media is saved.',
  props: z.strictObject({
    uploader: z.string().describe('Handler that uploads one file and returns what should be stored.'),
    args: z.unknown().optional().describe('Passed to the handler as its `args`, e.g. which entry this belongs to.'),
    modelValue: z.array(z.unknown()).optional().describe('What the uploader returned, in the order the files were picked.'),
    accept: z.string().optional(),
    maxSizeMb: z.number().positive().optional(),
    lines: z.array(z.string()).optional().describe('Lines inside the dashed pick box.'),
    recorder: z.boolean().optional().describe('Offer to record in place as well as pick a file.'),
    recordLabel: z.string().optional(),
    stopLabel: z.string().optional(),
    removeLabel: z.string().optional(),
    deniedLabel: z.string().optional(),
    failedLabel: z.string().optional(),
    tooLargeLabel: z.string().optional(),
    unsupportedLabel: z.string().optional(),
  }),
  emits: ['update:modelValue', 'busy'],
  stateful: true,
})

registerContract({
  name: 'Sheet',
  description: 'A phone bottom sheet in two states: a compact card peeking over the bottom bar, and the same sheet pulled up. The grip and the peek card switch between them, the x closes it. The `accent` tone paints the full sheet in the app own accent (theme.accent).',
  props: z.strictObject({
    modelValue: z.boolean().optional().describe('Whether the sheet is there at all; bind it to whatever is selected.'),
    state: z.enum(['peek', 'full']).optional(),
    tone: z.enum(['surface', 'accent']).optional(),
    closeLabel: z.string().optional(),
    toggleLabel: z.string().optional().describe('Accessible name of the grip that switches between the two states.'),
    expandLabel: z.string().optional().describe('Button under the peek content; omit for no button.'),
    peekHeight: z.enum(['35dvh', '45dvh', '60dvh']).optional(),
    fullHeight: z.enum(['60dvh', '75dvh', '85dvh']).optional(),
    offset: z.enum(['none', 'bar']).optional().describe('bar leaves room for a bottom bar underneath.'),
  }),
  emits: ['update:modelValue', 'update:state', 'close'],
  slots: ['default', 'peek'],
})

registerContract({
  name: 'Audio',
  description: 'Plays a recording, or a list of them: the read side of VoiceRecorder. Nothing renders when there is nothing to play.',
  props: z.strictObject({
    src: z.union([z.string(), z.array(z.string())]).optional().describe('One URL or several.'),
    label: z.string().optional().describe('Heading above the players; pass a "$t." key to translate it.'),
    tone: z.enum(['default', 'inverse']).optional().describe('inverse for a coloured panel.'),
  }),
})

registerContract({
  name: 'Outlet',
  description: 'Where the current page renders inside a shell spec (app.json `shell`). Exactly one per shell.',
  props: z.strictObject({}),
})

registerContract({
  name: 'AnalysisPanel',
  description: 'Map analysis dashboard: counted metadata tiles, a card per layer in the layer registry, and the controls accordion for whatever the reader turned on. `modelValue` = dashboard open; the heading copy is the only app-specific part.',
  props: z.strictObject({
    modelValue: z.boolean().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    text: z.string().optional(),
    cardImage: z.string().optional().describe('Art behind each layer card, as a URL a served folder can resolve.'),
    controlsTitle: z.string().optional(),
  }),
  emits: ['update:modelValue'],
  stateful: true,
})

registerContract({
  name: 'AnalysisLayers',
  description: 'Draws the layers AnalysisPanel turned on. Goes in the BackgroundMap "layers" slot.',
  props: z.strictObject({}),
  stateful: true,
})
