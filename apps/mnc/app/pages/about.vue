<template>
  <div v-if="isLoading" class="flex justify-center items-center h-screen">
    Loading...
  </div>
  <div v-else class="leading-tight mb-24">
    <GeneralizedHeader
      :left-items="headerLinks"
    />

    <div class="mt-48 md:w-9/12 md:max-w-[1100px] px-7">
        <img src="/hurtoma-river-01.jpg" alt="" class="w-full rounded-md">
        <h1 class="mt-12 mb-2 text-3xl">MNC</h1>
        <div class="md:w-9/12 space-y-2">
          <p>about</p>
        </div>
        <div class="flex space-x-2 mt-6">
          <UButton
        class="my-2 py-3 px-6 rounded-full flex place-self-start hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        color="black"
        to="/"
      >
      A button
      </UButton>
        </div>
          
    </div>

    <UDivider class="mt-24 mb-8" />

    <div class="px-7 md:flex space-y-3 md:space-x-6 md:space-y-0">
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl pb-32">
        <h2 class="font-semibold text-xl mb-2">card 1</h2>
        <p class="text-sm leading-tight">...</p>
      </div>
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl">
        <h2 class="font-semibold text-xl mb-2">card 2</h2>
        <p class="text-sm leading-tight">...</p>
      </div>
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl">
        <h2 class="font-semibold text-xl mb-2">card 3</h2>
        <p class="text-sm leading-tight">...</p>
      </div>
    </div>

    <UDivider class="mt-24 mb-8" />

    <div class="px-7 md:w-9/12 md:max-w-[1100px]">
      <h2 class="mt-12 mb-2 text-3xl">section 2</h2>
      <div class="md:w-9/12 space-y-2 mb-8">
        <p>...</p>
      </div>
      <img src="/hurtoma-river-02.jpg" alt="" class="w-7/12 rounded-md">
    </div>

    <UDivider class="mt-24 mb-8" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isLoading = ref(true)
const headerLinks = ref([
  { label: 'Back to Map', color: 'black', to: '/' },
])
const whyContent = ref('')
const secondaryContent = ref('')
const tertiaryContent = ref('')
const tabItems = ref([])
const accordionItems = ref([])
const moreSeriesItems = ref([])

onMounted(async () => {
  try {
    // Simulate API calls
    await Promise.all([
      loadContent(),
      loadTabItems(),
      loadAccordionItems(),
      loadMoreSeriesItems(),
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

async function loadContent() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  whyContent.value = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris erat nisl, maximus et mollis vitae, vulputate vitae tortor. Nunc sed tortor mauris. Aliquam volutpat convallis nulla. Nullam in est sed purus efficitur condimentum eu eget mi. Cras consectetur semper magna eget luctus. Maecenas non elit non mauris varius tempor. Duis placerat luctus fringilla. Sed sit amet nisi a nunc aliquet tincidunt in eget erat. Curabitur quis dolor ac dui volutpat condimentum. Ut feugiat diam sit amet pharetra ultricies. Praesent et posuere nunc. Quisque pharetra facilisis commodo. Etiam id nibh scelerisque, pulvinar sapien a, tempor dolor. Donec suscipit efficitur lacus, vel convallis ligula pellentesque sed. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;`

  secondaryContent.value = `Quisque consequat diam dui, nec accumsan arcu laoreet a. Sed bibendum neque purus, ac interdum erat posuere dapibus. Quisque commodo felis at posuere imperdiet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam elementum, arcu id sagittis venenatis, eros nibh ornare ex, eu mollis nunc lectus dictum sem. Quisque eget laoreet elit. Sed egestas sodales odio, at euismod est pharetra non. Nam dui leo, mattis id convallis aliquet, fermentum sed quam. In porttitor, eros id iaculis sollicitudin, tellus augue fringilla nulla, eget suscipit justo sapien convallis erat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam accumsan et magna et molestie.`

  tertiaryContent.value = `Donec pharetra lacus nisl, in pulvinar ante auctor non. Fusce fermentum metus sit amet neque malesuada, eu interdum diam consequat. Phasellus felis tortor, dictum ut augue non, placerat interdum libero. Quisque vitae mollis lectus, pellentesque aliquam urna. Mauris tincidunt aliquet fringilla. Nam malesuada mollis vestibulum. Curabitur malesuada erat sed imperdiet ultrices. Sed nibh turpis, porttitor ut semper eu, ornare eget quam. Nulla facilisi. Ut porta at elit in tempus. Sed quis dapibus eros, eu cursus ipsum. Nam eu libero rutrum, tincidunt nunc at, semper nisl. Sed ullamcorper massa nec est faucibus laoreet. Aliquam erat volutpat.`
}

async function loadTabItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  tabItems.value = [
    {
      label: 'Diagram 1',
      icon: 'i-heroicons-chart-bar',
      content: 'Content for Diagram 1',
    },
    {
      label: 'Diagram 2',
      icon: 'i-heroicons-chart-pie',
      content: 'Content for Diagram 2',
    },
    {
      label: 'Diagram 3',
      icon: 'i-heroicons-chart-square-bar',
      content: 'Content for Diagram 3',
    },
    {
      label: 'Diagram 4',
      icon: 'i-heroicons-presentation-chart-line',
      content: 'Content for Diagram 4',
    },
  ]
}

async function loadAccordionItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  accordionItems.value = [
    {
      label: 'Reference 1',
      icon: 'i-heroicons-document-text',
      content:
        'Phasellus felis tortor, dictum ut augue non, placerat interdum libero. Quisque vitae mollis lectus, pellentesque aliquam urna.',
    },
    {
      label: 'Reference 2',
      icon: 'i-heroicons-document-text',
      content:
        'Mauris tincidunt aliquet fringilla. Nam malesuada mollis vestibulum. Curabitur malesuada erat sed imperdiet ultrices.',
    },
    {
      label: 'Reference 3',
      icon: 'i-heroicons-document-text',
      content:
        'Sed nibh turpis, porttitor ut semper eu, ornare eget quam. Nulla facilisi. Ut porta at elit in tempus.',
    },
  ]
}

async function loadMoreSeriesItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  moreSeriesItems.value = [
    {
      title: 'Why',
      description: 'Explore the reasons behind our project',
      icon: 'i-heroicons-question-mark-circle',
    },
    {
      title: 'What',
      description: 'Discover what our project offers',
      icon: 'i-heroicons-information-circle',
    },
    {
      title: 'How',
      description: 'Learn how to use our tools effectively',
      icon: 'i-heroicons-academic-cap',
    },
  ]
}
</script>
