<script setup lang="ts">
// Right panel of /compartir-glifo: the axes where a visitor composes their glyph.
// ponytail: static drawing only; drag-and-drop of legend parts comes later.
</script>

<template>
  <svg viewBox="0 0 600 420" class="h-full w-full text-black" fill="none" stroke="currentColor">
    <!-- vertical dotted axis -->
    <circle v-for="i in 14" :key="`v${i}`" cx="300" :cy="30 + (i - 1) * 27" r="1.2" fill="currentColor" stroke="none" />
    <!-- horizontal dotted axis (left) + humidity scale (right) -->
    <circle v-for="i in 7" :key="`h${i}`" :cx="90 + (i - 1) * 30" cy="210" r="1.2" fill="currentColor" stroke="none" />
    <path d="M300 210h250" stroke-width="1" />
    <g font-size="7" fill="currentColor" stroke="none">
      <template v-for="i in 11" :key="`t${i}`">
        <path :d="`M${300 + (i - 1) * 25} 207v6`" stroke="currentColor" stroke-width="1" />
        <text :x="300 + (i - 1) * 25" y="222" text-anchor="middle">{{ (i - 1) * 10 }}</text>
      </template>
    </g>

    <g font-size="8" fill="currentColor" stroke="none">
      <text x="40" y="120">NUBES</text>
      <text x="40" y="240">LLUVIA</text>
      <path d="M40 300h20" stroke="currentColor" stroke-width="2.5" />
      <text x="40" y="360">VIENTO</text>
      <text x="530" y="190">OLOR</text>
      <text x="300" y="395" text-anchor="middle">HUMEDAD _____</text>
      <text x="500" y="378">TEMPERATURA _____</text>
    </g>
  </svg>
</template>
