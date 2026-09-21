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

<script lang="ts">
// Who the app belongs to and its accent color come from app.json (`brand` /
// `theme.accent`), not from a spec: chrome is base's job, so a page cannot
// restyle the header and no spec repeats the logo per page. Props still win,
// for apps without a manifest and for tests. This has to be a plain <script>
// block: defineProps() is hoisted out of setup and cannot see setup locals.
import { computed, ref } from 'vue'
import { useAppManifest } from '../composables/useAppManifest'

const { manifest } = useAppManifest()
const brand = manifest?.brand ?? {}
</script>

<script setup lang="ts">
/**
 * Props for the GeneralizedHeader component
 * @typedef {object} GeneralizedHeaderProps
 * @property {Array<{label: string, to?: string, target?: string, onClick?: Function, variant?: string, color?: string, icon?: string, primary?: boolean}>} leftItems - Items for the left side of the header
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
    default: brand.logoLink ?? '',
  },
  logoSrc: {
    type: String,
    default: brand.logo ?? '',
  },
  logoAlt: {
    type: String,
    default: brand.logoAlt ?? 'Logo',
  },
  primaryAccentColor: {
    type: String,
    default: manifest?.theme?.accent ?? '',
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
  showLogo: {
    type: Boolean,
    default: true,
  },
  iconLink: {
    type: String,
    default: brand.iconLink ?? 'https://www.northeastern.edu/',
  },
  shape: {
    type: String,
    default: 'rounded',
    validator: (value: string) => ['rounded', 'rectangular'].includes(value),
  },
  // Whether to show the top-right ellipsis menu button. Apps that have moved
  // their nav elsewhere (e.g. MNC) can hide it without affecting other apps.
  showMenu: {
    type: Boolean,
    default: true,
  },
  showColorMode: {
    type: Boolean,
    default: true,
  },
  /**
   * 'pill' (default) renders every item as a floating button; 'text' renders
   * plain text links (a label may contain a line break for two-line labels).
   */
  variant: {
    type: String,
    default: 'pill',
    validator: (value: string) => ['pill', 'text'].includes(value),
  },
})

const emit = defineEmits(['menu'])

// The menu itself is app-specific: render it in the `menu` slot (receives
// `open` / `close`) or listen to the `menu` event.
const showMenuModal = ref(false)
function openMenu() {
  showMenuModal.value = true
  emit('menu')
}
function closeMenu() {
  showMenuModal.value = false
}

// The floating look every piece of header chrome shares. It is a constant, not
// a prop: a page picks what goes in the header, never how it is painted.
const chromeClass = '!bg-gray-50 dark:!bg-black shadow-lg'
const textLinkClass = 'whitespace-pre-line text-center text-xs leading-tight text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
const textLinkActiveClass = '!text-black dark:!text-white'

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
    <header class="h-10 lg:h-12 fixed top-6 left-6 right-6 flex justify-between bg-transparent z-40">
      <!-- items left -->
      <div class="h-full flex relative" :class="variant === 'text' ? 'gap-3' : 'space-x-2 sm:space-x-3'">
        <UButton
          v-if="showIcon"
          class="w-10 lg:w-12 text-xl sm:text-2xl !rounded-lg flex justify-center !bg-gray-50 dark:!bg-black shadow-lg hover:scale-105 relative z-10" :class="[
            shapeClass,
            hasPrimaryAccentColor ? 'text-current' : 'text-black dark:text-white',
          ]"
          :style="accentTextStyle"
          alt="Scalable Design Participation Lab Logo"
          :to="iconLink"
          target="_blank"
        >
          🤲
        </UButton>
        <UButton
          v-if="showLogo && logoSrc"
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
        <!-- Anything that isn't an image logo: a text wordmark, an SVG, ... -->
        <slot name="logo" />
        <div
          v-if="variant === 'text' && leftItems.length"
          class="h-full flex items-center gap-6 px-6 relative z-10" :class="[shapeClass, chromeClass]"
        >
          <NuxtLink
            v-for="(item, index) in leftItems"
            :key="index"
            :to="item.to"
            :class="textLinkClass"
            :active-class="textLinkActiveClass"
            :style="accentTextStyle"
            @click="item.onClick"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <template v-for="(item, index) in leftItems" :key="index">
          <UButton
            v-if="variant !== 'text' && item.to"
            :to="item.to"
            :target="item.target"
            :variant="item.variant"
            :color="item.color || (item.primary ? 'black' : 'gray')"
            :icon="item.icon"
            class="h-full px-3 sm:px-4 !rounded-lg text-xs sm:text-sm md:text-base lg:text-lg shadow-lg text-black dark:text-white !bg-gray-50 dark:!bg-black hover:scale-105" :class="[
              shapeClass,
              hasPrimaryAccentColor ? 'text-current' : 'text-black dark:text-white',
            ]"
            :style="accentTextStyle"
          >
            {{ item.label }}
          </UButton>
          <UButton
            v-else-if="variant !== 'text'"
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
      <!-- A wordmark or title centred across the bar, independent of how wide
           the two sides are. Pointer events only on the content itself, so it
           never swallows a click meant for the map behind it. -->
      <div v-if="$slots.center" class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="pointer-events-auto">
          <slot name="center" />
        </div>
      </div>

      <!-- items right -->
      <div class="h-full flex items-center relative z-10" :class="variant === 'text' ? 'gap-3' : 'space-x-2 sm:space-x-3'">
        <div
          v-if="variant === 'text' && rightItems.length"
          class="h-full flex items-center gap-6 px-6" :class="[shapeClass, chromeClass]"
        >
          <NuxtLink
            v-for="(item, index) in rightItems"
            :key="index"
            :to="item.to"
            :class="textLinkClass"
            :active-class="textLinkActiveClass"
            :style="accentTextStyle"
            @click="item.onClick"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <template v-for="(item, index) in rightItems" :key="index">
          <UDropdown v-if="variant !== 'text' && item.dropdown" v-bind="item.dropdown">
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
            v-else-if="variant !== 'text' && item.to"
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
            v-else-if="variant !== 'text'"
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
        <!-- Extra controls that are not plain items (e.g. MapTypeToggle) -->
        <slot name="right" />
        <!-- Dark Mode Toggle -->
        <UColorModeButton
          v-if="showColorMode"
          class="h-full px-2 md:px-3 lg:px-4 text-xs hidden md:flex shadow-lg" :class="[
            shapeClass,
            hasPrimaryAccentColor
              ? '!bg-gray-50 dark:!bg-black text-current hover:!bg-gray-50 dark:hover:!bg-black'
              : '!bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black dark:hover:!bg-slate-800 text-black dark:text-white',
          ]"
          :style="accentTextStyle"
        />
        <!-- Menu -->
        <UButton
          v-if="showMenu"
          class="h-full px-2 md:px-2 lg:px-3.5 text-lg shadow-lg" :class="[
            shapeClass,
            hasPrimaryAccentColor
              ? '!bg-gray-50 dark:!bg-black text-current hover:!bg-gray-50 dark:hover:!bg-black'
              : '!bg-gray-50 hover:!bg-black hover:!text-white dark:!bg-black dark:hover:!bg-slate-800 text-black dark:text-white',
          ]"
          :style="accentTextStyle"
          icon="i-heroicons-ellipsis-horizontal-20-solid"
          @click="openMenu"
        />
      </div>
    </header>

    <slot name="menu" :open="showMenuModal" :close="closeMenu" />
  </div>
</template>

<style scoped>
.header-backdrop {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
