<script setup lang="ts">
import { computed } from 'vue'

/**
 * A reading drawn as a symbol.
 *
 * A glyph is several variables in one mark: a shape picked by value, a count
 * repeated once per unit, a spiral that winds tighter the higher the number.
 * All three are here as data, so what a project's symbols look like lives in
 * its own vocabulary rather than in a component.
 *
 * `shapes` is that vocabulary -- kind -> value -> the strokes to draw, each in
 * its own 40x40 box -- and `parts` says which of them to draw, where, and how
 * the value decides.
 */
export interface Stroke {
  /** SVG path. */
  d?: string
  /** Circle as [cx, cy, r], for a vocabulary made of dots. */
  circle?: [number, number, number]
  width?: number
  /** Dash pattern, e.g. "1 4" for an intermittent mark. */
  dash?: string
  filled?: boolean
}

export interface Part {
  /**
   * How the value is drawn:
   * - `shape` (default): look it up in `shapes[kind]`
   * - `repeat`: one unit shape per `per`, on a grid
   * - `spiral`: turns grow with the value
   * - `ticks`: a scale bar
   * - `text`: the value itself
   */
  mode?: 'shape' | 'repeat' | 'spiral' | 'ticks' | 'text'
  /** Which vocabulary to read, for `shape` and `repeat`. */
  kind?: string
  /** What is being drawn; a `shape` looks this up, the rest compute from it. */
  value?: string | number
  /** Top-left of this part, in the glyph's own coordinates. */
  at?: [number, number]
  /** Box to draw the 40x40 vocabulary into (default 28). */
  size?: number
  /** Printed under the part when `labels` is on. */
  label?: string
  /** Printed beside the value, e.g. "%" or "°C". */
  suffix?: string
  /** `shape`: value -> degrees, for a vocabulary that points somewhere. */
  rotate?: Record<string, number>
  /** `repeat`: which shape is the unit (default "unit"). */
  unit?: string
  /** `repeat`: one unit per this much (default 1), laid out `columns` wide. */
  per?: number
  columns?: number
  step?: number
  /** `spiral` / `ticks`: the geometry of the scale. */
  turns?: [number, number]
  max?: number
  radius?: number
  length?: number
  count?: number
  /** Paint this part in the app's accent rather than the ink colour. */
  accent?: boolean
}

const props = withDefaults(defineProps<{
  shapes?: Record<string, Record<string, Stroke[]>>
  parts?: Part[]
  size?: number
  /** The coordinate space `at` is expressed in. */
  viewBox?: string
  labels?: boolean
}>(), {
  shapes: () => ({}),
  parts: () => [],
  size: 240,
  viewBox: '0 0 160 160',
  labels: false,
})

function strokes(part: Part): Stroke[] {
  // A `repeat` draws one named unit over and over, so the value counts the
  // units rather than choosing the shape.
  const key = part.mode === 'repeat' ? part.unit ?? 'unit' : String(part.value ?? '')
  return props.shapes[part.kind ?? '']?.[key] ?? []
}

function angle(part: Part) {
  return part.rotate?.[String(part.value ?? '')] ?? 0
}

/**
 * `repeat`: one unit per `per`, five to a row unless told otherwise. The grid
 * is measured in the glyph's own coordinates, so the same part can be twelve
 * circles in a corner or fourteen dots down a 400-unit axis.
 */
function units(part: Part) {
  const per = part.per || 1
  const columns = part.columns || 5
  const step = part.step ?? 7.5
  const n = Math.max(0, Math.round(Number(part.value ?? 0) / per))
  return Array.from({ length: n }, (_, i) => ({ x: (i % columns) * step, y: Math.floor(i / columns) * step }))
}

/**
 * `spiral`: an Archimedean spiral whose turns run between the two `turns`
 * numbers as the value runs from 0 to `max`. More of the thing, more winding.
 */
function spiral(part: Part) {
  const [from, to] = part.turns ?? [2, 6]
  const max = part.max || 100
  const radius = part.radius ?? 46
  const turns = from + (Math.min(Number(part.value ?? 0), max) / max) * (to - from)
  const steps = Math.max(8, Math.ceil(turns * 40))
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI
    const r = (i / steps) * radius
    d += `${i === 0 ? 'M' : 'L'}${(50 + r * Math.cos(t)).toFixed(1)} ${(50 + r * Math.sin(t)).toFixed(1)} `
  }
  return d
}

/** `ticks`: a bar with `count` marks along it, for reading the spiral against. */
function ticks(part: Part) {
  const count = part.count ?? 11
  const length = part.length ?? 72
  const gap = count > 1 ? length / (count - 1) : 0
  return Array.from({ length: count }, (_, i) => `M${(50 + i * gap).toFixed(1)} 48.5v3`)
}

const placed = computed(() => props.parts.map(part => ({
  part,
  at: part.at ?? [0, 0],
  box: part.size ?? 28,
})))
</script>

<template>
  <svg :width="size" :height="size" :viewBox="viewBox" fill="none" class="text-black dark:text-white">
    <g v-for="({ part, at, box }, i) in placed" :key="i" :transform="`translate(${at[0]} ${at[1]})`">
      <template v-if="part.mode === 'spiral'">
        <path :d="spiral(part)" :stroke="part.accent ? 'var(--accent)' : 'currentColor'" stroke-width="1.6" />
        <text x="96" y="82" font-size="7" font-weight="bold" fill="currentColor">{{ part.value }}{{ part.suffix }}</text>
      </template>

      <template v-else-if="part.mode === 'ticks'">
        <path :d="`M50 50h${part.length ?? 72}`" stroke="currentColor" stroke-width="0.6" />
        <path v-for="(d, t) in ticks(part)" :key="t" :d="d" stroke="currentColor" stroke-width="0.6" />
      </template>

      <template v-else-if="part.mode === 'text'">
        <text x="0" y="8" font-size="7" font-weight="bold" fill="currentColor">{{ part.value }}{{ part.suffix }}</text>
      </template>

      <!-- One copy of the unit per count, each its own 40x40 box placed on the
           grid; a plain shape is a single box at the origin. The `v-for` sits
           inside the `v-else` template: on one element their order is
           undefined. -->
      <template v-else>
        <svg
          v-for="(unit, u) in (part.mode === 'repeat' ? units(part) : [{ x: 0, y: 0 }])"
          :key="u"
          :x="unit.x"
          :y="unit.y"
          :width="box"
          :height="box"
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <g :transform="angle(part) ? `rotate(${angle(part)} 20 34)` : undefined">
            <template v-for="(stroke, s) in strokes(part)" :key="s">
              <circle
                v-if="stroke.circle"
                :cx="stroke.circle[0]"
                :cy="stroke.circle[1]"
                :r="stroke.circle[2]"
                :stroke-width="stroke.width"
                :fill="stroke.filled ? 'currentColor' : 'none'"
              />
              <path v-else :d="stroke.d" :stroke-width="stroke.width" :stroke-dasharray="stroke.dash" :fill="stroke.filled ? 'currentColor' : 'none'" />
            </template>
          </g>
        </svg>
      </template>

      <text v-if="part.mode !== 'spiral' && part.suffix" :x="4" :y="box + 10" font-size="6" font-weight="bold" fill="currentColor">{{ part.value }}{{ part.suffix }}</text>
      <text v-if="labels && part.label" :x="box / 2" :y="box + (part.suffix ? 18 : 8)" font-size="6" text-anchor="middle" fill="currentColor">{{ part.label }}</text>
    </g>
  </svg>
</template>
