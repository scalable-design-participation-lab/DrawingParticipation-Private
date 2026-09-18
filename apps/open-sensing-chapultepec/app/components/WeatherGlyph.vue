<script setup lang="ts">
import type { Lluvia, Nubes, Olor, Viento } from './GlyphPart.vue'

// The composed glyph: humidity spiral in the middle, one symbol per variable
// around it, laid out like the "EJEMPLO" panel in the Figma.
export interface Reading {
  humedad: number // 0-100 %
  temperatura: number // °C
  nubes: Nubes
  lluvia: Lluvia
  viento: Viento
  olor: Olor
}

const props = withDefaults(defineProps<{
  reading: Reading
  size?: number
  labels?: boolean
  // Only the humidity spiral + scale (legend card).
  spiralOnly?: boolean
}>(), {
  size: 240,
  labels: false,
  spiralOnly: false,
})

// Archimedean spiral: more humidity, more turns. 2 turns at 0 %, 6 at 100 %.
const spiral = computed(() => {
  const turns = 2 + (props.reading.humedad / 100) * 4
  const R = 46
  const steps = Math.ceil(turns * 40)
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI
    const r = (i / steps) * R
    const x = 50 + r * Math.cos(t)
    const y = 50 + r * Math.sin(t)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
  }
  return d
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 160 160" fill="none" class="text-black">
    <!-- humidity spiral + scale (0-100) -->
    <g transform="translate(30 30)">
      <path :d="spiral" stroke="var(--accent)" stroke-width="1.6" />
      <path d="M50 50h72" stroke="currentColor" stroke-width="0.6" />
      <path v-for="i in 11" :key="i" :d="`M${50 + (i - 1) * 7.2} 48.5v3`" stroke="currentColor" stroke-width="0.6" />
      <text x="96" y="82" font-size="7" font-weight="bold" fill="currentColor">{{ reading.humedad }}%</text>
      <text v-if="labels" x="50" y="105" font-size="6" text-anchor="middle" fill="currentColor">HUMEDAD</text>
    </g>

    <template v-if="!spiralOnly">
      <g transform="translate(8 4)">
        <GlyphPart kind="nubes" :level="reading.nubes" width="28" height="28" />
        <text v-if="labels" x="14" y="36" font-size="6" text-anchor="middle" fill="currentColor">NUBES</text>
      </g>
      <g transform="translate(6 50)">
        <GlyphPart kind="lluvia" :level="reading.lluvia" width="24" height="24" />
        <text v-if="labels" x="12" y="32" font-size="6" text-anchor="middle" fill="currentColor">LLUVIA</text>
      </g>
      <g transform="translate(6 100)">
        <GlyphPart kind="viento" :level="reading.viento" width="28" height="28" />
        <text v-if="labels" x="14" y="36" font-size="6" text-anchor="middle" fill="currentColor">VIENTO</text>
      </g>
      <g transform="translate(126 4)">
        <GlyphPart kind="olor" :level="reading.olor" width="28" height="28" />
        <text v-if="labels" x="14" y="36" font-size="6" text-anchor="middle" fill="currentColor">OLOR</text>
      </g>
      <g transform="translate(116 112)">
        <GlyphPart kind="temperatura" :celsius="reading.temperatura" width="40" height="30" />
        <text x="4" y="38" font-size="6" font-weight="bold" fill="currentColor">{{ reading.temperatura }}°C</text>
        <text v-if="labels" x="20" y="46" font-size="6" text-anchor="middle" fill="currentColor">TEMPERATURA</text>
      </g>
    </template>
  </svg>
</template>
