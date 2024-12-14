<script setup lang="ts">
import { ref } from 'vue'
// Define header items
const leftHeaderItems = [
  {
    label: 'Drawing',
    to: '/',
    primary: true,
    icon: 'i-heroicons-pencil',
  },
  {
    label: 'Gallery',
    to: '/gallery',
    icon: 'i-heroicons-photo',
  },
]

const rightHeaderItems = [
  {
    label: 'Share',
    icon: 'i-heroicons-share',
    color: 'gray',
    onClick: () => {
      // Add share functionality
      console.log('Share clicked')
    },
  },
  {
    label: 'Save',
    icon: 'i-heroicons-document-arrow-down',
    color: 'gray',
    onClick: () => {
      // Add save functionality
      console.log('Save clicked')
    },
  },
]

// Define toolbar items with tooltips
const toolbarItems = [
  {
    icon: 'i-heroicons-pencil',
    tooltip: 'Pencil Tool',
    action: () => {
      console.log('Pencil selected')
    },
  },
  {
    icon: 'i-heroicons-square-2-stack',
    tooltip: 'Rectangle Tool',
    action: () => {
      console.log('Rectangle selected')
    },
  },
  {
    icon: 'i-heroicons-circle',
    tooltip: 'Circle Tool',
    action: () => {
      console.log('Circle selected')
    },
  },
  {
    icon: 'i-heroicons-arrow-path',
    tooltip: 'Undo',
    action: () => {
      console.log('Undo clicked')
    },
  },
]

// Define footer items
const footerLinks = [
  {
    to: '/about',
    label: 'About',
  },
  {
    to: '/privacy',
    label: 'Privacy',
  },
]

const footerButtons = [
  {
    label: 'Clear Canvas',
  },
  {
    label: 'Download',
  },
]

const footerIcons = [
  {
    name: 'i-heroicons-pencil',
  },
]

// Add activeToolIndex to track current selected tool
const activeToolIndex = ref(0)

// Handle tool selection
function handleToolSelection(index: number) {
  activeToolIndex.value = index
  console.log('Selected tool:', toolbarItems[index].tooltip)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <GeneralizedHeader
      :left-items="leftHeaderItems"
      :right-items="rightHeaderItems"
      show-icon
      shape="rounded"
      class="z-50"
    />

    <!-- Main Content -->
    <main class="pt-24 pb-24 px-6 relative">
      <div class="fixed left-6 top-1/2 -translate-y-1/2 z-30">
        <GenericToolbar
          :tools="toolbarItems"
          @tool-click="handleToolSelection"
        />
      </div>

      <!-- Drawing Canvas Container -->
      <div class="w-full h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg ml-20 relative z-10">
        <!-- Drawing canvas will go here -->
      </div>
    </main>

    <!-- Footer -->
    <GeneralizedFooter
      title="Drawing Tool"
      :links="footerLinks"
      :buttons="footerButtons"
      :icons="footerIcons"
      class="z-40"
    />
  </div>
</template>

<style scoped>
.toolbar-button {
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
