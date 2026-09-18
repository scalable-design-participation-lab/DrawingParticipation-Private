<script setup lang="ts">
// One symbol of the weather glyph vocabulary (see the legend on /compartir-glifo).
// Every part draws into a 40x40 box so it can be dropped into any layout.
export type Nubes = 'stratus' | 'cirrus' | 'cumulus' | 'cirrocumulus'
export type Lluvia = 'suave' | 'moderada' | 'fuerte'
export type Viento = 'suave' | 'leve' | 'moderada' | 'fuerte'
export type Olor = 'bajo' | 'alto' | 'intermitente'

const props = defineProps<{
  kind: 'nubes' | 'lluvia' | 'viento' | 'olor' | 'temperatura'
  level?: string
  // Temperature only: one circle per 2 °C, five per row.
  celsius?: number
}>()

const windAngle: Record<Viento, number> = { suave: 0, leve: 15, moderada: 55, fuerte: 85 }

const tempCircles = computed(() => {
  const n = Math.max(0, Math.round((props.celsius ?? 0) / 2))
  return Array.from({ length: n }, (_, i) => ({ cx: 5 + (i % 5) * 7.5, cy: 5 + Math.floor(i / 5) * 7.5 }))
})
</script>

<template>
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <template v-if="kind === 'nubes'">
      <path v-if="level === 'stratus'" d="M6 22h28" />
      <path v-else-if="level === 'cirrus'" d="M6 24h24c3 0 4-1 4-4" />
      <path v-else-if="level === 'cumulus'" d="M6 26h28M8 26a12 12 0 0 1 24 0" />
      <path v-else d="M8 10c8-6 12 0 6 6s-2 12 6 6c6-4 10 0 8 6s-8 6-12 0" />
    </template>

    <template v-else-if="kind === 'lluvia'">
      <g stroke-width="2.5">
        <path v-if="level === 'suave'" d="M20 12v16M13 16l14 8M27 16l-14 8" />
        <template v-else-if="level === 'moderada'">
          <path d="M11 12v16M4 16l14 8M18 16L4 24" />
          <path d="M29 12v16M22 16l14 8M36 16l-14 8" />
        </template>
        <template v-else>
          <path d="M11 18v14M5 21l12 8M17 21l-12 8" />
          <path d="M29 18v14M23 21l12 8M35 21l-12 8" />
          <path d="M20 4v12M15 7l10 6M25 7l-10 6" />
        </template>
      </g>
    </template>

    <template v-else-if="kind === 'viento'">
      <g :transform="`rotate(${windAngle[(level as Viento) || 'suave']} 20 34)`">
        <path d="M20 34V8" />
        <path d="M16 8h8" />
        <circle cx="20" cy="34" r="2" fill="currentColor" />
      </g>
    </template>

    <template v-else-if="kind === 'olor'">
      <path v-if="level === 'intermitente'" d="M20 4v32" stroke-dasharray="1 4" stroke-width="3" />
      <template v-else>
        <path d="M20 4c-6 4 6 8 0 12s6 8 0 12 6 8 0 12" />
        <path v-if="level === 'alto'" d="M8 12h6M11 9v6M26 20h6M29 17v6M8 30h6M11 27v6" stroke-width="1.5" />
        <path v-else d="M8 12h6M26 20h6M8 30h6" stroke-width="1.5" />
      </template>
    </template>

    <template v-else>
      <circle v-for="(c, i) in tempCircles" :key="i" :cx="c.cx" :cy="c.cy" r="2.8" stroke-width="1.8" />
    </template>
  </svg>
</template>
