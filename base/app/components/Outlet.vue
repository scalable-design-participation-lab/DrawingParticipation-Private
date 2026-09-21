<script setup lang="ts">
import { inject } from 'vue'
import type { RootSpec } from '../contracts/spec'
import { OUTLET_SPEC } from '../utils/outlet'
import SpecRenderer from './SpecRenderer.vue'

/** Where the current page renders inside a shell spec. */
// A ComputedRef; the template unwraps it, so `page` below is the spec itself.
const page = inject(OUTLET_SPEC)
</script>

<template>
  <SpecRenderer v-if="page" :key="page.children.length" :spec="page as RootSpec" />
</template>
