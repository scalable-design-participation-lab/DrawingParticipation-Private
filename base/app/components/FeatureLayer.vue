<script setup lang="ts">
import { computed } from 'vue'
import openIcon from '../assets/icons/open-icon.svg'
import deleteIcon from '../assets/icons/delete.svg'

/**
 * Draw and show map features with nothing hidden: features come in as a
 * prop, a new one goes out through `update:features`, the active draw mode
 * is a prop (`draw`, cleared through `update:draw` after each drawing), icons
 * and labels are data. Goes in the BackgroundMap "layers" slot.
 *
 * Coordinates are in the map projection (EPSG:3857), as OpenLayers gives them.
 */
export interface MapFeature {
  id: number | string
  type: 'Point' | 'LineString' | 'Polygon'
  coordinates: unknown
  iconName?: string
  frequency?: string
  isProhibit?: boolean
  comment?: string
  timestamp?: string
  [key: string]: unknown
}

export interface DrawMode {
  type: 'Point' | 'LineString' | 'Polygon'
  iconName?: string
  frequency?: string
  isProhibit?: boolean
  /** Stroke / point color while drawing. */
  color?: string
}

const props = withDefaults(defineProps<{
  features?: MapFeature[]
  draw?: DrawMode | null
  /** iconName | frequency | "prohibit" -> image URL for points. */
  icons?: Record<string, string>
  /** iconName | frequency | "prohibit" -> human title (in the open / inspect payload). */
  labels?: Record<string, string>
  defaultLabel?: string
  /** Show the "open" (edit) button on every feature. */
  editable?: boolean
  /** Show the delete button on every feature. */
  deletable?: boolean
  /** Show the comment (inspect) icon on every feature. */
  commentIcons?: boolean
  /** Only draw features whose icon key is listed, or true in the map (omit to draw all). */
  visibleTags?: string[] | Record<string, boolean>
  confirmDelete?: string
}>(), {
  features: () => [],
  draw: null,
  icons: () => ({}),
  labels: () => ({}),
  defaultLabel: '',
  editable: false,
  deletable: false,
  commentIcons: false,
  visibleTags: undefined,
  confirmDelete: 'Delete this feature?',
})

const emit = defineEmits<{
  'update:features': [features: MapFeature[]]
  'update:draw': [draw: DrawMode | null]
  /** Edit button pressed: the feature, flat, plus its anchor `position` and `title`. */
  'open': [payload: MapFeature & { position: number[], title: string }]
  /** Comment icon pressed: same payload as `open`. */
  'inspect': [payload: MapFeature & { position: number[], title: string }]
}>()

const key = (f: MapFeature) => (f.isProhibit ? 'prohibit' : f.iconName || f.frequency || '')

const visible = computed(() => {
  const tags = props.visibleTags
  if (!tags) {
    return null
  }
  // A list of tags, or the `{ tag: boolean }` map a checkbox group emits.
  return Array.isArray(tags) ? new Set(tags) : new Set(Object.entries(tags).filter(([, on]) => on).map(([tag]) => tag))
})
const shown = computed(() => (visible.value ? props.features.filter(f => visible.value!.has(key(f))) : props.features))
const points = computed(() => shown.value.filter(f => f.type === 'Point'))
const lines = computed(() => shown.value.filter(f => f.type === 'LineString'))
const polygons = computed(() => shown.value.filter(f => f.type === 'Polygon'))
const iconFor = (f: MapFeature) => props.icons[key(f)] ?? props.icons.default ?? ''
const titleFor = (f: MapFeature) => props.labels[key(f)] ?? props.defaultLabel

/** Where overlays sit: the point, a polygon's centroid, a line's end. */
function anchor(f: MapFeature): number[] {
  if (f.type === 'Point') {
    return f.coordinates as number[]
  }
  if (f.type === 'Polygon') {
    const ring = (f.coordinates as number[][][])[0] ?? []
    return [ring.reduce((s, c) => s + c[0], 0) / (ring.length || 1), ring.reduce((s, c) => s + c[1], 0) / (ring.length || 1)]
  }
  const coords = f.coordinates as number[][]
  return coords[coords.length - 1] ?? [0, 0]
}

const payload = (f: MapFeature) => ({ ...f, position: anchor(f), title: titleFor(f) })

/**
 * What a ToolTips popup can read off the feature. The geometry keys are left
 * out (OpenLayers holds the geometry itself); everything else is the row, so a
 * tooltip can show it without the layer knowing which fields matter.
 */
function properties(f: MapFeature) {
  const { coordinates, type, ...rest } = f
  return rest
}

const drawColor = computed(() => props.draw?.color ?? (props.draw?.type === 'LineString' ? 'red' : 'black'))

function onDrawEnd(event: { feature: { getGeometry: () => { getType: () => string, getCoordinates: () => unknown } } }) {
  const geometry = event.feature.getGeometry()
  const mode = props.draw
  const feature: MapFeature = {
    id: Date.now(),
    type: geometry.getType() as MapFeature['type'],
    coordinates: geometry.getCoordinates(),
    comment: '',
    timestamp: new Date().toISOString(),
    ...(mode?.iconName && { iconName: mode.iconName }),
    ...(mode?.frequency && { frequency: mode.frequency }),
    ...(mode?.isProhibit && { isProhibit: true }),
  }
  emit('update:features', [...props.features, feature])
  emit('update:draw', null)
}

function remove(f: MapFeature) {
  // eslint-disable-next-line no-alert
  if (window.confirm(props.confirmDelete)) {
    emit('update:features', props.features.filter(x => x.id !== f.id))
  }
}
</script>

<template>
  <ol-vector-layer>
    <ol-source-vector>
      <ol-interaction-draw v-if="draw" :type="draw.type" @drawend="onDrawEnd">
        <ol-style>
          <ol-style-stroke :color="drawColor" :width="2" :line-dash="draw.type === 'LineString' ? [6, 6] : undefined" />
          <ol-style-fill :color="[0, 0, 0, 0]" />
          <ol-style-circle :radius="5">
            <ol-style-fill :color="drawColor" />
            <ol-style-stroke :color="drawColor" :width="1" />
          </ol-style-circle>
        </ol-style>
      </ol-interaction-draw>

      <ol-feature v-for="f in points" :key="f.id" :properties="properties(f)">
        <ol-geom-point :coordinates="f.coordinates" />
        <ol-style>
          <ol-style-icon v-if="iconFor(f)" :src="iconFor(f)" :scale="1" :anchor="[0.5, 0.5]" />
          <ol-style-circle v-else :radius="6">
            <ol-style-fill color="black" />
          </ol-style-circle>
        </ol-style>
      </ol-feature>
      <ol-feature v-for="f in polygons" :key="f.id" :properties="properties(f)">
        <ol-geom-polygon :coordinates="f.coordinates" />
        <ol-style>
          <ol-style-stroke color="black" :width="2" :line-dash="[10, 10]" />
          <ol-style-fill :color="[0, 0, 0, 0]" />
        </ol-style>
      </ol-feature>
      <ol-feature v-for="f in lines" :key="f.id" :properties="properties(f)">
        <ol-geom-line-string :coordinates="f.coordinates" />
        <ol-style>
          <ol-style-stroke color="red" :width="2" :line-dash="[6, 6]" />
        </ol-style>
      </ol-feature>
    </ol-source-vector>
  </ol-vector-layer>

  <template v-for="f in shown" :key="`ui-${f.id}`">
    <ol-overlay v-if="editable" :position="anchor(f)" :offset="[0, 0]" :stop-event="false" positioning="top-left">
      <button type="button" class="feature-button" aria-label="open" @click.stop.prevent="emit('open', payload(f))">
        <img :src="openIcon" alt="" class="h-6 w-6">
      </button>
    </ol-overlay>
    <ol-overlay v-if="deletable" :position="anchor(f)" :offset="[-30, -30]" :stop-event="false" positioning="top-left">
      <button type="button" class="feature-button feature-button--bare" aria-label="delete" @click.stop.prevent="remove(f)">
        <img :src="deleteIcon" alt="" class="h-6 w-6">
      </button>
    </ol-overlay>
    <ol-overlay v-if="commentIcons" :position="anchor(f)" :offset="[20, -20]" :stop-event="false" positioning="center-center">
      <button type="button" class="feature-button feature-button--bare" aria-label="comment" @click.stop.prevent="emit('inspect', payload(f))">
        <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="text-lg text-gray-600 hover:text-gray-800" />
      </button>
    </ol-overlay>
  </template>
</template>

<style scoped>
.feature-button {
  cursor: pointer;
  background: white;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  pointer-events: auto;
  transition: transform 0.2s ease;
}
.feature-button--bare {
  background: transparent;
  box-shadow: none;
}
.feature-button:hover {
  transform: scale(1.1);
}
</style>
