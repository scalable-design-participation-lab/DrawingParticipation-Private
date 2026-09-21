<!--
 * Stands in for an OpenLayers tag under vitest. `stubs: { 'ol-x': true }`
 * swallows the slot, so a test that asserts on what a layer renders inside
 * stubs with this instead.
-->
<template>
  <div><slot /></div>
</template>
