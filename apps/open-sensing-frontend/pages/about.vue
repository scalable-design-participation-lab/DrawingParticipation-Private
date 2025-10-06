<template>
  <div v-if="isLoading" class="flex justify-center items-center h-screen">
    Loading...
  </div>
  <div v-else class="flex overflow-hidden flex-col bg-white dark:bg-gray-900">
    <GeneralizedHeader
      class="z-20"
      :left-items="leftItems"
      :right-items="rightItems"
      logo-src="/arboretum_logo.svg"
      logo-alt="Northeastern University Arboretum Logo"
      :show-icon="true"
    />

    <UContainer class="flex-grow max-w-[50rem] p-5 pt-20">
      <UPage>
        <UPageBody prose>
          <Headline
            title="WHO ARE WE ?"
            type="paragraph"
            content="We are a team
        from MIT and Northeastern University working together with Northeastern’s
        Sustainability Initiative, Northeastern’s Arboretum, and Green City Force
        (GCF) in open spaces. Our work helps open spaces, and the Eco-Hubs they're
        part of, produce more food and better serve the our communities."
            image-src="/who_are_we.png"
            image-alt="Illustration of Who We Are"
          />
          <UDivider class="my-10" />

          <Headline
            title="WHAT DO WE MEASURE ? "
            type="paragraph"
            content="We measure humidity, temperature, air quality (a measurement called PMF), sun intensity, soil moisture, and CO2—what we breathe out and plants breathe in. The environmental information that we gather helps us keep our open spaces healthy and make a case for more spaces like these; creating more jobs, food and community."
            image-src="/measure.png"
            image-alt="Illustration of What We Measure"
          />
          <UDivider class="my-10" />

          <Headline
            title="WHERE ARE WE WORKING ? "
            type="paragraph"
            content="We are working in Boston, Oakland, New York City, and Monterrey, Mexico. The sensors at each site help us understand how open spaces and urban farms can work together to promote jobs, clean air, grow community, and food! Our work also helps us understand where the best new open spaces could be."
            image-src="/where.svg"
            image-alt="Illustration of Where"
          />
          <UDivider class="my-10" />

          <Headline
            title="WHAT IS INSIDE ? "
            type="paragraph"
            content="We have co-designed a monitoring system for community open spaces that measures the environment at each site. The system helps us keep track of what sites need water, clean air, or nutrients using different kinds of sensors that you can see here."
            image-src="/what_inside.png"
            image-alt="Illustration of What is Inside"
          />

          <UDivider class="my-10" />

          <Headline
            title="HOW DO WE MEASURE ? "
            type="paragraph"
            content="This is an air sensor, it counts the amount of particles floating in the air using a very tiny fan and a laser! The particies block the laser and get counted. The sensor transmits the readings into electrical pulses that get stored as data and get visualized on our dashboards."
            image-src="/how_measure.png"
            image-alt="Illustration of How We Measure"
          />

          <Reference :items="accordionItems" />
          <MoreInThisSeries :items="moreSeriesItems" :cols="3" />

          <UDivider class="my-10" />
          <div class="grid grid-flow-col-dense">
            <div class="inline-grid">
              <h3>
                <NuxtLink to="/" class="w-1 h-1"> Open Sensing </NuxtLink>
              </h3>
              <div class="flex flex-col">
                <NuxtLink to="/" class="m-0 w-0">Dashboard</NuxtLink>
                <NuxtLink
                  to="https://scalabledesignparticipation.org"
                  class="m-0 w-0"
                >
                  Support
                </NuxtLink>
                <NuxtLink
                  to="https://github.com/scalable-design-participation-lab/open-sensing-frontend"
                  class="m-0 w-0"
                >
                  Github
                </NuxtLink>
              </div>
            </div>
            <div class="inline-grid justify-end">
              <NuxtLink to="https://www.northeastern.edu/">
                <h3>Northeastern University</h3>
              </NuxtLink>
              <NuxtLink to="https://pref.northeastern.edu/arboretum/">
                <img
                  src="/arboretum_logo.svg"
                  alt="Northeastern University Logo"
                  class="dark:invert"
                />
              </NuxtLink>
            </div>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>

    <GeneralizedFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineOptions({
  name: 'AboutPage',
})

const isLoading = ref(true)

const accordionItems = ref<any>([])
const moreSeriesItems = ref<any>([])

onMounted(async () => {
  try {
    // Simulate API calls.
    await Promise.all([loadAccordionItems(), loadMoreSeriesItems()])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

import { useRouter } from 'vue-router'

const router = useRouter()

const leftItems = ref([
  {
    label: 'Open Sensing',
    variant: 'solid',
    color: 'black',
    onClick: () => {
      router.push('/')
    },
  },
  {
    label: 'Northeastern University',
    variant: 'solid',
    color: 'black',
  },
])

const rightItems = ref([])

async function loadAccordionItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  accordionItems.value = [
    {
      label: 'Check back for our manuscript',
      icon: 'i-heroicons-document-text',
      content: 'We are working on a manuscript that will be published soon.',
    },
  ]
}

async function loadMoreSeriesItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  moreSeriesItems.value = [
    {
      title: 'Drawing Participation',
      description:
        'Real-time collaboration for interactive mapping participation with version control',
      icon: 'i-heroicons-question-mark-circle',
      image: 'drawing-participation.jpg',
      link: 'https://scalabledesignparticipation.org/',
    },
    {
      title: 'Restart Ukraine',
      description:
        'Interactive mapping for residents to restore neighborhoods and rivers in Ukraine',
      icon: 'i-heroicons-information-circle',
      image: 'hurtoma.jpg',
      link: 'https://hurtoma.drawing-participation.org/',
    },
    {
      title: 'Reblocking 1 Million Neightborhoods',
      description:
        'Creating parcel data from satellite imagery for data-scarce environments through generative ensemble learning.',
      icon: 'i-heroicons-academic-cap',
      image: 'reblocking.jpg',
      link: 'https://drawing-participation.org/',
    },
  ]
}
</script>
