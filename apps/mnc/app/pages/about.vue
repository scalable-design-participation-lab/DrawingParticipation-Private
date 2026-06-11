<template>
  <div class="leading-relaxed mb-24">
    <GeneralizedHeader :left-items="headerLinks" />

    <div class="mx-auto mt-40 w-full max-w-[1100px] px-7">
      <!-- Hero -->
      <p class="text-sm font-medium uppercase tracking-widest text-teal-600">
        Mobile Networked Creativity
      </p>
      <h1 class="mt-3 text-4xl font-bold leading-tight md:text-5xl">
        How communities reinvent technology to meet their own needs
      </h1>
      <p class="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
        An interactive atlas of real-world examples — from motorcycle taxis in
        the Philippines to a book written entirely over WhatsApp — of how people
        creatively adapt mobile and networked technology to the realities of
        their place and moment.
      </p>
      <div class="mt-8">
        <UButton
          to="/"
          color="black"
          class="rounded-full px-6 py-3 hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        >
          Explore the map
        </UButton>
      </div>
    </div>

    <UDivider class="mt-20 mb-12" />

    <!-- What is MNC -->
    <div class="mx-auto w-full max-w-[1100px] px-7 md:flex md:gap-12">
      <h2 class="mb-4 shrink-0 text-3xl font-semibold md:w-64">
        What is Mobile Networked Creativity?
      </h2>
      <div class="max-w-2xl space-y-4 text-gray-600 dark:text-gray-300">
        <p>
          Mobile Networked Creativity (MNC) is not only about the final product
          or device. It is also about the micro-process of creation — the
          network of relationships developed among people and technologies in a
          particular space and time.
        </p>
        <p>
          Across the world, communities — often in resource-constrained or
          crisis settings — combine everyday objects, mobile devices, and
          networks to solve problems that formal systems leave unmet. This
          project collects those stories on a single map so they can be
          explored, compared, and added to.
        </p>
      </div>
    </div>

    <UDivider class="mt-20 mb-12" />

    <!-- Themes -->
    <div class="mx-auto w-full max-w-[1100px] px-7">
      <h2 class="mb-8 text-3xl font-semibold">Themes you can explore</h2>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="theme in themes"
          :key="theme.title"
          class="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700"
        >
          <UIcon :name="theme.icon" class="mb-3 h-7 w-7 text-teal-600" />
          <h3 class="mb-1 text-lg font-semibold">{{ theme.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ theme.description }}
          </p>
        </div>
      </div>
    </div>

    <UDivider class="mt-20 mb-12" />

    <!-- Participate -->
    <div class="mx-auto w-full max-w-[1100px] px-7 md:flex md:gap-12">
      <h2 class="mb-4 shrink-0 text-3xl font-semibold md:w-64">
        Add your own example
      </h2>
      <div class="max-w-2xl space-y-4 text-gray-600 dark:text-gray-300">
        <p>
          Know an example we are missing, or have a photo of one already on the
          map? Open any case study and use “Add photo or comment” to contribute
          your own images and reflections.
        </p>
        <UButton
          to="/"
          color="black"
          class="rounded-full px-6 py-3 hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        >
          Start contributing
        </UButton>
      </div>
    </div>

    <UDivider class="mt-20 mb-8" />

    <p class="mx-auto w-full max-w-[1100px] px-7 text-sm text-gray-500">
      Mobile Networked Creativity is a project of the Scalable Design
      Participation Lab at Northeastern University.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const headerLinks = ref([
  { label: 'Back to Map', color: 'black', to: '/' },
])

// The five primary tags used to categorize case studies on the map.
const themes = ref([
  {
    title: 'Transportation & Mobility',
    icon: 'i-heroicons-truck',
    description: 'Improvised vehicles and transit that keep people and goods moving.',
  },
  {
    title: 'Health & Crisis Response',
    icon: 'i-heroicons-heart',
    description: 'Mobile care and rapid responses where formal services fall short.',
  },
  {
    title: 'Digital Access & Connectivity',
    icon: 'i-heroicons-wifi',
    description: 'Grassroots ways of getting communities online and connected.',
  },
  {
    title: 'Community Mapping & Visibility',
    icon: 'i-heroicons-map-pin',
    description: 'Making overlooked places and people visible on the map.',
  },
  {
    title: 'Art & Cultural Expression',
    icon: 'i-heroicons-paint-brush',
    description: 'Creative and cultural practices carried through mobile networks.',
  },
])
</script>
