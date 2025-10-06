<template>
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000]"
  >
    <div
      class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-xl font-semibold mb-4 text-center">Select a Location</h2>

      <ul class="space-y-2 max-h-64 overflow-y-auto">
        <li
          v-for="loc in locations"
          :key="loc.value"
          @click="$emit('select', [loc.location[0], loc.location[1]])"
          class="cursor-pointer px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {{ loc.label }}
        </li>
      </ul>

      <button
        @click="$emit('close')"
        class="mt-6 w-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline text-center"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  locations: { label: string; value: string; location: number[] }[]
}>()

defineEmits<{
  (e: 'select', value: [number, number]): void
  (e: 'close'): void
}>()
</script>
