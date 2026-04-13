<!--
 * GeneralizedHeader Component
 *
 * This component renders a customizable header with logo, navigation items,
 * and action buttons. It's designed to be used across different pages of the application
 * and supports responsive design.
 *
 * @displayName GeneralizedHeader
 * @usage
 * <GeneralizedHeader
 *   :leftItems="navItems"
 *   :rightItems="actionItems"
 *   logoSrc="/logo.png"
 *   logoAlt="Company Logo"
 *   :showIcon="true"
 *   shape="rounded"
 * />
 -->

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * Props for the GeneralizedHeader component
 * @typedef {object} GeneralizedHeaderProps
 * @property {Array<{label: string, to?: string, onClick?: Function, variant?: string, color?: string, icon?: string, primary?: boolean}>} leftItems - Items for the left side of the header
 * @property {Array<{label: string, to?: string, onClick?: Function, variant?: string, color?: string, icon?: string, dropdown?: object}>} rightItems - Items for the right side of the header
 * @property {string} [logoSrc] - Source URL for the logo image
 * @property {string} [logoLink] - Link URL for the logo image
 * @property {string} [logoAlt='Logo'] - Alt text for the logo image
 * @property {string} [primaryAccentColor] - Optional text/icon color for all header buttons
 * @property {boolean} [showIcon=true] - Whether to show the icon
 * @property {'rounded' | 'rectangular'} [shape='rounded'] - Shape of the buttons and logo
 */

/**
 * Component props
 * @type {GeneralizedHeaderProps}
 */
const props = defineProps({
  leftItems: {
    type: Array,
    default: () => [],
  },
  rightItems: {
    type: Array,
    default: () => [],
  },
  logoLink: {
    type: String,
    default: '',
  },
  logoSrc: {
    type: String,
    default: '',
  },
  logoAlt: {
    type: String,
    default: 'Logo',
  },
  primaryAccentColor: {
    type: String,
    default: '',
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
  shape: {
    type: String,
    default: 'rounded',
    validator: (value: string) => ['rounded', 'rectangular'].includes(value),
  },
  z: {
    type: [String, Number],
    default: 50,
  },
})

// Add new refs for modals
const showMenuModal = ref(false)

// Add menu select handler
function handleMenuSelect(action: string) {
  switch (action) {
    case 'help':
      // Add help logic
      break
    case 'settings':
      // Add settings logic
      break
  }
}

/**
 * Computed property to determine the shape class
 * @type {import('vue').ComputedRef<string>}
 */
const shapeClass = computed(() => {
  switch (props.shape) {
    case 'rectangular':
      return 'rounded-2xl'
    case 'rounded':
    default:
      return 'rounded-full'
  }
})

const hasPrimaryAccentColor = computed(() => Boolean(props.primaryAccentColor))

const accentTextStyle = computed(() => {
  if (!hasPrimaryAccentColor.value) {
    return undefined
  }

  return { color: props.primaryAccentColor }
})
</script>

<template>
  <div class="relative">
    <header
      class="h-10 lg:h-12 fixed top-6 left-6 right-6 flex justify-between bg-transparent"
      :class="[`z-${z}`]"
    >
      <!-- items left -->
      <div class="h-full flex space-x-2 sm:space-x-3 relative">
        <UButton
          v-if="showIcon"
          class="w-10 lg:w-12 text-xl sm:text-2xl !rounded-lg flex justify-center !bg-gray-50 dark:!bg-black shadow-lg hover:scale-105 relative z-10" :class="[
            shapeClass,
            hasPrimaryAccentColor ? 'text-current' : 'text-black dark:text-white',
          ]"
          :style="accentTextStyle"
          alt="Scalable Design Participation Lab Logo"
          to="https://www.northeastern.edu/"
          target="_blank"
        >
          🤲
        </UButton>
        <UButton
          v-if="logoSrc"
          class="w-10 lg:w-12 !rounded-lg flex justify-center !bg-gray-50 dark:!bg-black shadow-lg hover:scale-105" :class="[
            shapeClass,
          ]"
          :to="logoLink"
          target="_blank"
        >
          <img
            :src="logoSrc"
            :alt="logoAlt"
            class="w-9/12 h-auto"
          >
        </UButton>
        <template v-for="(item, index) in leftItems" :key="index">
          <NuxtLink v-if="item.to" v-slot="{ navigate }" :to="item.to" custom>
            <UButton
              :variant="item.variant"
              :color="item.color || (item.primary ? 'black' : 'gray')"
              :icon="item.icon"
              class="h-full px-3 sm:px-4 !rounded-lg text-xs sm:text-sm md:text-base lg:text-lg shadow-lg text-black dark:text-white !bg-gray-50 dark:!bg-black hover:scale-105" :class="[
                shapeClass,
                hasPrimaryAccentColor ? 'text-current' : 'text-black dark:text-white',
              ]"
              :style="accentTextStyle"
              @click="navigate"
            >
              {{ item.label }}
            </UButton>
          </NuxtLink>
          <UButton
            v-else
            :variant="item.variant"
            :color="item.color || (item.primary ? 'black' : 'gray')"
            :icon="item.icon"
            class="h-full px-3 sm:px-4 !rounded-lg text-xs sm:text-sm md:text-base lg:text-lg shadow-lg text-black dark:text-white !bg-gray-50 dark:!bg-black hover:scale-105" :class="[
              shapeClass,
              hasPrimaryAccentColor ? 'text-current' : 'text-black dark:text-white',
            ]"
            :style="accentTextStyle"
            @click="item.onClick"
          >
            {{ item.label }}
          </UButton>
        </template>
      </div>
      <!-- items right -->
      <div class="h-full flex space-x-2 sm:space-x-3 items-center relative z-10">
        <template v-for="(item, index) in rightItems" :key="index">
          <UDropdown v-if="item.dropdown" v-bind="item.dropdown">
            <UButton
              :icon="item.icon"
              class="h-full px-3 md:px-5 lg:px-6 text-xs sm:text-sm md:text-base lg:text-lg rounded-full !bg-gray-50 dark:!bg-black shadow-lg" :class="[
                shapeClass,
                hasPrimaryAccentColor
                  ? 'text-current hover:!bg-gray-50 dark:hover:!bg-black'
                  : 'text-black dark:text-white hover:invert',
              ]"
              :style="accentTextStyle"
            >
              {{ item.label }}
            </UButton>
          </UDropdown>
          <NuxtLink
            v-else-if="item.to"
            v-slot="{ navigate }"
            :to="item.to"
            custom
          >
            <UButton
              :variant="item.variant"
              :color="item.color"
              :icon="item.icon"
              class="h-full px-2 md:px-3 lg:px-4 text-xs md:text-base lg:text-lg rounded-full hidden md:flex shadow-lg" :class="[
                shapeClass,
                hasPrimaryAccentColor
                  ? '!bg-gray-50 dark:!bg-black text-current hover:!bg-gray-50 dark:hover:!bg-black'
                  : '!bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black dark:hover:!bg-slate-800 text-black dark:text-white',
              ]"
              :style="accentTextStyle"
              @click="navigate"
            >
              {{ item.label }}
            </UButton>
          </NuxtLink>
          <UButton
            v-else
            :icon="item.icon"
            class="h-full px-2 md:px-3 lg:px-4 text-xs md:text-base lg:text-lg rounded-full hidden md:flex shadow-lg" :class="[
              shapeClass,
              hasPrimaryAccentColor
                ? '!bg-gray-50 dark:!bg-black text-current hover:!bg-gray-50 dark:hover:!bg-black'
                : '!bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black dark:hover:!bg-slate-800 text-black dark:text-white',
            ]"
            :style="accentTextStyle"
            @click="item.onClick"
          >
            {{ item.label }}
          </UButton>
        </template>
        <!-- Dark Mode Toggle -->
        <UColorModeButton
          class="h-full px-2 md:px-3 lg:px-4 text-xs hidden md:flex shadow-lg" :class="[
            shapeClass,
            hasPrimaryAccentColor
              ? '!bg-gray-50 dark:!bg-black text-current hover:!bg-gray-50 dark:hover:!bg-black'
              : '!bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black dark:hover:!bg-slate-800 text-black dark:text-white',
          ]"
          :style="accentTextStyle"
          @click="isDark = !isDark"
        />
        <!-- Menu -->
        <UButton
          class="h-full px-2 md:px-2 lg:px-3.5 text-lg shadow-lg" :class="[
            shapeClass,
            hasPrimaryAccentColor
              ? '!bg-gray-50 dark:!bg-black text-current hover:!bg-gray-50 dark:hover:!bg-black'
              : '!bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black dark:hover:!bg-slate-800 text-black dark:text-white',
          ]"
          :style="accentTextStyle"
          icon="i-heroicons-ellipsis-horizontal-20-solid"
          @click="showMenuModal = true"
        />
      </div>
    </header>

    <!-- Add popups -->
    <MenuModal v-model="showMenuModal" @select="handleMenuSelect" />
  </div>
</template>

<style scoped>
.header-backdrop {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
