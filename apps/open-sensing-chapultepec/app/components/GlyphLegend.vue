<script setup lang="ts">
// Left panel of /compartir-glifo: worked example + the six legend cards.
import type { Reading } from './WeatherGlyph.vue'

const ejemplo: Reading = {
  humedad: 61.5,
  temperatura: 24,
  nubes: 'cirrocumulus',
  lluvia: 'moderada',
  viento: 'leve',
  olor: 'alto',
}

const cards = [
  { title: 'Lluvia', kind: 'lluvia', levels: ['suave', 'moderada', 'fuerte'] },
  { title: 'Viento', kind: 'viento', levels: ['suave', 'leve', 'moderada', 'fuerte'] },
  { title: 'Nubes', kind: 'nubes', levels: ['stratus', 'cirrus', 'cumulus', 'cirrocumulus'], names: ['Stratus', 'Cirrus', 'Cumulus', 'Cirro cumulus'] },
  { title: 'Olor', kind: 'olor', levels: ['bajo', 'alto', 'intermitente'] },
] as const
</script>

<template>
  <section class="panel flex flex-col gap-4 p-4">
    <div>
      <div class="panel flex justify-center py-2">
        <WeatherGlyph :reading="ejemplo" :size="300" labels />
      </div>
      <p class="label mt-1">
        Ejemplo
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- Humedad: spiral + scale, its own card so the % reads clearly -->
      <div>
        <p class="label mb-1">
          Humedad
        </p>
        <div class="panel flex items-center justify-center p-2">
          <WeatherGlyph :reading="{ ...ejemplo, humedad: 28 }" :size="130" spiral-only />
        </div>
      </div>

      <div v-for="card in cards" :key="card.title">
        <p class="label mb-1">
          {{ card.title }}
        </p>
        <div class="panel flex items-end justify-around gap-2 p-3">
          <div v-for="(level, i) in card.levels" :key="level" class="flex flex-col items-center gap-2">
            <GlyphPart :kind="card.kind" :level="level" class="h-9 w-9" />
            <span class="label text-center text-[9px] leading-tight">{{ 'names' in card ? card.names[i] : level }}</span>
          </div>
        </div>
      </div>

      <div>
        <p class="label mb-1">
          Temperatura
        </p>
        <div class="panel p-3">
          <p class="label mb-1 flex items-center gap-1">
            <GlyphPart kind="temperatura" :celsius="2" class="h-4 w-4" /> = 2°C
          </p>
          <div class="flex flex-col items-center">
            <GlyphPart kind="temperatura" :celsius="24" class="h-12 w-16" />
            <span class="label text-[9px]">24°C</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
