<!--
 * MobileHeader Component
 *
 * Simplified header for the mobile view. Shows only the organization
 * abbreviation ("MNC") centered at the top of the screen.
 -->

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: 'MNC',
  },
  color: {
    type: String,
    default: '#57C9C0',
  },
})
</script>

<template>
  <header class="fixed top-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
    <span class="mnc-title" :style="{ color }">{{ title }}</span>
  </header>
</template>

<style scoped>
.mnc-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 900; 
  font-size: 1.75rem; 
  line-height: 1;
  text-transform: uppercase;
  display: inline-block;

  /* Pulls the letters tightly together */
  letter-spacing: -0.04em;
  font-stretch: condensed;
  -webkit-text-stroke: 4px #ffffff;
  /* Keeps the white outline on the OUTSIDE so the teal stays thick */
  paint-order: stroke fill;
}
</style>