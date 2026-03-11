<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-xl">
      <!-- Gradient Header with Close Button -->
      <div class="relative bg-gradient-to-r from-teal-300 via-green-200 to-yellow-200 p-6 rounded-t-3xl">
        <button
          @click="$emit('close')"
          class="absolute top-4 left-4 flex items-center gap-2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full px-4 py-2 transition-all"
        >
          <span class="text-xl font-bold text-teal-600">X</span>
          <span class="text-sm text-teal-600">Close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-8 pt-6">
        <!-- Title and Image Row -->
        <div class="flex gap-6 mb-6">
          <div class="flex-1">
            <h2 class="text-3xl font-bold text-teal-500 mb-4">
              {{ title }}
            </h2>
            
            <!-- Date and Location Pills -->
            <div class="flex flex-wrap gap-2 mb-4">
              <div class="bg-teal-400 text-white rounded-full px-4 py-1 text-sm">
                Date published: {{ datePublished }}
              </div>
              <div class="bg-teal-400 text-white rounded-full px-4 py-1 text-sm">
                Location: {{ location }}
              </div>
            </div>
          </div>

          <!-- Image Box -->
          <div class="w-52 h-44 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img v-if="image" :src="image" :alt="title" class="w-full h-full object-cover rounded-2xl" />
            <span v-else class="text-teal-300 text-sm">{{caption}}</span>
          </div>

        </div>

        <!-- Description Section -->
        <div class="mb-6">
          <div class="relative">
            <div class="absolute -top-3 left-4 bg-teal-400 text-white rounded-full px-4 py-1 text-sm font-medium">
              Description
            </div>
            <div class="border-2 border-teal-300 rounded-2xl p-6 pt-8">
              <p :class="['text-gray-600 text-sm', { 'line-clamp-3': !descriptionExpanded }]">
                {{ description }}
              </p>
              <button
                v-if="description && description.split(' ').length > 50"
                @click="descriptionExpanded = !descriptionExpanded"
                class="mt-2 text-teal-500 text-sm hover:underline float-right"
              >
                {{ descriptionExpanded ? 'Read Less...' : 'Read More...' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Connection to Mobile Networked Creativity Section -->
        <div class="mb-6">
          <div class="relative">
            <div class="absolute -top-3 left-4 bg-teal-400 text-white rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap">
              Connection to Mobile Networked Creativity
            </div>
            <div class="border-2 border-teal-300 rounded-2xl p-6 pt-8">
              <p :class="['text-gray-600 text-sm', { 'line-clamp-3': !connectionExpanded }]">
                {{ connection }}
              </p>
              <button
                v-if="connection && connection.split(' ').length > 50"
                @click="connectionExpanded = !connectionExpanded"
                class="mt-2 text-teal-500 text-sm hover:underline float-right"
              >
                {{ connectionExpanded ? 'Read Less...' : 'Read More...' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Learn More Section -->
        <div>
          <h3 class="text-xl font-bold text-teal-500 mb-3">Learn More:</h3>
          <div class="grid grid-cols-2 gap-x-8 gap-y-1">
            <div v-for="(link, index) in links" :key="index" class="flex items-center gap-2">
              <span class="text-teal-500">•</span>
              <a
                v-if="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-teal-500 hover:underline text-sm"
              >
                {{ link.label }}
              </a>
              <span v-else class="text-teal-300 text-sm">{{ link.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Link {
  label: string
  url?: string
}

interface Props {
  title?: string
  datePublished?: string
  location?: string
  image?: string
  caption?: string
  description?: string
  connection?: string
  links?: Link[]
}

withDefaults(defineProps<Props>(), {
  title: 'Title',
  datePublished: '',
  location: '',
  image: '',
  caption: '',
  description: 'Text (50 words)',
  connection: 'Text (50 words)',
  links: () => [
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
    { label: 'Link __________' },
  ],
})

defineEmits<{
  close: []
}>()

const descriptionExpanded = ref(false)
const connectionExpanded = ref(false)
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
