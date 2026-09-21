<script setup lang="ts">
import { computed, onMounted, provide } from 'vue'
import type { RootSpec } from '../contracts/spec'
import { useAppManifest } from '../composables/useAppManifest'
import { OUTLET_SPEC } from '../utils/outlet'
import SpecRenderer from './SpecRenderer.vue'
import { useColorMode, useRoute } from '#imports'

/**
 * The route component every manifest route points at (see nuxt.config
 * `pages:extend`). Looks the current path up in the manifest's route table,
 * renders that page spec, wrapped in the shell spec when there is one.
 */
const route = useRoute()
const { manifest, specs } = useAppManifest()

// "/about/" and "/about" are the same route.
const path = computed(() => route.path.replace(/\/+$/, '') || '/')
const file = computed(() => manifest?.routes[path.value])
const page = computed(() => (file.value ? specs[file.value] : undefined))
const shell = computed(() => (manifest?.shell ? specs[manifest.shell] : undefined))

// The shell's <Outlet> reads this.
provide(OUTLET_SPEC, page)

/**
 * The manifest's colorMode is the app's default, not a standing order: a
 * reader who pressed the header's light/dark button has a stored preference,
 * and forcing the manifest value on every page mount would undo it on the next
 * navigation, making the button look broken.
 */
onMounted(() => {
  const wanted = manifest?.theme?.colorMode
  if (!wanted) {
    return
  }
  let chosen = false
  try {
    chosen = localStorage.getItem('nuxt-color-mode') !== null
  }
  catch { /* private mode: treat as no stored preference */ }
  if (!chosen) {
    useColorMode().preference = wanted
  }
})

const missing = computed(() => (file.value ? `Spec "${file.value}" not found under specs/` : `No route for "${path.value}" in app.json`))
</script>

<template>
  <div class="h-full">
    <p v-if="!page" class="p-6 text-red-600">
      {{ missing }}
    </p>
    <SpecRenderer v-else-if="shell" :key="path" :spec="shell as RootSpec" />
    <SpecRenderer v-else :key="path" :spec="page as RootSpec" />
  </div>
</template>
