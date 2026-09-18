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

export const HeaderItem = z.strictObject({
  label: z.string().optional(),
  to: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  variant: z.string().optional(),
  primary: z.boolean().optional(),
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
  description: 'Floating top bar: logo, left nav items, right action items.',
  props: z.strictObject({
    variant: z.enum(['pill', 'text']).optional(),
    leftItems: z.array(HeaderItem).optional(),
    rightItems: z.array(HeaderItem).optional(),
    logoSrc: z.string().optional(),
    logoAlt: z.string().optional(),
    logoLink: z.string().optional(),
    showIcon: z.boolean().optional(),
    showColorMode: z.boolean().optional(),
    showMenu: z.boolean().optional(),
    shape: z.enum(['rounded', 'rectangular']).optional(),
    z: z.union([z.string(), z.number()]).optional(),
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
    buttons: z.array(z.strictObject({ label: z.string() })).optional(),
    icons: z.array(z.strictObject({ name: z.string() })).optional(),
  }),
  emits: ['support'],
  slots: ['support'],
})

registerContract({
  name: 'IntroModal',
  description: 'Dismissible modal with a title, a paragraph and one button. Used for welcome / onboarding text.',
  props: z.strictObject({
    modelValue: z.boolean().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    buttonLabel: z.string().optional(),
    bodyClass: z.string().optional().describe('Classes for the body box, e.g. a bordered "paper" panel.'),
    ui: z.record(z.string(), z.unknown()).optional().describe('Nuxt UI `ui` override for the underlying UModal.'),
  }),
  emits: ['update:modelValue', 'close'],
  slots: ['default'],
})

registerContract({
  name: 'MarkerOverlay',
  description: 'Renders one HTML overlay per item on the map. Put it in the BackgroundMap "overlays" slot.',
  props: z.strictObject({
    items: z.array(z.record(z.string(), z.unknown())).optional(),
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
  }),
  emits: ['files'],
  slots: ['default'],
})

registerContract({
  name: 'FilterSidebar',
  description: 'Slide-in panel with filter sections (checkbox groups, date ranges).',
  props: z.strictObject({
    isVisible: z.boolean().optional(),
    title: z.string().optional(),
    filterSections: z.array(z.object({ title: z.string(), type: z.string() }).passthrough()),
  }),
  emits: ['close', 'reset', 'filter-change', 'download'],
})

registerContract({
  name: 'Toolbar',
  description: 'Vertical tool palette.',
  props: z.strictObject({
    tools: z.array(z.object({ icon: z.string().optional(), tooltip: z.string().optional() }).passthrough()),
  }),
  emits: ['toolClick'],
})

registerContract({
  name: 'DrawingLayer',
  description: 'Map drawing tools (points, lines, polygons). Reads the drawing/sidebar/route-features stores.',
  props: z.strictObject({
    projection: z.string(),
    showAllPlusIcons: z.boolean().optional(),
    enableClick: z.boolean().optional(),
    isMapPage: z.boolean().optional(),
    showDeleteButton: z.boolean().optional(),
    showCommentIcons: z.boolean().optional(),
  }),
  emits: ['toggle-comment-popup', 'toggle-image-upload-popup', 'show-comment-display'],
  stateful: true,
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
  type: z.enum(['text', 'textarea', 'number', 'date', 'time', 'select']).optional(),
  placeholder: z.string().optional(),
  rows: z.number().int().positive().optional(),
  options: z.array(z.strictObject({ label: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
  required: z.boolean().optional(),
  class: z.string().optional(),
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
registerContract({ name: 'Icon', description: 'Nuxt UI icon.', props: z.strictObject({ name: z.string() }), looseProps: true })

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
