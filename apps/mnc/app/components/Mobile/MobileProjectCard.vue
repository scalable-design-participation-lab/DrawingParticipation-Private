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
    :class="state === 'full' ? 'bottom-0' : 'bottom-24'"
  >
    <UCard
      class="pointer-events-auto w-full max-w-sm shadow-xl transition-all duration-300"
      :style="state === 'full' ? 'max-height: 85vh;' : 'max-height: 45vh;'"
      :ui="{
        base: 'overflow-hidden',
        rounded: 'rounded-t-3xl rounded-b-none',
        body: { padding: 'p-0' },
        header: { padding: 'px-0 pt-3 pb-1' },
        footer: { padding: 'p-0' },
      }"
    >
      <!-- Handle — tap to expand/collapse -->
      <template #header>
        <div class="flex justify-center cursor-pointer" @click="toggleState">
          <div class="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      </template>

      <!-- Expanded state: compact summary -->
      <div v-if="state === 'expanded'" class="px-5 py-4">
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

      <!-- Full state: all project details -->
      <div v-else class="overflow-y-auto" style="max-height: calc(85vh - 28px);">
        <!-- Gradient header -->
        <div class="bg-gradient-to-r from-teal-300 via-green-200 to-yellow-200 px-5 py-5">
          <h2 class="text-xl font-bold text-white drop-shadow-sm leading-tight">
            {{ feature.comment }}
          </h2>
        </div>

        <div class="px-5 py-4 space-y-4">
          <!-- Date + Location pills -->
          <div class="flex flex-wrap gap-2">
            <span class="bg-teal-400 text-white rounded-full px-3 py-1 text-xs font-medium">
              Date published: {{ p?.date }}
            </span>
            <span class="bg-teal-400 text-white rounded-full px-3 py-1 text-xs font-medium">
              Location: {{ p?.location }}
            </span>
          </div>

          <!-- Description -->
          <div class="relative">
            <div class="absolute -top-3 left-3 bg-teal-400 text-white rounded-full px-3 py-0.5 text-xs font-medium">
              Description
            </div>
            <div class="border-2 border-teal-200 rounded-2xl p-4 pt-5">
              <p class="text-gray-600 text-xs leading-relaxed">{{ p?.description }}</p>
            </div>
          </div>

          <!-- Image thumbnail -->
          <div
            v-if="imagePath"
            class="relative rounded-2xl overflow-hidden bg-teal-50"
            style="height: 140px;"
          >
            <img
              :src="imagePath"
              :alt="feature.comment"
              class="w-full h-full object-cover"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/40 to-transparent">
              <span class="text-white text-xs font-medium">Tap to learn more</span>
            </div>
          </div>

          <!-- Links -->
          <div v-if="parsedLinks.length">
            <p class="text-sm font-bold text-teal-500 mb-2">Learn More:</p>
            <ul class="space-y-1">
              <li v-for="(link, i) in parsedLinks" :key="i" class="flex items-center gap-2">
                <UIcon name="i-heroicons-link" class="w-3 h-3 text-teal-500 flex-shrink-0" />
                <span class="text-teal-500 text-xs">{{ link.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </UCard>
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
