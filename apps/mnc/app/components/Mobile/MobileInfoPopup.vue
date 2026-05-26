<script setup lang="ts">
import { computed } from 'vue'
import type { Feature } from '@base/stores/types/store'
import type { Properties } from '../../stores/types/store'

const props = defineProps<{
  feature: Feature
  state: 'expanded' | 'full'
}>()

const emit = defineEmits<{
  close: []
  'update:state': [state: 'expanded' | 'full']
}>()

const p = computed(() => props.feature.properties as Properties | undefined)

const imagePath = computed(() =>
  p.value?.string_id ? `/Solution_Photos/${p.value.string_id}/1.png` : null,
)

const parsedLinks = computed(() => {
  if (!p.value?.links) return []
  return p.value.links
    .split(';')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({ label: l, url: '' }))
})

function toggleState() {
  emit('update:state', props.state === 'expanded' ? 'full' : 'expanded')
}
</script>

<template>
  <div
    class="fixed left-0 right-0 z-40 flex justify-center pointer-events-none transition-all duration-300"
    :class="state === 'full' ? 'bottom-4 px-4' : 'bottom-24'"
  >
    <!-- Expanded state: compact summary card -->
    <UCard
      v-if="state === 'expanded'"
      class="pointer-events-auto w-full max-w-sm shadow-xl transition-all duration-300"
      style="max-height: 45vh;"
      :ui="{
        base: 'overflow-hidden',
        rounded: 'rounded-t-3xl rounded-b-none',
        body: { padding: 'p-0' },
        header: { padding: 'px-0 pt-3 pb-1' },
        footer: { padding: 'p-0' },
      }"
    >
      <template #header>
        <div class="flex justify-center cursor-pointer" @click="toggleState">
          <div class="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      </template>

      <div class="px-5 py-4">
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style="
              border: 2.5px solid transparent;
              background-image: linear-gradient(white, white),
                linear-gradient(135deg, #57C9C0, #84e8a0, #f9d876);
              background-origin: border-box;
              background-clip: padding-box, border-box;
            "
          >
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-teal-500" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-bold text-gray-900 text-sm leading-tight">{{ feature.comment }}</p>
            <p class="text-xs text-teal-500 mt-1 font-medium">Task 1</p>
            <p class="text-xs text-gray-500 mt-2 line-clamp-3">
              {{ p?.shortDesc || p?.description }}
            </p>
          </div>
        </div>

        <UButton
          variant="ghost"
          color="gray"
          size="xs"
          class="w-full mt-4 justify-center text-gray-400"
          @click="toggleState"
        >
          Tap to expand
        </UButton>
      </div>
    </UCard>

    <!-- Full state: themed teal popup matching design spec -->
    <div
      v-else
      class="pointer-events-auto w-full max-w-sm rounded-3xl border-[3px] border-white shadow-2xl overflow-hidden flex flex-col"
      style="background-color: #5FC5BD; max-height: 85vh;"
    >
      <!-- Drag handle to collapse -->
      <div class="flex justify-center pt-2 pb-1 cursor-pointer flex-shrink-0" @click="toggleState">
        <div class="w-10 h-1 bg-white/50 rounded-full" />
      </div>

      <div class="overflow-y-auto px-6 pb-6 pt-2 space-y-4">
        <!-- Title -->
        <h2 class="text-2xl font-bold text-white leading-tight">
          {{ feature.comment }}
        </h2>

        <!-- Date pill -->
        <div v-if="p?.date" class="flex items-center gap-3 flex-wrap">
          <span class="border-2 border-white rounded-full px-4 py-1 text-sm text-white font-medium whitespace-nowrap">
            Date published:
          </span>
          <span class="text-white text-sm">{{ p?.date }}</span>
        </div>

        <!-- Location pill -->
        <div v-if="p?.location" class="flex items-center gap-3 flex-wrap">
          <span class="border-2 border-white rounded-full px-4 py-1 text-sm text-white font-medium whitespace-nowrap">
            Location:
          </span>
          <span class="text-white text-sm">{{ p?.location }}</span>
        </div>

        <!-- Description pill + text -->
        <div v-if="p?.description">
          <span class="inline-block border-2 border-white rounded-full px-4 py-1 text-sm text-white font-medium">
            Description:
          </span>
          <p class="text-white text-sm leading-relaxed mt-3">{{ p?.description }}</p>
        </div>

        <!-- Image with white border + Tap to learn more overlay -->
        <div
          v-if="imagePath"
          class="relative rounded-2xl overflow-hidden border-2 border-white"
          style="height: 200px;"
        >
          <img
            :src="imagePath"
            :alt="feature.comment"
            class="w-full h-full object-cover"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div class="absolute inset-0 flex items-center justify-center bg-black/25">
            <span class="text-white text-base font-bold drop-shadow-md">Tap to learn more</span>
          </div>
        </div>

        <!-- Links -->
        <div v-if="parsedLinks.length">
          <p class="text-sm font-bold text-white mb-2">Learn More:</p>
          <ul class="space-y-1">
            <li v-for="(link, i) in parsedLinks" :key="i" class="flex items-center gap-2">
              <UIcon name="i-heroicons-link" class="w-3 h-3 text-white flex-shrink-0" />
              <span class="text-white text-xs">{{ link.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
