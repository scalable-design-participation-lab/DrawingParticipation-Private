<script setup lang="ts">
/**
 * Nuxt UI accordion whose panels come from slots `item-0`, `item-1`, … so a
 * spec can put any nodes inside each item.
 */
withDefaults(defineProps<{
  items: { label: string, defaultOpen?: boolean }[]
  multiple?: boolean
}>(), {
  multiple: false,
})
</script>

<template>
  <UAccordion :items="items" :multiple="multiple" color="white" variant="solid" class="space-y-1.5">
    <template #item="{ index }">
      <slot :name="`item-${index}`" />
    </template>
  </UAccordion>
</template>
